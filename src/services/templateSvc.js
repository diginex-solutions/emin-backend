const _ = require('lodash')
const R = require('ramda')
const cError = require('../helper/customError')
const mongoose = require('mongoose')
const Template = mongoose.model('Template')
const FormModel = mongoose.model('Form')
const formSvc = require('./actionSvc')
function createTemplate(USID, name, inputs, languages) {
  return Template.createTemplate(USID, name, inputs, languages)
}

async function listTemplates(USID) {
  return await Template.listTemplates(USID)
}

async function getTemplate(USID, templateId) {
  const template = await Template.getTemplate(USID, templateId)
  if (template) {
    return template
  } else {
    throw new cError.ResourceNotFoundException('Template does not exist')
  }
}

async function deleteTemplate(USID, templateId) {
  const form = await FormModel.getRandomFormByTemplateId(templateId)
  if (form) {
    throw new cError.InvalidStateTransitException('Template cannot be deleted if there is any form attached')
  }
  const template = await Template.deleteTemplate(USID, templateId)
  if (template) {
    return template
  } else {
    throw new cError.ResourceNotFoundException('Template does not exist')
  }
}

async function modifyTemplate(USID, templateId, name, inputs, languages) {
  const oldTemplate = await Template.getTemplate(USID, templateId)
  if (!oldTemplate) {
    throw new cError.ResourceNotFoundException('Template does not exist')
  }

  const oldInputs = oldTemplate.toObject().inputs
  const oldLangInputs = oldTemplate.toObject().languages

  const formatter = R.map(R.pick(['_id', 'options', 'type']))
  const sortById = R.sortBy(R.prop('_id'))

  const oldInputsS = R.pipe(formatter, sortById)(oldInputs)
  const newInputsS = R.pipe(formatter, sortById)(inputs)

  const langInputFormatter = R.map((input) => R.pick(['_id', 'label', 'options'], input))
  const langsFormatter = R.map((langs) => {
    return { lang: langs.lang, inputs: langInputFormatter(langs.inputs) }
  })

  const sortByLang = R.sortBy(R.prop('lang'))
  const oldLangInputsS = R.pipe(langsFormatter, sortByLang)(oldLangInputs)
  const newLangInputsS = R.pipe(langsFormatter, sortByLang)(languages)
  const contentChanged = !R.equals(oldInputsS, newInputsS) || !R.equals(oldLangInputsS, newLangInputsS)

  const form = await FormModel.getRandomFormByTemplateId(templateId)

  if (form && contentChanged) {
    throw new cError.InvalidStateTransitException('Template inputs cannot be modified if there is form attached')
  }
  const _templateObj = _.pickBy({
    name,
    inputs,
    languages,
  })
  const template = await Template.modifyTemplate(USID, templateId, _templateObj)
  return template
}

module.exports = {
  createTemplate,
  listTemplates,
  getTemplate,
  deleteTemplate,
  modifyTemplate,
}
