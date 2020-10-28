const mongoose = require('mongoose')
const model = 'UserCase'
const UserCaseSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    USID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'userSpace' },
    caseId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Case' },
    permission: { type: String },
  },
  {
    versionKey: false,
  }
)

UserCaseSchema.set('toObject', { virtuals: true, getters: true })
UserCaseSchema.set('toJSON', { virtuals: true, getters: true })

UserCaseSchema.statics.listMyCases = function (USID) {
  return this.find({ USID, permission: { $ne: 'employee' } }).lean()
}

UserCaseSchema.statics.listCasesByIds = function (caseIds) {
  return this.find({ caseId: caseIds }).lean()
}

UserCaseSchema.statics.getUserCaseByCaseId = function (USID, caseId) {
  return this.findOne({ USID, caseId }).lean()
}

UserCaseSchema.statics.createUserCase = function (caseObj) {
  return this.create(caseObj)
}

const UserCase = mongoose.model(model, UserCaseSchema)
module.exports = UserCase
