var mongoose = require('mongoose')
var model = 'Feed'
var FeedSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    reviewer: {
        id: {type: String},
        name: {type: String},
        photo: {type: String}
    },
    user: {
      id: {type: String},
      name: {type: String},
      photo: {type: String}
    },
    action: {type: String},
    documentType:{type: String},
    profileStrength:{type: String},
    createAt: {type: Number},
    type: {type: Number}
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false,
  }
)

FeedSchema.statics.newFeed = function (feed) {
  return this.create(feed)
}

FeedSchema.statics.getById = function (id) {
  return this.findOne({ _id: id }).exec()
}

FeedSchema.statics.getAll = function () {
  return this.find({}).exec()
}

FeedSchema.statics.getByUser = function (userIds) {
  return this.find({$and:[{'user.id' :userIds}, {'reviewer.id': userIds}]}).lean()
  // return this.find({$or:[{$and: [{'user.id' :userIds}, {reviewer: null}]},
  //                        {$and: [{'user.id' :userIds}, {'reviewer.id': userIds}]}
  //                       ]}).lean()
}


const Feed = mongoose.model(model, FeedSchema)
module.exports = Feed
