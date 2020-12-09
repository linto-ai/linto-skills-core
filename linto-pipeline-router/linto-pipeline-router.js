const debug = require('debug')('linto:skill:v2:core:linto-pipeline-router')
const LintoCoreEventNode = require('@linto-ai/linto-components').nodes.lintoCoreEventNode
const { redAction } = require('@linto-ai/linto-components').components

const tts = require('./data/tts')
const error = require('./data/error')

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
  msg.payload.topic = `${_clientCode}/tolinto/${_sn}/${_etat}/${_type}`

  switch (_etat) {
    case 'nlp':
      msg.payload.topic += '/' + _id
      checkNodeAndSendMsg.call(this, 'linto-transcribe', [msg, null, null], 0)
      break
    case 'streaming':
      checkNodeAndSendMsg.call(this, 'linto-transcribe-streaming', [null, msg, null], 1)
      break
    case 'action':
      this.wireNode.nodeSend(this.node, [null, null, msg])  //TODO: Linto don't support action yet
      break
    default:
      this.sendPayloadToLinTO(msg.payload.topic, { streaming: { status: "error", message: error.unsuportedTopic } })
      throw new Error(error.unsuportedTopic.message)
      break
  }
}

function checkNodeAndSendMsg(searchedNode, msg, msgIndex) {
  let nextNode = redAction.findNodeType.call(this.RED, this.node.z, searchedNode)
  if (nextNode && this.node.wires[msgIndex].find(id => nextNode.id === id))
    this.wireNode.nodeSend(this.node, msg)
  else this.sendPayloadToLinTO(msg.payload.topic, { error: { status: "error", message: error.unsuportedSkill } })
}