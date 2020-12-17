const debug = require('debug')('linto:skill:v2:core:linto-transcribe-streaming')
const LintoCoreEventNode = require('@linto-ai/linto-components').nodes.lintoCoreEventNode
const { request, wireEvent } = require('@linto-ai/linto-components').components

module.exports = function (RED) {
  function Node(config) {
    RED.nodes.createNode(this, config)
    new LintoTranscribe(RED, this, config)
  }
  RED.nodes.registerType('linto-transcribe-streaming', Node)
}

class LintoTranscribe extends LintoCoreEventNode {
  constructor(RED, node, config) {
    super(RED, node, config)

    this.config = {
      ...config,
      transcribe: { ...this.getFlowConfig('configTranscribe') }
    }

    this.request = request
    this.wireEvent = wireEvent.init(RED)
    this.init()
  }

  async init() {
    let transcribeService = await this.loadModule(`${__dirname}/api/${this.config.transcribe.api}`)
    this.wireNode.onMessage(this, transcribeService)
  }
}