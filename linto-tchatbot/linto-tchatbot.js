const debug = require('debug')('linto:skill:v2:core:linto-tchatbot')
const LintoCoreEventNode = require('@linto-ai/linto-components').nodes.lintoCoreEventNode
const { request } = require('@linto-ai/linto-components').components

module.exports = function (RED) {
  function Node(config) {
    RED.nodes.createNode(this, config)
    new LintoTchatbot(RED, this, config)
  }
  RED.nodes.registerType('linto-tchatbot', Node)
}

class LintoTchatbot extends LintoCoreEventNode {
  constructor(RED, node, config) {
    super(RED, node, config)

    this.config = {
      ...config,
      tchatbot: { ...this.getFlowConfig('configTchatbot') }
    }

    this.request = request
    this.init()
  }

  async init() {
    let tchatbot = await this.loadModule(`${__dirname}/api/tock-tchatbot`)
    this.wireNode.onMessage(this, tchatbot)
  }
}