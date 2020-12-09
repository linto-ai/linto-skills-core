const debug = require('debug')(`linto:skill:v2:core:application-in:topic:nlp`)

module.exports = async function (topic, rawPayload, applicationAuthType) {
  const payload = JSON.parse(rawPayload)

  let isConnect = await this.authToken.isAuthEnableAndValidToken(payload, applicationAuthType)
  const [_clientCode, _channel, _sn, _etat, _type, _id] = topic.split('/')
  const output = `${_clientCode}/tolinto/${_sn}/nlp/file/${_id}`

  if (isConnect) {
    this.wireNode.nodeSend(this.node, {
      payload: {
        topic: output,
        audio: payload.audio,
        conversationData: payload.conversationData
      }
    })
  }else{
    //TODO: Error auth
  }
}