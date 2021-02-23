const debug = require('debug')('linto:skill:v2:core:linto-application-in')
const LintoConnectCoreNode = require('@linto-ai/linto-components').nodes.lintoConnectCoreNode
const { wireEvent } = require('@linto-ai/linto-components').components

const TOPIC_SUBSCRIBE = '#'
const TOPIC_FILTER = ['nlp', 'streaming', 'tchatbot']

const DEFAULT_TOPIC = '+'

module.exports = function (RED) {
  function Node(config) {
    RED.nodes.createNode(this, config)
    new LintoApplicationIn(RED, this, config)
  }
  RED.nodes.registerType('linto-application-in', Node)
}

class LintoApplicationIn extends LintoConnectCoreNode {
  constructor(RED, node, config) {
    super(node, config)

    this.wireEvent = wireEvent.init(RED)
    this.init()
  }

  async init() {
    await this.autoloadTopic(__dirname + '/topic')
    await this.configure()

    let mqttConfig = this.getFlowConfig('confMqtt')
    if (mqttConfig) {
      let res = await this.mqtt.connect(mqttConfig)

      this.mqtt.subscribeToLinto(mqttConfig.fromLinto, DEFAULT_TOPIC, TOPIC_SUBSCRIBE)
      this.mqtt.onMessage(mqttHandler.bind(this), TOPIC_FILTER)
    } else this.sendStatus('yellow', 'ring', 'Configuration is missing')
  }
}

async function mqttHandler(topic, payload) {
  const [_clientCode, _channel, _sn, _etat, _type, _id] = topic.split('/')
  switch (_etat) {
    case 'nlp':
      this.topicHandler.nlp.call(this, topic, payload)
      break
    case 'streaming':
      this.topicHandler.lvcsrstreaming.call(this, topic, payload)
      break
    case 'tchatbot':
      // For tchatbot _type = _id
      this.topicHandler.tchatbot.call(this, topic, payload)
      break
    default:
      const outTopic = `${_clientCode}/tolinto/${_sn}/streaming/${_id}`
      this.notifyEventError(outTopic, text.say.streaming_not_started, 'User need to start a streaming process')

      console.error('No data to store message')
      break
  }
}