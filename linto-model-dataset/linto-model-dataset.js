const debug = require('debug')('linto:skill:v2:core:linto-model-dataset')
const LintoCoreNode = require('@linto-ai/linto-components').nodes.lintoCoreNode
const { redAction, request } = require('@linto-ai/linto-components').components

const seeding = require('./lexical-seeding')

module.exports = function (RED) {
  function Node(config) {
    RED.nodes.createNode(this, config)
    new LintoModelDataset(RED, this, config)
  }
  RED.nodes.registerType('linto-model-dataset', Node)
}

class LintoModelDataset extends LintoCoreNode {
  constructor(RED, node, config) {
    super(node, config)

    this.request = request
    this.init(RED)
  }

  async init(RED) {
    //Create API on host : http://<host>:<port>/red-nodes/<:flowId>/dataset/tock
    RED.httpNode.get(`/${this.node.z}/dataset/tock`, async (req, res) => {
      const configEvaluate = this.getFlowConfig('configEvaluate')
      const flowLanguage = this.getFlowConfig('language')

      if (configEvaluate && configEvaluate.api === 'tock') {
        let skillsNode = redAction.getNodesFromName.call(RED, this.node.z, 'skill')
        let dictionaryNode = redAction.getNodesFromName.call(RED, this.node.z, 'dictionary')

        let output = await seeding.tock(skillsNode, dictionaryNode, configEvaluate, flowLanguage)
        res.send(output)
      } else {
        res.send({ err: `This flow don't use tock api` })
      }
    })

    //Create API on host : http://<host>:<port>/red-nodes/<:flowId>/dataset/linstt
    RED.httpNode.get(`/${this.node.z}/dataset/linstt`, async (req, res) => {
      const configTranscribe = this.getFlowConfig('configTranscribe')
      const flowLanguage = this.getFlowConfig('language')

      if (configTranscribe && configTranscribe.api === 'linstt') {
        let skillsNode = redAction.getNodesFromName.call(RED, this.node.z, 'skill')
        let dictionaryNode = redAction.getNodesFromName.call(RED, this.node.z, 'dictionary')

        let output = await seeding.linstt(skillsNode, dictionaryNode, flowLanguage)
        res.send(output)
      } else {
        res.send({ err: `This flow don't use linstt api` })
      }
    })
  }
}