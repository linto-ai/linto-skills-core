const debug = require('debug')(`linto:skill:v2:core:chatbot:tock`)

const tts = require('../data/tts')

module.exports = async function (msg) {
  try {
    if (msg.payload.conversationData) {/*TODO: Future update*/ }

    let chatbotConfig = this.config
    if (!chatbotConfig.host || !chatbotConfig.namespace || !chatbotConfig.appname || !chatbotConfig.botId)
      this.notifyEventError(msg.payload.topic, tts[this.getFlowConfig('language').language].say.missingConfig, { message: 'Missing server configuration', code: 500 })
    else if (!msg.payload.text)//TODO: no text found
      this.notifyEventError(msg.payload.topic, tts[this.getFlowConfig('language').language].say.missingText, { message: 'Missing information', code: 500 })
    else {
      let text = msg.payload.text
      let options = prepareRequest.call(this, text)
      let requestResult = await this.request.post('http://' + this.config.host + '/rest/admin/test/talk', options)

      let botOutput = wrapper(requestResult)
      let result = {
        customAction: {},
        chatbot: {
          ask: msg.payload.text,
          answer: botOutput
        }
      }

      this.sendPayloadToLinTO(msg.payload.topic, result)
    }
  } catch (err) {
    this.notifyEventError(msg.payload.topic, tts[this.getFlowConfig('language').language].say.unknown, { message: err.body, code: 500 })
    throw new Error(err.body)
  }
}

function prepareRequest(text) {
  let language = this.getFlowConfig('language').lang

  const auth = 'Basic ' + Buffer.from(this.config.username + ':' + this.config.password).toString('base64')

  let options = {
    headers: {
      'content-type': 'application/json',
      Authorization: auth
    },
    body: {
      namespace: this.config.namespace,
      applicationName: this.config.appname,
      botApplicationConfigurationId: this.config.botId,
      language,
      message: {
        eventType: "sentence",
        text
      },
    },
    json: true
  }

  return options
}


function wrapper(answer) {
  let output = {
    text: '',
    data: []
  }
  try {
    answer.messages.map(msg => {
      if (msg.text) {
        output.text += msg.text
        output.data.push({
          text: msg.text,
          eventType: msg.eventType
        })
      }

      if (msg.messages) {
        msg.messages.map(msgConnector => {
          if (msgConnector.connectorType && msgConnector.connectorType.id === 'web') {
            if (msgConnector.texts && msgConnector.texts.text) {
              output.text += msgConnector.texts.text
              output.data.push({
                text: msgConnector.texts.text,
                eventType: msg.eventType
              })
            }
            msgConnector.choices.map(choice => {
              output.data.push({
                eventType: choice.eventType,
                intentName: choice.intentName,
                text: choice.parameters._nlp
              })
            })
            msgConnector.attachments.map(attachment => {
              output.data.push({
                eventType: attachment.eventType,
                url: attachment.url
              })
            })

          }
        })
      }
    })
    return output
  } catch (err) {
    throw err
  }
}