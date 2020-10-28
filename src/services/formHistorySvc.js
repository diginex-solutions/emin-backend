const cError = require('../helper/customError')
const fileSvc = require('./fileSvc')
const actionSvc = require('./actionSvc')
const userSvc = require('./userSvc')
const mongoose = require('mongoose')
const FormHistory = mongoose.model('FormHistory')
const AccessModel = mongoose.model('Access')
const UserModel = mongoose.model('User')
const _ = require('lodash')

const { HISTORY_ACTION } = require('../constants')

const subDoc = async (hist) => {
  const type_mapping = {
    [HISTORY_ACTION.actionCreated]: 'created',
    [HISTORY_ACTION.actionReceived]: 'viewed',
    [HISTORY_ACTION.actionAccepted]: 'filled',
    [HISTORY_ACTION.actionRejected]: 'filled',
    [HISTORY_ACTION.actionUpdated]: 'filled',
  }
  const type = type_mapping[hist.action]
  return {
    id: hist._id,
    formId: hist.formId._id,
    type,
    createdAt: hist.date,
  }
}

const saveThenStampHistory = async (action, eventTime, formId, USID, ipAddress, options, notes) => {
  const history = await FormHistory.saveHistory(action, eventTime, formId, USID, ipAddress, options, notes)
  return history
}

const getHistoryByFormId = async (USID, formId) => {
  console.log('USID', USID, 'formId', formId)
  const form = await actionSvc.retrieveForm(USID, formId)
  if (!form) throw new cError.PermissionDeniedException('Form not found')
  if (!form.templateId)
    throw new cError.InvalidRequestPayloadException(
      "History of Document Verification could't be fetched as Questionnaires"
    )

  const histories = await FormHistory.getHistoryByFormId(formId)
  const histListWithSub = await Promise.all(histories.map(subDoc))
  return histListWithSub
}

module.exports = {
  getHistoryByFormId,
  saveThenStampHistory,
}
