module.exports = {}
const mongoose = require('mongoose')
const AccessModel = mongoose.model('Access')
const cError = require('../helper/customError')

async function getAccessByFormId(formId) {
  const access = await AccessModel.getAccessByFormId(formId)
  if (!access) throw new cError.ResourceNotFoundException(`Access not found by form ID: ${formId}`)
  return access
}

module.exports.getAccessByFormId = getAccessByFormId
