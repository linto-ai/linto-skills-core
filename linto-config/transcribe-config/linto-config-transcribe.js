const debug = require('debug')('linto:skill:v2:core:linto-config:transcribe-config')

module.exports = function (RED) {
  function LintoConfigTranscribe(n) {
    RED.nodes.createNode(this, n)
    this.host = n.host
    this.api = n.api

    if (n.largeVocabStreamingInternal === 'false') n.ws = 'wss://'
    else n.ws = 'ws://' // By default streaming service is internal

    this.config = {
      host: process.env.LINTO_STACK_STT_SERVICE_MANAGER_SERVICE,
      api: n.api,
      commandOffline: n.commandOffline,
      largeVocabStreaming: n.largeVocabStreaming,
      largeVocabStreamingInternal: n.largeVocabStreamingInternal,
      ws: n.ws,
      largeVocabOffline: n.largeVocabOffline
    }
  }
  RED.nodes.registerType("linto-config-transcribe", LintoConfigTranscribe)
}