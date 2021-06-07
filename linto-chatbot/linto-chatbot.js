const debug = require('debug')('linto:skill:v2:core:linto-chatbot')
const LintoCoreEventNode = require('@linto-ai/linto-components').nodes.lintoCoreEventNode
const { request } = require('@linto-ai/linto-components').components

module.exports = function (RED) {
  function Node(config) {
    RED.nodes.createNode(this, config)
    new LintoChatbot(RED, this, config)
  }
  RED.nodes.registerType('linto-chatbot', Node)
}

class LintoChatbot extends LintoCoreEventNode {
  constructor(RED, node, config) {
    super(RED, node, config)

    this.config = {
      ...config
    }
    this.request = request
    this.init()

    const chatBotController = require(`${__dirname}/api/tock-chatbot`)
    this.wireEvent.subscribe(this.node.z, this.node.type, chatBotController.bind(this))

    this.node.on('close', (remove, done) => {
      this.wireEvent.unsubscribe(`${this.node.z}-${this.node.type}`)
      done()
    })
  }

  async init() {
    let chatbot = await this.loadModule(`${__dirname}/api/tock-chatbot`)
    this.wireNode.onMessage(this, chatbot)
  }
}