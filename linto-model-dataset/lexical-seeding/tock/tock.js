const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const debug = require('debug')('linto:skill:v2:core:linto-model-dataset:lexical-seeding:tock')
const _ = require('lodash')

const REGEX_DEFINE_ENTITY = new RegExp('\\[(.*?)\\]\\((.*?)\\)', 'g')
const REGEX_STT_ENTITY = new RegExp('#\\S*', 'g')

const DUCKLING_PREFIX = 'duckling'

const BACKLINE_SEPARATOR = '\n'
const COMMAND_DELIMITER = '- '
const DASH_FILTER = '-'
const INTENT_METADATA_SEPARATOR = '##intent'
const COMMAND_METADATA_SEPARATOR = '|'
const ENTITY_METADATA_SEPARATOR = ']('
const DICTIONARY_LANGUAGE_SEPARATOR = '##'
const DICTIONARY_COMMAND_ENTITY_SEPARATOR = '#'

const DUCKLING_ENTITY = ['amount-of-money', 'datetime', 'distance', 'duration', 'email', 'number', 'ordinal', 'phone-number', 'temperature', 'volume', 'url']

const COMMAND_REGEX = /[^#a-zàâäçèéêëîïôùûü\-\' ]/g

const isValidCmd = (cmd) => {
  if (COMMAND_REGEX.exec(cmd)) return false
  return true
}

if (isMainThread) {
  module.exports = function parseJSAsync(skills, dictionaries, tock, flowLanguage) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: {
          skills: skills,
          dictionaries: dictionaries,
          tock: tock,
          flowLanguage: flowLanguage
        }
      })
      worker.on('message', (message) => {
        resolve(message)
      })
      worker.on('error', reject)
      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`))
      })
      worker.postMessage('Hello, world!');
    })
  }
} else {
  parentPort.once('message', (message) => {
    let skills = workerData.skills
    let dictionaries = workerData.dictionaries
    let tock = workerData.tock
    let flowLanguage = workerData.flowLanguage

    let entities = generateEntities(dictionaries)

    let sentences = {
      applicationName: `${tock.namespace}:${tock.applicationName}`,
      sentences: [],
      errors: []
    }

    let application = {
      name: tock.applicationName,
      namespace: tock.namespace,
      supportedLocales: [flowLanguage.lang],
      nlpEngineType: { name: "stanford" }
    }

    skills.map(skill => {
      let intentModel
      let wiredEntity = {}
      for (let entity in entities) {
        for (let dictionaryId in entities[entity]) {
          if (skill.wires[0].includes(dictionaryId)) {
            if (wiredEntity[entity] === undefined)
              wiredEntity[entity] = {}
            let wiredNode = entities[entity][dictionaryId]
            wiredEntity[entity][wiredNode.name] = wiredNode.cmd
          }
        }
      }

      skill.command.split(BACKLINE_SEPARATOR).map(cmd => {
        cmd = cmd.toLowerCase()
        cmd = cmd.replace(COMMAND_DELIMITER, '')
          .replace(DASH_FILTER, ' ')
          .replace(/ +/g, ' ')
          .replace(/æ/g, 'ae')
          .replace(/œ/g, 'oe')
          .replace(/’/g, '\'')
          .replace(/ʼ/g, '\'')

        if (cmd.indexOf(INTENT_METADATA_SEPARATOR) > -1) {
          intentModel = extractCommandData(tock, cmd) // get generic template from intent
        } else if (cmd !== '') {
          let intent = Object.assign({}, intentModel)
          intent.text = cmd

          if (cmd.indexOf(ENTITY_METADATA_SEPARATOR) > -1) {
            intent = generateDefinedDataEntity(intent, tock) // extract entity from command
          } else if (cmd.indexOf(DICTIONARY_COMMAND_ENTITY_SEPARATOR) > -1) {
            intent = generateDictionaryEntity(intent, tock, wiredEntity) // extract entity from dictionary
          }

          if (intent && (intent.language === flowLanguage.language || intent.language === flowLanguage.lang)) {
            isValidCmd(intent.text) ? sentences.sentences.push(intent) : sentences.errors.push(intent)
          }
        }
      })
    })

    parentPort.postMessage({ application, sentences })
  })
}


function generateDictionaryEntity(intent, tock, entities) {
  let match
  let isDefined = true
  let line = intent.text
  intent.entities = []
  while (match = REGEX_STT_ENTITY.exec(intent.text)) {
    let entity = match[0].substr(1)

    if (entities && entities[intent.language] && entities[intent.language][entity]) {
      let entityCmd = entities[intent.language][entity]
      let randomSample = _.sample(entityCmd)  // take a random sample from dictionnary
      line = line.replace(match[0], randomSample)
      intent.entities.push({
        entity: getEntityName(entity, tock),
        role: entity,
        subEntities: [],
        start: match.index,
        end: match.index + randomSample.length
      })
    } else {
      isDefined = false
    }
  }
  if (!isDefined)
    return undefined

  intent.text = line
  return intent
}

function generateDefinedDataEntity(intent, tock) {
  intent.entities = []
  let match
  let line = intent.text

  while (match = REGEX_DEFINE_ENTITY.exec(intent.text)) {
    line = line.replace(match[0], match[1])
    intent.entities.push({
      entity: getEntityName(match[2], tock),
      role: match[2],
      subEntities: [],
      start: match.index,
      end: match.index + match[1].length
    })
  }
  intent.text = line
  return intent
}

function getEntityName(entity, tock) {
  if (DUCKLING_ENTITY.indexOf(entity) > -1)
    return `${DUCKLING_PREFIX}:${entity}`
  return `${tock.namespace}:${entity}`
}

function extractCommandData(tock, cmd) {
  let cmdMetadata = cmd.split(COMMAND_METADATA_SEPARATOR)
  return {
    intent: `${tock.namespace}:${cmdMetadata[1]}`,
    language: cmdMetadata[2],
    status: 'model',
    entities: [],
    text: ''
  }
}

function generateEntities(dictionaries) {
  let entities = {}
  dictionaries.map(dictionary => {
    let language
    dictionary.data.split(BACKLINE_SEPARATOR).map(cmd => {
      if (cmd.indexOf(DICTIONARY_LANGUAGE_SEPARATOR) > -1 || !language) {
        language = cmd.slice(DICTIONARY_LANGUAGE_SEPARATOR.length, cmd.length)
        if (!entities[language])
          entities[language] = {}
        if (!entities[language][dictionary.id])
          entities[language][dictionary.id] = { name: dictionary.name, cmd: [] }
      } else {
        entities[language][dictionary.id].cmd.push(cmd)
      }
    })
  })
  return entities
}