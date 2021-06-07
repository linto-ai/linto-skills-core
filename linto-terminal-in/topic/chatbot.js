const debug = require('debug')(`linto:skill:v2:core:terminal-in:topic:action`)

module.exports = function (topic, payload) {
  try {
    const payload = JSON.parse(rawPayload)

    const [_clientCode, _channel, _sn, _etat, _type] = topic.split('/')
    const output = `${_clientCode}/tolinto/${_sn}/chatbot/${_type}`
    this.wireNode.nodeSend(this.node, {
      payload: {
        topic: output,
        text: payload.text,
        conversationData: payload.conversationData
      }
    })
    this.cleanStatus()
  } catch (err) {
    this.sendStatus('red  ', 'ring', err.message)
  }
}