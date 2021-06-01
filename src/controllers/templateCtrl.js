const templateSvc = require('../services/templateSvc')
const _ = require('lodash')
const mongoose = require('mongoose')
const { objReplaceKeyName } = require('../helper/resMapper')
const cError = require('../helper/customError')

const templateInputSantize = (inputsR, keys) => {
  const inputs = objReplaceKeyName(inputsR, 'id', '_id')
  return Array.isArray(inputs)
    ? inputs.map((q) => {
        return { ..._.pick(q, keys) }
      })
    : []
}

const templateLangSantize = (langInputsR) => {
  const langInputs = objReplaceKeyName(langInputsR, 'id', '_id')
  if (Array.isArray(langInputs)) {
    return langInputs.map((langI) => {
      const inputs = templateInputSantize(langI.inputs, ['_id', 'label', 'options'])
      return {
        ..._.pick(langI, ['lang']),
        inputs,
      }
    })
  } else {
    return []
  }
}

const inputsLangsValidation = (inputs, languages) => {
  try {
    const langValid = languages.reduce((langFormAcc, langForm) => {
      return (
        langFormAcc &&
        langForm.inputs &&
        langForm.inputs.length &&
        langForm.inputs.reduce((langInputAcc, langInput) => {
          const inputMatched = inputs.find((o) => o._id === langInput._id)
          let inner = langInputAcc && langInput._id && langInput.label && inputMatched
          if (inputMatched.options && inputMatched.options.length) {
            const uniqLangInput = _.uniqBy(inputMatched.options, '_id')
            const lengthEqual = uniqLangInput.length === inputMatched.options.length
            // && uniqLangInput.length == langInput.options.length
            inner =
              inner &&
              lengthEqual &&
              inputMatched.options.reduce((optionAcc, item) => {
                const langInputOption = langInput.options.find((o) => o._id === item._id)
                return optionAcc && langInputOption && langInputOption.label
              }, true)
          }
          return inner
        }, true)
      )
    }, true)
    const valid = languages && languages.length && langValid
    return valid ? true : false
  } catch (err) {
    return false
  }
}

async function createTemplate(req, res, next) {
  const name = req.body.name
  const inputs = templateInputSantize(req.body.inputs, ['_id', 'options', 'type'])
  const languages = templateLangSantize(req.body.languages)
  const valid = inputsLangsValidation(inputs, languages)
  if (!valid) {
    throw new cError.InvalidRequestPayloadException(
      "Request contains conflict(s) between 'inputs' and 'languages' fields"
    )
  }
  const template = await templateSvc.createTemplate(req.body.RESERVED_USID, name, inputs, languages)
  res.json(objReplaceKeyName(template, '_id', 'id'))
}

async function listTemplates(req, res, next) {
  const templates = await templateSvc.listTemplates(req.body.RESERVED_USID)
  res.json(objReplaceKeyName(templates, '_id', 'id'))
}

async function deleteTemplate(req, res, next) {
  const templateId = req.params.templateId
  const template = await templateSvc.deleteTemplate(req.body.RESERVED_USID, templateId)
  res.json(objReplaceKeyName(template, '_id', 'id'))
}

async function modifyTemplate(req, res, next) {
  const USID = req.body.RESERVED_USID
  const templateId = req.params.templateId
  const name = req.body.name
  const inputs = templateInputSantize(req.body.inputs, ['_id', 'options', 'type'])
  const languages = templateLangSantize(req.body.languages)
  const valid = inputsLangsValidation(inputs, languages)
  if (!valid) {
    throw new cError.InvalidRequestPayloadException(
      "Request contains conflict(s) between 'inputs' and 'languages' fields"
    )
  }
  const template = await templateSvc.modifyTemplate(USID, templateId, name, inputs, languages)
  res.json(objReplaceKeyName(template, '_id', 'id'))
}

module.exports = {
  createTemplate,
  listTemplates,
  deleteTemplate,
  modifyTemplate,
  templateInputSantize,
}
