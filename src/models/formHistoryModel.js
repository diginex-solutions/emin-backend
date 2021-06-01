var mongoose = require('mongoose')
var model = 'FormHistory'
var userProject = { name: 1, surname: 1, email: 1 }
var sharingProject = { name: 1, surname: 1, email: 1, company: 1 }

var FormHistorySchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', index: true, require: true },
    action: { type: String, required: true },
    date: { type: Number, required: true },
    ipAddress: String,
    txHash: String,
    tezosOpHash: String,
    notes: String,
    blockHash: String,
    hash: String,
    status: { type: Number, required: true, index: true }, // low cardinality index. Infrequent values should be able to benefit from index. So as status not equal to Completed(4)
    ots: Buffer,
    USID: { type: mongoose.Schema.Types.ObjectId, ref: 'userSpace', index: true },
    meta: { type: String },
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
    versionKey: false,
  }
)

FormHistorySchema.statics.saveHistory = function (action, eventTime, formId, USID, ipAddress, options, notes) {
  var history = {
    _id: mongoose.Types.ObjectId(),
    action: action,
    formId: formId,
    date: eventTime,
    ipAddress: ipAddress,
    status: 0,
    notes,
    USID,
    ...options,
  }
  return this.create(history)
}

FormHistorySchema.statics.getHistoryByFormId = function (formId) {
  return this.find({ formId: formId }).sort({ _id: -1 }).populate('formId').populate('user', userProject).lean()
}

const FormHistory = mongoose.model(model, FormHistorySchema)
module.exports = FormHistory
