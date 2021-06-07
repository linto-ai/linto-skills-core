const debug = require('debug')('linto:skill:v2:core:linto-terminal-in')
const LintoConnectCoreNode = require('@linto-ai/linto-components').nodes.lintoConnectCoreNode
const { wireEvent } = require('@linto-ai/linto-components').components

const TOPIC_SUBSCRIBE = '#'
const TOPIC_FILTER = ['nlp', 'streaming', 'chatbot', 'skills']

module.exports = function (RED) {
  function Node(config) {
    RED.nodes.createNode(this, config)
    new LintoTerminalIn(RED, this, config)
  }
  RED.nodes.registerType('linto-terminal-in', Node)
}

class LintoTerminalIn extends LintoConnectCoreNode {
  constructor(RED, node, config) {
    super(node, config)

    this.wireEvent = wireEvent.init(RED)
    this.init()
  }

  async init() {
    let mqttConfig = this.getFlowConfig('confMqtt')
    if (mqttConfig && this.config.sn) {
      await this.autoloadTopic(__dirname + '/topic')

      await this.mqtt.connect(mqttConfig)
      this.mqtt.subscribeToLinto(mqttConfig.fromLinto, this.config.sn, TOPIC_SUBSCRIBE)
      this.mqtt.onMessage(mqttHandler.bind(this), TOPIC_FILTER)
      this.cleanStatus()

      await this.configure()
    } else this.sendStatus('yellow', 'ring', 'Configuration is missing')
  }
}

function mqttHandler(topic, payload) {
  const [_clientCode, _channel, _sn, _etat, _type, _id] = topic.split('/')

  switch (_etat) {
    case 'nlp':
      this.topicHandler.nlp.call(this, topic, payload)
      break
    case 'streaming':
      this.topicHandler.lvcsrstreaming.call(this, topic, payload)
      break
    case 'chatbot':
      this.topicHandler.tchat.call(this, topic, payload)
      break
    case 'skills':  // For skills, _type = _skill_name
      this.topicHandler.skills.call(this, topic, payload)
      break
    default:
      console.error('No data to store message')
      break
  }
}
