var mongoose = require('mongoose')
var model = 'ChecklistNotification'
var ChecklistNotificationSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    ownerId: {type: String},
    remoteId: {type: String},
    documentType: {type: String},
    notificationType: {type: String},
    action: {type: String},
    createdAt: {type: Number},
    sharingId: {type: String},
    isRead: {type: Boolean, default: false},
    times: {type: Number},
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false,
  }
)

ChecklistNotificationSchema.statics.createNew = function (noti) {
  return this.create(noti)
}

ChecklistNotificationSchema.statics.getByOwner = function (ownerId, skip, limit){
  return this.find({ownerId: ownerId}).sort({createdAt: -1}).limit(limit).skip(skip).lean()
}

ChecklistNotificationSchema.statics.getById = function (id){
  return this.findOne({_id: id}).lean()
}

ChecklistNotificationSchema.statics.markRead = function (id) {
  return this.findOneAndUpdate({ _id: id }, { isRead: true}).lean()
}

const ChecklistNotification = mongoose.model(model, ChecklistNotificationSchema)
module.exports = ChecklistNotification
