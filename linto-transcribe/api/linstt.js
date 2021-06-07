const debug = require('debug')(`linto:skill:v2:core:transcribe:linstt`)

const TRANSCRIBE_PATH = 'transcribe'
const tts = require('../data/tts')

module.exports = async function (msg) {
  try {

    let audio = msg.payload.audio
    if (audio) {
      let audioBuffer = Buffer.from(audio, 'base64')
      delete msg.payload.audio
      if (Buffer.isBuffer(audioBuffer)) {
        let options = prepareRequest(audioBuffer)

        try {
          let requestUri = this.config.transcribe.host

          if (this.config.transcribe.commandOffline !== undefined && this.config.transcribe.commandOffline !== '') {
            requestUri = 'http://' + this.config.transcribe.commandOffline + '/' + TRANSCRIBE_PATH
          } else throw new Error('Configuration missing')

          let transcriptResult = await this.request.post(requestUri, options)

          msg.payload.transcript = wrapperLinstt(transcriptResult)

          return msg
        } catch (err) {
          this.notifyEventError(msg.payload.topic, tts[this.getFlowConfig('language').language].say.unknown, { message: err.message, code: 500 })
          throw new Error(err)
        }
      }
    }
    throw new Error('Input should containt an audio buffer')
  } catch (err) {
    throw err
  }
}

function prepareRequest(buffer) {
  let accept = 'text/plain'

  let options = {
    headers: {
      accept
    },
    formData: {
      file: {
        value: buffer,
        options: {
          filename: 'wavFile',
          type: 'audio/wav',
          contentType: 'audio/wav'
        }
      },
      speaker: 'no'
    },
    encoding: null
  }
  return options
}

function wrapperLinstt(transcript) {
  const text = transcript.toString('utf8')
  if (text === undefined || text.length === 0) throw new Error('Transcription was empty')
  return text
}