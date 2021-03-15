const debug = require('debug')(`linto:skill:v2:core:transcribe:linstt`)

const TRANSCRIBE_PATH = 'transcribe'
const tts = require('../data/tts')

module.exports = async function (msg) {
  let audio = msg.payload.audio

  if (audio) {
    let audioBuffer = Buffer.from(audio, 'base64')
    delete msg.payload.audio
    if (Buffer.isBuffer(audioBuffer)) {
      let isConfidence = false  // WIP: Do we need confidence with STT ?
      let options = prepareRequest(audioBuffer, isConfidence)

      try {
        let requestUri = this.config.transcribe.host

        if (this.config.transcribe.commandOffline !== undefined && this.config.transcribe.commandOffline !== '') {
          requestUri = 'http://' + this.config.transcribe.commandOffline + '/' + TRANSCRIBE_PATH
        } else throw new Error('Configuration missing')

        let transcriptResult = await this.request.post(requestUri, options)

        msg.payload.transcript = wrapperLinstt(transcriptResult, isConfidence)


        return msg
      } catch (err) {
        this.notifyEventError(msg.payload.topic, tts[this.getFlowConfig('language').language].say.unknown, { message: err.message, code: 500 })
        throw new Error(err)
      }
    }
  }
  throw new Error('Input should containt an audio buffer')
}

function prepareRequest(buffer, isConfidence) {
  let accept = 'text/plain'
  if (isConfidence) accept = 'application/json'

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

function wrapperLinstt(transcript, isConfidence) {
  let text = ""
  let confidence = 0

  if (isConfidence) {
    let jsonTranscript = JSON.parse(transcript)
    if (jsonTranscript === undefined || jsonTranscript.text.length === 0) throw new Error('Transcription was empty')

    jsonTranscript.speakers.map(speaker => speaker.words.map(words => text += words.word + " "))
    if (text === "") throw new Error('Transcription was empty')

    confidence = jsonTranscript['confidence-score']
  } else {
    text = transcript.toString('utf8')
    if (text === undefined || text.length === 0) throw new Error('Transcription was empty')
  }

  return {
    text,
    confidence,
    isConfidence
  }
}