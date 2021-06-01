var mongoose = require('mongoose')
var model = 'VideoFilter'
var VideoFilterSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    category: {type: String},
    subCategory: {type: String},
    categoryIcon: {type: String},
    subCategoryIcon: {type: String},
    language: {type: String},
    selectionType : {type: String},
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false,
  }
)

VideoFilterSchema.statics.newVideoFilter = function (videoFilter) {
  return this.create(videoFilter)
}

VideoFilterSchema.statics.getById = function (id) {
  return this.findOne({ _id: id }).exec()
}

VideoFilterSchema.statics.getAll = function () {
  return this.find({}).exec()
}

VideoFilterSchema.statics.deleteAll = function (type, vidfilterId) {
  if(type==1){
    return this.deleteMany({}).exec()
  }
  else{
    return this.findOneAndDelete({_id: vidfilterId}).exec()
  }
}

// VideoFilterSchema.statics.deleteAll = function () {
//   return this.deleteMany({}).exec()
// }

VideoFilterSchema.statics.getByLanguage = function (language) {
  return this.find({language: language}).exec()
}

const VideoFilter = mongoose.model(model, VideoFilterSchema)
module.exports = VideoFilter
