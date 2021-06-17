const debug = require('debug')(`linto:skill:v2:core:application-in:topic:skills`)

module.exports = async function (topic, rawPayload) {
  try {
    const payload = JSON.parse(rawPayload)
    const [_clientCode, _channel, _sn, _etat, _skill_name, _action_name] = topic.split('/')
    const output = `${_clientCode}/tolinto/${_sn}/skills/${_skill_name}/${_action_name}`
    this.wireNode.nodeSend(this.node, {
      payload: {
        topic: output,
        action: payload,
        conversationData: payload.conversationData
      }
    })
    this.cleanStatus()
  } catch (err) {
    this.sendStatus('red  ', 'ring', err.message)
  }
}