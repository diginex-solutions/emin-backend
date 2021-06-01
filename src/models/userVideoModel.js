var mongoose = require('mongoose')
var model = 'UserVideo'
var UserVideoSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    userId: {type: String},
    videoId: {type: String}
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false,
  }
)

UserVideoSchema.statics.getById = function (id) {
  return this.findOne({ _id: id }).exec()
}

UserVideoSchema.statics.getAll = function () {
  return this.find({}).exec()
}

UserVideoSchema.statics.create = function (userId, videoId){
  const options = { upsert: true, new: true }
  return this.findOneAndUpdate({ userId: userId, videoId: videoId }, { userId: userId, videoId: videoId }, options)
}

UserVideoSchema.statics.getByUser = function (userId){
  return this.find({userId: userId}).exec()
}

const UserVideo = mongoose.model(model, UserVideoSchema)
module.exports = UserVideo
