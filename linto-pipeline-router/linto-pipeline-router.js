const debug = require('debug')('linto:skill:v2:core:linto-pipeline-router')
const LintoCoreEventNode = require('@linto-ai/linto-components').nodes.lintoCoreEventNode
const { redAction } = require('@linto-ai/linto-components').components

const tts = require('./data/tts')
const error = require('./data/error')

const ACTION_EVENT_BASE_NAME = 'customAction'

module.exports = function (RED) {
  function Node(config) {
    RED.nodes.createNode(this, config)
    new LintoPipelineRouter(RED, this, config)
  }
  RED.nodes.registerType('linto-pipeline-router', Node)
}

class LintoPipelineRouter extends LintoCoreEventNode {
  constructor(RED, node, config) {
    super(RED, node, config)
    this.config = {
      ...config,
    }
    this.RED = RED
    this.init()
  }

  async init() {
    this.wireNode.onMessage(this, routerOutputManager.bind(this))
  }
}

function routerOutputManager(msg) {
  const [_clientCode, _channel, _sn, _etat, _type, _id] = msg.payload.topic.split('/')
  const _skill = _type
  const _action = _id

  msg.payload.topic = `${_clientCode}/tolinto/${_sn}/${_etat}/${_type}`

  switch (_etat) {
    case 'nlp':
      msg.payload.topic += '/' + _id
      checkNodeAndSendMsg.call(this, 'linto-transcribe', [msg, null, null], 0)
      break
    case 'streaming':
      checkNodeAndSendMsg.call(this, 'linto-transcribe-streaming', [null, msg, null], 1)
      break
    case 'chatbot': //TODO: Rework to skills/chatbot/text
      const isChatBotFind = checkNodeInFlow.call(this, 'linto-chatbot', undefined, msg)
      if (isChatBotFind) this.wireEvent.notify(`${this.node.z}-linto-chatbot`, msg)
      else this.sendPayloadToLinTO(msg.payload.topic, { streaming: { status: "error", message: error.unsuportedSkill } })
      break
    case 'skills':
      msg.payload.topic = `${_clientCode}/tolinto/${_sn}/${ACTION_EVENT_BASE_NAME}/${_skill}/${_action}`
      if (checkNodeInFlow.call(this, `linto-skill-${_skill}`, _action, msg))
        this.wireEvent.notify(`${this.node.z}-${ACTION_EVENT_BASE_NAME}-${_action}`, msg)
      break
    default:
      this.sendPayloadToLinTO(msg.payload.topic, { streaming: { status: "error", message: error.unsuportedTopic } })
      throw new Error(error.unsuportedTopic.message)
  }
}

function checkNodeAndSendMsg(searchedNode, msg, msgIndex) {
  let nextNode = redAction.findNodeType.call(this.RED, this.node.z, searchedNode)
  if (nextNode && this.node.wires[msgIndex].find(id => nextNode.id === id))
    this.wireNode.nodeSend(this.node, msg)
  else this.sendPayloadToLinTO(msg.payload.topic, { error: { status: "error", message: error.unsuportedSkill } })
}

function checkNodeInFlow(nodeName, action, msg) {
  if (redAction.findNodeType.call(this.RED, this.node.z, `${nodeName}`)) {
    if (!action || checkActionNode.call(this, action, msg)) return true
  } else this.sendPayloadToLinTO(msg.payload.topic, { error: { status: "error", message: error.unsuportedSkill } })
  return false
}

function checkActionNode(action, msg) {
  if (this.wireEvent.isEventFlow(`${this.node.z}-${ACTION_EVENT_BASE_NAME}-${action}`)) return true

  this.sendPayloadToLinTO(msg.payload.topic, { error: { status: "error", message: error.unsuportedAction } })
  return false
}