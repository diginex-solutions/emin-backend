var mongoose = require('mongoose')
var model = 'DocumentNotification'
var DocumentNotificationSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    ownerId: {type: String},
    documentId: {type: String},
    uploadedBy: {type: String},
    status: {type: String},
    createdAt: {type: Number},
    updatedAt: {type: Number},
    isRead: {type: Boolean, default: false},
    sharedAt: {type: Number},
    sharedMessage: {type: String},
    reviewMessage: {type: String},
    thirdPartyConsent: {type: Boolean},
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false,
  }
)

DocumentNotificationSchema.statics.createNew = function (noti) {
  return this.create(noti)
}

DocumentNotificationSchema.statics.getByOwner = function (ownerId, skip, limit){
  return this.find({ownerId: ownerId}).sort({createdAt: -1}).limit(limit).skip(skip).lean()
}

DocumentNotificationSchema.statics.getById = function (id){
  return this.findOne({_id: id}).lean()
}

DocumentNotificationSchema.statics.updateStatus = function (notiId, status, reviewMessage, thirdPartyConsent){
  return this.findOneAndUpdate({_id: notiId},
    {
      status: status,
      updatedAt: new Date(),
      reviewMessage: reviewMessage,
      thirdPartyConsent: thirdPartyConsent,
    }).lean()
}

DocumentNotificationSchema.statics.markRead = function (id) {
  return this.findOneAndUpdate({ _id: id }, { isRead: true}).lean()
}

DocumentNotificationSchema.statics.deleteByDocId = function (id) {
    return this.findOneAndDelete({ documentId: id }).lean()
}

const DocumentNotification = mongoose.model(model, DocumentNotificationSchema)
module.exports = DocumentNotification
