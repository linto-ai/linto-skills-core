const debug = require('debug')('linto:skill:v2:core:linto-model-dataset:lexical-seeding:linstt')
const _ = require('lodash')

const REGEX_DEFINE_ENTITY = new RegExp('\\[(.*?)\\]\\((.*?)\\)', 'g')
const REGEX_STT_ENTITY = new RegExp('#\\S*', 'gm')

const BACKLINE_SEPARATOR = '\n'
const COMMAND_DELIMITER = '- '
const DASH_FILTER = '-'
const INTENT_METADATA_SEPARATOR = '##intent'
const COMMAND_METADATA_SEPARATOR = '|'
const ENTITY_METADATA_SEPARATOR = ']('
const DICTIONARY_LANGUAGE_SEPARATOR = '##'

const COMMAND_METADATA_SEEDING = '#'
const COMMAND_REGEX = /[^#a-zàâäçèéêëîïôùûü\-\' ]/g

let isValidCmd = (cmd) => {
  if (COMMAND_REGEX.exec(cmd))
    return false
  return true
}

module.exports = (skills, dictionaries, flowLanguage) => {

  dictionaries = checkWiredDictionaries(skills, dictionaries)

  let seed
  dictionaries.map(dictionary => {
    let entity, entityError

    dictionary.data.split(BACKLINE_SEPARATOR).map(cmd => {
      cmd = cmd.toLowerCase()
      if (cmd.indexOf(DICTIONARY_LANGUAGE_SEPARATOR) > -1) {
        if (entity && (entity.lang === flowLanguage.language || entity.lang === flowLanguage.lang)) {
          seed.data.entities.push(entity)
          entityError.items.length !== 0 ? seed.errors.entities.push(entityError) : undefined
        }

        entity = extractEntityData(dictionary, cmd)
        entityError = _.cloneDeep(entity)

        if (!seed)
          seed = { lang: flowLanguage.language, data: { intents: [], entities: [] }, errors: { intents: [], entities: [] } }

      } else if (cmd !== '' && entity !== undefined && entity.items.indexOf(cmd) === -1) {
        isValidCmd(cmd) ? entity.items.push(cmd) : entityError.items.push(cmd)
      }
    })

    if (entity && (entity.lang === flowLanguage.language || entity.lang === flowLanguage.lang)) {
      seed.data.entities.push(entity)  // add last full entity
      entityError.items.length !== 0 ? seed.errors.entities.push(entityError) : undefined
    }
  })

  skills.map(skill => {
    let intent, intentError
    skill.command.split(BACKLINE_SEPARATOR).map(cmd => {
      cmd = cmd.toLowerCase()

      if (cmd.indexOf(INTENT_METADATA_SEPARATOR) > -1) {
        if (intent && (intent.lang === flowLanguage.language || intent.lang === flowLanguage.lang)) {
          seed.data.intents.push(intent) //add fullintent
          intentError.items.length !== 0 ? seed.errors.intents.push(intentError) : undefined
        }

        intent = extractCommandData(cmd)
        intentError = _.cloneDeep(intent)

        if (!seed)
          seed = { lang: flowLanguage.language, data: { intents: [], entities: [] }, errors: { intents: [], entities: [] } }
      } else if (cmd !== '') {
        let line = cmd
          .replace(COMMAND_DELIMITER, '')
          .replace(DASH_FILTER, ' ')
          .replace(/ +/g, ' ')
          .replace(/æ/g, 'ae')
          .replace(/œ/g, 'oe')
          .replace(/’/g, '\'')
          .replace(/ʼ/g, '\'')

        if (!line.indexOf(COMMAND_METADATA_SEEDING)) {
          line = manageUndefinedDictionary(line, dictionaries)
        }

        if (cmd.indexOf(ENTITY_METADATA_SEPARATOR) > -1) {
          line = exctractDefinedEntity.call(seed, line, intent.lang, flowLanguage.lang) //extract and manage intent and entity
        }

        if (line && intent.items.indexOf(line) === -1) {
          isValidCmd(line) ? intent.items.push(line) : intentError.items.push(line)
        }
      }
    })
    if (intent && (intent.lang === flowLanguage.language || intent.lang === flowLanguage.lang)) {
      seed.data.intents.push(intent) // add last full intent
      intentError.items.length !== 0 ? seed.errors.intents.push(intentError) : undefined
    }
  })
  return seed
}

function checkWiredDictionaries(skills, dictionaries) {
  let dictionariesWired = []
  dictionaries.filter(dictionary => {
    skills.map(skill => {
      if (skill.wires[0].includes(dictionary.id))
        return dictionariesWired.push(dictionary)
    })
  })

  return dictionariesWired
}

function manageUndefinedDictionary(line, dictionaries) {
  let match = undefined
  while (match = REGEX_STT_ENTITY.exec(line)) {
    let isDefined = false
    dictionaries.map(dictionary => {
      if (COMMAND_METADATA_SEEDING + dictionary.name === match[0]) {
        isDefined = true
      }
    })
    if (!isDefined)
      return undefined
  }

  return line
}

function extractEntityData(dictionary, cmd) {
  let lang = cmd.slice(DICTIONARY_LANGUAGE_SEPARATOR.length, cmd.length)
  return {
    name: dictionary.name,
    items: [],
    entity: dictionary.name,
    lang
  }
}

function extractCommandData(cmd) {
  let cmdMetadata = cmd.split(COMMAND_METADATA_SEPARATOR)
  return {
    name: cmdMetadata[1],
    items: [],
    intent: cmdMetadata[1],
    lang: cmdMetadata[2]
  }
}

function exctractDefinedEntity(cmd, lang, flowLang) {
  let match = null
  let line = cmd

  if (lang === flowLang) {
    while (match = REGEX_DEFINE_ENTITY.exec(cmd)) {
      line = line.replace(match[0], `${COMMAND_METADATA_SEEDING}${match[2]}`)
      let isAdded = false
      this.data.entities.map(entity => {
        if (entity.name === match[2]) {
          isAdded = true

          if (entity.items.indexOf(match[1]) === -1)
            entity.items.push(match[1])
        }
      })
      if (!isAdded) this.data.entities.push({ name: match[2], items: [match[1]] })
    }
  }

  return line
}