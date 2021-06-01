var mongoose = require('mongoose')
var model = 'ChecklistSharing'
var ChecklistSharingSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    ownerId: {type: String},
    remoteId: {type: String},
    documentType: {type: String},
    status: {type: String},
    sharedAt: {type: Number},
    updatedAt: {type: Number},
    files: [{_id: {type: String}}],
    request: {type: String},
    comment: {type: String}
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false,
  }
)

ChecklistSharingSchema.statics.createNew = function (sharing) {
  return this.create(sharing)
}

ChecklistSharingSchema.statics.getById = function (id) {
  return this.findOne({_id: id}).lean()
}

ChecklistSharingSchema.statics.getByIds = function (ids) {
  return this.find({_id: ids}).lean()
}

ChecklistSharingSchema.statics.updateVerify = function (id, status, comment) {
  return this.findOneAndUpdate({_id: id}, {status: status, comment: comment, updatedAt: new Date()}).lean()
}

const ChecklistSharing = mongoose.model(model, ChecklistSharingSchema)
module.exports = ChecklistSharing
