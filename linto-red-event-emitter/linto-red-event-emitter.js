const debug = require('debug')('linto:skill:v2:core:linto-red-event-emitter')
const LintoCoreNode = require('@linto-ai/linto-components').nodes.lintoCoreNode
const { wireEvent } = require('@linto-ai/linto-components').components

const tts = require('./data/tts')
const LINTO_OUT_EVENT = 'linto-out'

module.exports = function (RED) {
  function Node(config) {
    RED.nodes.createNode(this, config)
    new LintoRedEventEmitter(RED, this, config)
  }
  RED.nodes.registerType('linto-red-event-emitter', Node)
}

class LintoRedEventEmitter extends LintoCoreNode {
  constructor(RED, node, config) {
    super(node, config)

    this.wireEvent = wireEvent.init(RED)

    this.wireNode.onMessage(this, emitToSkills)
    this.setFlowConfig('flow_event_bus', this.wireEvent)
  }
}

function emitToSkills(msg) {
  let toEmit
  msg.payload.isConversational = false

  if (msg.payload.nlu.intent)
    toEmit = msg.payload.nlu.intent
  if (!!msg.payload.conversationData && Object.keys(msg.payload.conversationData).length !== 0 && !!msg.payload.conversationData.intent) {
    toEmit = msg.payload.conversationData.intent
    msg.payload.nlu.intent = msg.payload.conversationData.intent
    delete msg.payload['conversationData']
    msg.payload.isConversational = true
  }

  if (!toEmit || !wireEvent.isEventFlow(`${this.node.z}-${toEmit}`)) {
    toEmit = LINTO_OUT_EVENT
    msg = {
      topic: msg.payload.topic,
      payload: { say: tts[this.getFlowConfig('language').language].say.unknown }
    }
  }
  wireEvent.notify(`${this.node.z}-${toEmit}`, msg)
}