var mongoose = require('mongoose')

var model = 'DocumentContact'

var DocumentContactSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    userId: {type: String},
    lastUploadedTime: {type: Number},
    lastUpdatedTime: {type: Number},
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
    versionKey: false,
  }
)

DocumentContactSchema.statics.updateUploadedTime = function (userId) {
    const options = { upsert: true, new: true }
    return this.findOneAndUpdate(
        { userId: userId }, 
        { userId: userId, 
          lastUploadedTime: new Date(), 
          lastUpdatedTime: new Date()
        }, 
        options)
}

DocumentContactSchema.statics.updateUpdatedTime = function (userId) {
  const options = { upsert: true, new: true }
  return this.findOneAndUpdate(
      { userId: userId }, 
      { userId: userId, 
        lastUpdatedTime: new Date()
      }, 
      options)
}


DocumentContactSchema.statics.getAll = function (){
  return this.find({}).lean()
}

DocumentContactSchema.statics.getById = function (id){
  return this.findOne({userId: id}).lean()
}

const DocumentContact = mongoose.model(model, DocumentContactSchema)
module.exports = DocumentContact
