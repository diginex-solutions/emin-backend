var mongoose = require('mongoose')

var model = 'DocumentPath'

var DocumentPathSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    name: {type: String},
    order: {type: Number}
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
    versionKey: false,
  }
)

DocumentPathSchema.statics.createNew = function (file) {
  return this.create(file)
}

DocumentPathSchema.statics.getAll = function (){
  return this.find({}).lean()
}

DocumentPathSchema.statics.getById = function (id){
    return this.findOne({_id: id}).lean()
  }

  DocumentPathSchema.statics.deleteAll = function () {
    return this.deleteMany({}).lean()
  }
  
  DocumentPathSchema.statics.deleteOne = function(docId){
    return this.findOneAndDelete({_id: docId}).exec();
  }

const DocumentPath = mongoose.model(model, DocumentPathSchema)
module.exports = DocumentPath
