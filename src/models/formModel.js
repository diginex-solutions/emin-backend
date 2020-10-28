const mongoose = require('mongoose')
const model = 'Form'
const _ = require('lodash')
const InputsSchema = require('./inputsSchema')
const STATUSES = require('../constants').FORM_ACTION

const FormSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    status: { type: String, require: true },
    message: { type: String, require: true },
    notes: { type: String, require: true },
    dateCreated: { type: Number, require: true },
    dateReceived: { type: Number, default: null },
    dateFilled: { type: Number, default: null },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', index: true },
    sharingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Access', index: true },
    answers: [InputsSchema],
    initiatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'userSpace', index: true, required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'userSpace', index: true, required: true },
  },
  {
    versionKey: false,
  }
)

FormSchema.set('toObject', { getters: true })
FormSchema.set('toJSON', { getters: true })

FormSchema.statics.createForm = function (
  formId,
  status,
  message,
  ts,
  templateId,
  sharingId,
  initiatorId,
  recipientId
) {
  const form = {
    _id: formId,
    status,
    message,
    templateId,
    sharingId,
    dateCreated: ts,
    answers: templateId ? [] : undefined,
    initiatorId,
    recipientId,
  }
  return this.create(form)
}

FormSchema.statics.completeForm = function (formId, status, answers, dateReceived, dateFilled, notes) {
  const options = { new: true }
  const newValue = _.pickBy({ status, answers, dateReceived, dateFilled, notes })
  return this.findOneAndUpdate({ _id: formId }, newValue, options).lean()
}

FormSchema.statics.getFormById = function (formId) {
  return this.findOne({ _id: formId }).populate('templateId').exec() // tips: lean cannot invoke getter for JSON.parse
}

FormSchema.statics.getFormsWithTemplateByIds = function (formIds) {
  return this.find({ _id: { $in: formIds } })
    .populate('templateId')
    .lean() // tips: lean cannot invoke getter for JSON.parse
}

FormSchema.statics.getFormsByRecipient = function (USID) {
  return this.find({ $or: [{ initiatorId: USID }, { recipientId: USID }] }).lean()
}

FormSchema.statics.getUserFormById = function (USID, formId) {
  return this.findOne({ _id: formId, $or: [{ initiatorId: USID }, { recipientId: USID }] }).lean()
}

FormSchema.statics.getFormsByIds = function (ids) {
  return this.find({ _id: { $in: ids } }).exec()
}

FormSchema.statics.listFormByTemplateIds = function (templateIds) {
  return this.find({ templateId: templateIds }).lean()
}

FormSchema.statics.getRandomFormByTemplateId = function (templateId) {
  return this.findOne({ templateId }).exec()
}

FormSchema.statics.getVerificationTypeForm = function (initiatorId, recipientId, sharingIds) {
  return this.findOne({ templateId: null, initiatorId, recipientId, sharingId: sharingIds }).lean()
}

FormSchema.statics.getFormIdsByTemplateIdGroupByAccess = function (templateId) {
  const groupBy = '$_id' // either group by sharingId or no group by
  return this.aggregate([
    {
      $match: {
        $and: [{ templateId: mongoose.Types.ObjectId(templateId) }, { $or: [{ status: STATUSES.accepted.text }] }],
      },
    },
    { $sort: { _id: -1 } }, // latest one on top, so {$first: $_id} equivalent to MAX(_id)
    {
      $group: {
        _id: groupBy,
        formId: { $first: '$_id' },
      },
    },
    { $match: { _id: { $ne: null } } }, // filter out if sharingId is not presented (deprecated data)
  ]).exec()
}

const Form = mongoose.model(model, FormSchema)
module.exports = Form
