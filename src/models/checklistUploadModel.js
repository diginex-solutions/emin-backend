var mongoose = require('mongoose')

var model = 'ChecklistUpload'

var ChecklistUploadSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    documentType: {type: String},
    ownerId: {type: String},
    name: {type: String},
    path: {type: String},
    uploadedAt: {type: Number},
    deletedAt: {type: Number},
    blobName: {type: String},
    shaHash: {type: String},
    blobSize: {type: Number}
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
    versionKey: false,
  }
)

ChecklistUploadSchema.statics.deleteById = function (id) {
  return this.findOneAndUpdate({ _id: id }, { deletedAt: new Date()}).lean()
}

ChecklistUploadSchema.statics.createNew = function (file) {
  return this.create(file)
}

ChecklistUploadSchema.statics.getMaxTimesUpload = function (ownerId, documentType){
  return this.find({ownerId: ownerId}, {documentType: documentType}).sort({times:-1}).limit(1).exec()
}

ChecklistUploadSchema.statics.getByOwnerAndDocumentType = function (ownerId, documentType){
  return this.find({ownerId: ownerId, documentType: documentType}).lean()
}

ChecklistUploadSchema.statics.getByOwner = function (ownerId){
  return this.find({ownerId: ownerId}).lean()
}

ChecklistUploadSchema.statics.getByIds = function (ids){
  return this.find({_id: ids}).lean()
}

const ChecklistUpload = mongoose.model(model, ChecklistUploadSchema)
module.exports = ChecklistUpload
