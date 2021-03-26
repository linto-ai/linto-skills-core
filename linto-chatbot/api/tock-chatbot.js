const debug = require('debug')(`linto:skill:v2:core:chatbot:tock`)

const tts = require('../data/tts')
const eventType = {
  attachment: 'attachment',
  button: 'choice',
  sentence: 'sentence'
}

module.exports = async function (msg) {
  try {
    if (msg.payload.conversationData) {/*TODO: Future update*/ }

    let chatbotConfig = this.config
    if (!chatbotConfig.rest)
      this.notifyEventError(msg.payload.topic, tts[this.getFlowConfig('language').language].say.missingConfig, { message: 'Missing server configuration', code: 500 })
    else if (!msg.payload.text)//TODO: no text found
      this.notifyEventError(msg.payload.topic, tts[this.getFlowConfig('language').language].say.missingText, { message: 'Missing information', code: 500 })
    else {
      let text = msg.payload.text
      const [_clientCode, _channel, _sn, _etat, _type, _id] = msg.payload.topic.split('/')
      let options = prepareRequest.call(this, text, _sn)
      let requestResult = await this.request.post('http://' + process.env.LINTO_STACK_TOCK_BOT_API + ':' + process.env.LINTO_STACK_TOCK_SERVICE_PORT + this.config.rest, options)
      LINTO_STACK_TOCK_SERVICE_PORT = 8080
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

function prepareRequest(text, userId) {
  let options = {
    headers: {
      'content-type': 'application/json'
    },
    body: {
      query: text,
      userId: userId
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
    answer.responses.map(msg => {
      if (msg.text) {
        output.text += ' ' + msg.text
        output.data.push({
          text: msg.text,
          eventType: eventType.sentence
        })
      }

      if (msg.buttons) {
        msg.buttons.map(button => {
          output.data.push({
            text: button.title,
            eventType: eventType.button
          })
        })
      }

      if (msg.card) {
        output.data.push({
          title: msg.card.title,
          subTitle: msg.card.subTitle,
          file: msg.card.file,
          type: msg.card.file.type,
          eventType: eventType.attachment
        })
      }
    })
    return output
  } catch (err) {
    throw err
  }
}