var mongoose = require('mongoose')
const constants = require('../constants')

var model = 'Document'

var DocumentSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    name: {type: String},
    documentType: {type: String},
    uploadedAt: {type: Number},
    updatedAt: {type: Number},
    uploadedBy: {type: String},
    status: {type: String},
    sharedTo: {type: String},
    sharedMessage: {type: String},
    reviewMessage: {type: String},
    thirdPartyConsent: {type: Boolean},
    url: {type: String},
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
    versionKey: false,
  }
)

DocumentSchema.statics.deleteById = function (id) {
  return this.findOneAndDelete({ _id: id }).lean()
}

DocumentSchema.statics.createNew = function (model) {
  return this.create(model)
}

DocumentSchema.statics.shareDocument = function (id, message) {
    return this.findOneAndUpdate({ _id: id }, 
        { status: constants.DOCUMENT_STATUS.shared, 
          updatedAt: new Date(),
          sharedMessage: message,
          reviewMessage: null,
          thirdPartyConsent: null
        }).lean()
}

DocumentSchema.statics.verifyDocument = function (id, approve, review, thirdPartyConsent) {
  const status = approve? constants.DOCUMENT_STATUS.verified : constants.DOCUMENT_STATUS.rejected
  return this.findOneAndUpdate({ _id: id }, 
      { status: status, 
        updatedAt: new Date(),
        reviewMessage: review,
        thirdPartyConsent: thirdPartyConsent
      }).lean()
}

DocumentSchema.statics.getByUser = function (userId){
  return this.find({sharedTo: userId}).lean()
}

DocumentSchema.statics.getById = function (id){
  return this.findOne({_id: id}).lean()
}

DocumentSchema.statics.getByIds = function (ids){
  return this.find({_id: ids}).lean()
}

const Document = mongoose.model(model, DocumentSchema)
module.exports = Document
