var mongoose = require('mongoose')
var model = 'ChecklistHistory'
var ChecklistHistorySchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    ownerId: {type: String},
    documentType: {type: String},
    status: {type: String},
    times: {type: Number},
    shared: {type: Boolean},
    histories: [
        {
            actor: {type: String},
            action: {type: String},
            files: [
              {
                _id: { type: mongoose.Schema.Types.ObjectId },
                name: {type: String},
                path: {type: String},
              }
            ],
            updatedAt: {type: Number}
        }
    ]
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false,
  }
)

ChecklistHistorySchema.statics.createNew = function (history) {
  return this.create(history)
}

ChecklistHistorySchema.statics.getByOwnerAndDocumentType = function (ownerId, documentType) {
  return this.findOne({ownerId: ownerId, documentType: documentType}).lean()
}

ChecklistHistorySchema.statics.getByOwner = function (ownerId) {
  return this.find({ownerId: ownerId}, '-histories').lean()
}

ChecklistHistorySchema.statics.addHistory = function (id, history) {
  return this.findOneAndUpdate({ _id: id }, { $push: {histories: history} }).lean()
}

ChecklistHistorySchema.statics.update = function (id, status, times, shared) {
  return this.findOneAndUpdate({ _id: id }, { status: status, times: times, shared: shared}).lean()
}

const ChecklistHistory = mongoose.model(model, ChecklistHistorySchema)
module.exports = ChecklistHistory
