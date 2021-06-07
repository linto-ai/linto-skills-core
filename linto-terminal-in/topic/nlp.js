const debug = require('debug')(`linto:skill:v2:core:terminal-in:topic:nlp`)

module.exports = function (topic, payload) {
  try{
  const [_clientCode, _channel, _sn, _etat, _type, _id] = topic.split('/')

  const output = `${_clientCode}/tolinto/${_sn}/nlp/file/${_id}`
  let jsonParsePayload = JSON.parse(payload)

  let msg = {
    payload: {
      topic: output,
      audio: jsonParsePayload.audio,
      conversationData: jsonParsePayload.conversationData
    }
  }
  this.wireNode.nodeSend(this.node, msg)

  this.cleanStatus()
} catch (err) {
  this.sendStatus('red  ', 'ring', err.message)
}
}
