var mongoose = require('mongoose')
var model = 'ShareEmail'
var ShareEmailSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    ownerId: {type: String},
    remoteId: {type: String},
    fileId: {type: String},
    accessId: {type: String},
    isFolder: {type: Boolean},
    option: {
        _id: false,
        linkType: { type: String},
        linkId: { type: String},
        isVerify: { type: String},
      }
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false,
  }
)

ShareEmailSchema.statics.upsert = function (data) {
    const options = { upsert: true, new: true }
    return this.findOneAndUpdate(
      { 
        ownerId: data.ownerId,
        remoteId: data.remoteId,
        fileId: data.fileId
      }, 
      { ownerId: data.ownerId,
        remoteId: data.remoteId,
        fileId: data.fileId,
        accessId: data.accessId,
        option: data.option
      }, options).exec()
}

ShareEmailSchema.statics.getByFile = function (fileId) {
  return this.find({ fileId: fileId }).exec()
}

const ShareEmail = mongoose.model(model, ShareEmailSchema)
module.exports = ShareEmail
