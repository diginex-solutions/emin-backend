const mongoose = require('mongoose')
const model = 'Case'
const CaseSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    createdAt: { type: Number, required: true },
    updatedAt: { type: Number },
    description: { type: String, default: '' },
    resolutionPlan: { type: String, default: '' },
    isOpen: { type: Boolean, default: true, required: true },
    formId: { type: mongoose.Schema.Types.ObjectId },
    caseType: { type: String, default: '' },
    employee: { type: String, default: '' },
  },
  {
    versionKey: false,
  }
)

CaseSchema.set('toObject', { virtuals: true, getters: true })
CaseSchema.set('toJSON', { virtuals: true, getters: true })

CaseSchema.statics.createCase = function (caseObj) {
  return this.create(caseObj)
}

CaseSchema.statics.getCasesById = function (caseIds) {
  return this.find({ _id: caseIds }).sort({ _id: -1 }).lean()
}

CaseSchema.statics.getCaseById = function (_id) {
  return this.findOne({ _id }).lean()
}

CaseSchema.statics.updateCaseStatus = function (_id, isOpen, ts) {
  const options = { new: true }
  const caseStatus = { isOpen, updatedAt: ts }
  return this.findOneAndUpdate({ _id }, caseStatus, options).lean()
}

CaseSchema.statics.updateCase = function (_id, caseBody) {
  const options = { new: true }
  return this.findOneAndUpdate({ _id }, caseBody, options).lean()
}

const Case = mongoose.model(model, CaseSchema)
module.exports = Case
