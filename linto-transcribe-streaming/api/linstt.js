const debug = require('debug')(`linto:skill:v2:core:transcribe-streaming:linstt`)
const WebSocket = require('ws')
const DEFAULT_CONFIG = '{"config": {"sample_rate":16000, "metadata":1 }}'

let websocket = {}

module.exports = async function (msg) {
  let largeVocabStreaming = this.config.transcribe.largeVocabStreaming
  const [_clientCode, _channel, _sn, _etat, _type] = msg.payload.topic.split('/')
  let topic = `${_clientCode}/${_channel}/${_sn}/${_etat}`

  switch (_type) {
    case 'start':
      startWS.call(this, largeVocabStreaming, _sn, topic, msg)
      this.sendPayloadToLinTO(topic + '/start', { streaming: { status: 'started' } })
      break
    case 'stop':
      stopWS(_sn)
      this.sendPayloadToLinTO(topic + '/stop', { streaming: { status: 'stop' } })
      break
    case 'chunk':
      onMessage(msg.payload.chunk, _sn)
      break
  }
  return msg
}

function startWS(host, id, topic, msg) {
  websocket[id] = new WebSocket('wss://' + host)
  websocket[id].linto_id = id
  websocket[id].linto_topic = topic
  websocket[id].skillLinto = this

  websocket[id].on('open', function open() {
    if (msg.payload.config) {
      delete msg.payload.auth_token
      this.send(JSON.stringify(msg.payload))
    }
    else this.send(DEFAULT_CONFIG)
  })

  websocket[id].on('message', function incoming(msg) {
    const topicChunk = this.linto_topic + '/chunk'
    const topicFinal = this.linto_topic + '/final'

    let data = JSON.parse(msg)
    if ('partial' in data) this.skillLinto.sendPayloadToLinTO(topicChunk, { streaming: { partial: data.partial } }, 0)
    else if ('text' in data && !('words' in data)) this.skillLinto.sendPayloadToLinTO(topicChunk, { streaming: { text: data.text } })
    else if ('words' in data) this.skillLinto.sendPayloadToLinTO(topicFinal, { streaming: { "status": "final", result: JSON.stringify(data, null, 4) } })
    else if ('eod' in data) this.close()
    else console.error("unsupported msg", data)
  })
}

function stopWS(id) {
  websocket[id].send('{"eof" : 1}')
  websocket[id].on('close', function close() {
    console.log('disconnected')
  })
  websocket[id].close()
  delete websocket[id]
}

function onMessage(chunk, _id) {
  websocket[_id].send(chunk)
}