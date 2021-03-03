const debug = require('debug')(`linto:skill:v2:core:application-in:topic:chatbot`)

module.exports = async function (topic, rawPayload) {
  const payload = JSON.parse(rawPayload)

  const [_clientCode, _channel, _sn, _etat, _type] = topic.split('/')
  const output = `${_clientCode}/tolinto/${_sn}/chatbot/${_type}`
  this.wireNode.nodeSend(this.node, {
    payload: {
      topic : output,
      text : payload.text,
      conversationData: payload.conversationData
    }
  })
}