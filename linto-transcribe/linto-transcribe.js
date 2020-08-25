const debug = require('debug')('linto:skill:v2:core:linto-transcribe')
const LintoCoreEventNode = require('@linto-ai/linto-components').nodes.lintoCoreEventNode
const { request } = require('@linto-ai/linto-components').components

module.exports = function (RED) {
  function Node(config) {
    RED.nodes.createNode(this, config)
    new LintoTranscribe(RED, this, config)
  }
  RED.nodes.registerType('linto-transcribe', Node)
}

class LintoTranscribe extends LintoCoreEventNode {
  constructor(RED, node, config) {
    super(RED, node, config)

    this.config = {
      ...config,
      transcribe: { ...this.getFlowConfig('configTranscribe') }
    }

    this.request = request
    this.init()
  }

  async init() {
    let transcribeService = await this.loadModule(`${__dirname}/api/${this.config.transcribe.api}`)
    this.wireNode.onMessageSend(this, transcribeService)
  }
}