const debug = require('debug')(`linto:skill:v2:core:tchatbot:tock`)

const tts = require('../data/tts')

module.exports = async function (msg) {
  try {
    if(msg.payload.conversationData){
      //TODO: WIP
    }
    if(!msg.payload.text){ //TODO: no text found
      this.notifyEventError(msg.payload.topic, tts[this.getFlowConfig('language').language].say.missingText, { message: 'Missing information', code: 500 })
    }

    let text = msg.payload.text
    let options = prepareRequest.call(this, text)
    let requestResult = await this.request.post('http://' + this.config.tchatbot.host + '/rest/admin/test/talk', options)

    let botOutput = wrapper(requestResult)
    debug(botOutput)
    let result = {
      customAction: {},
      tchatbot : {
        ask: msg.payload.text,
        answer : botOutput[0]
      }
    }

    //TODO: msg.topic or msg.payload.topic
    this.sendPayloadToLinTO(msg.payload.topic, result)
    // return result
  } catch (err) {
    debug(err)
    this.notifyEventError(msg.payload.topic, tts[this.getFlowConfig('language').language].say.unknown, { message: err.message, code: 500 })
    throw new Error(err)
  }
}

function prepareRequest(text) {
  let language = this.getFlowConfig('language').lang

  let options = {
    headers: {
      'content-type': 'application/json',
      Authorization: 'Basic YWRtaW5AYXBwLmNvbTpwYXNzd29yZA=='
    },
    body: {
      namespace: this.config.tchatbot.namespace,
      applicationName: this.config.tchatbot.applicationName,
      botApplicationConfigurationId: this.config.tchatbot.applicationid,
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
  try {
    let message = answer.messages.map(msg => {
      return msg.text
    })
    return message
  } catch (err) {
    throw err
  }
}
