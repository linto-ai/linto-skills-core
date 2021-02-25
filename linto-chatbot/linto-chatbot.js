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
      ...config,
      chatbot: { ...this.getFlowConfig('configChatbot') }
    }

    this.request = request
    this.init()
  }

  async init() {
    let chatbot = await this.loadModule(`${__dirname}/api/tock-chatbot`)
    this.wireNode.onMessage(this, chatbot)
  }
}