const _ = require('lodash')
const mongoose = require('mongoose')
const Form = mongoose.model('Form')
const Template = mongoose.model('Template')
const Sharing = mongoose.model('Sharing')
const Access = mongoose.model('Access')
const fileSvc = require('./fileSvc')
const { checkboxBooleanToYesNo } = require('../helper/util')
const cError = require('../helper/customError')
const { LANGUAGES, INPUT_SCHEMA_TYPE } = require('../constants')

const idToLabelInArray = (array, key) => {
  //{id_, label}
  const found = array.find((i) => String(i._id) === String(key))
  return found && found.label ? found.label : key
}

const filterFormIdByFile = async (USID, options) => {
  const formIdsByTemId = await Form.getFormIdsByTemplateIdGroupByAccess(options.templateId)
  const _formIdsByTemId = formIdsByTemId.map((item) => String(item.formId)) // all formIds by templateId
  if (options.accessId) {
    // formId filter by fileId
    const myAccess = await fileSvc.retrieveMyAccessById(options.accessId, USID)
    const accesses = await Access.getFormIdsByFileId(myAccess.fileId)
    const formIdsInAccess = (acc) => acc.permissions.map((per) => String(per.ref))
    const formIdsByAccesses = _.flatten(accesses.map(formIdsInAccess))
    return _.intersection(_formIdsByTemId, formIdsByAccesses)
  }
  return _formIdsByTemId
}

function query(options, forms, template) {
  if (options.type == 'count') return forms.length
  //type: from template.inputs[].type
  const temInput = template.inputs.find((i) => String(i._id) == options.fieldId)
  const type = temInput && temInput.type ? temInput.type : String(undefined)
  //label: literals from template.languages[].inputs[].label
  const defaultIndex = template.languages.findIndex((inp) => inp.lang === LANGUAGES.default)
  const langIndex = defaultIndex === -1 ? 0 : defaultIndex
  const temLangInputs = template.languages[langIndex].inputs
  const temLangInput = temLangInputs.find((i) => String(i._id) == options.fieldId)
  const label = temLangInput && temLangInput.label ? temLangInput.label : String(undefined)
  const answers = _.flatten(
    forms.map((form) => {
      // for each form, select the answer by _id from answers[]
      const answerList = form.answers
      return answerList.filter((ans) => ans._id == options.fieldId)
    })
  )
  const occurrence = answers.map(checkboxBooleanToYesNo).reduce((acc, cur) => {
    // count the occurrence
    // hack: wrap in array to be flatten. for multi-select as it is a list
    const value = cur.value === null ? ['No answer'] : [cur.value]
    _.flatten(value).map((v) => (acc[v] = acc[v] ? acc[v] + 1 : 1))
    return acc
  }, {})
  const isNotLiterals = type === INPUT_SCHEMA_TYPE.SELECT || type === INPUT_SCHEMA_TYPE.MULTISELECT
  const values = Object.keys(occurrence).map((key) => {
    // $value: $occurence => {'label': $value, 'value':$occurrence}
    const label = isNotLiterals ? idToLabelInArray(temLangInput.options, key) : key
    return { label, value: occurrence[key] }
  })

  return { values, type, label }
}

module.exports = {
  query,
  filterFormIdByFile,
}
