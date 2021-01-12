const debug = require('debug')(`linto:skill:v2:core:application-in:topic:nlp`)

module.exports = async function (topic, payload, applicationAuthType) {
  this.wireNode.nodeSend(this.node, {
    payload: {
      topic,
      audio: payload.audio,
      conversationData: payload.conversationData
    }
  })
}