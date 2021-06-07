const debug = require('debug')(`linto:skill:v2:core:application-in:topic:nlp`)

module.exports = async function (topic, rawPayload) {
  try {
    const payload = JSON.parse(rawPayload)

    const [_clientCode, _channel, _sn, _etat, _type, _id] = topic.split('/')
    const output = `${_clientCode}/tolinto/${_sn}/nlp/file/${_id}`

    this.wireNode.nodeSend(this.node, {
      payload: {
        topic: output,
        audio: payload.audio,
        conversationData: payload.conversationData
      }
    })
    this.cleanStatus()
  } catch (err) {
    this.sendStatus('red  ', 'ring', err.message)
  }
}