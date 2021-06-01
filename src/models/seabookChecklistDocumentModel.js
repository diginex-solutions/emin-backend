var mongoose = require('mongoose')

var model = 'ChecklistDocument'

var ChecklistDocumentSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    docId: {type: String},
    documentType: {type: String},
    description: {type: String},
    status: {type: String},
    files: [{type: String}],
    expiredAt: [{type: Number}],
    locations: [
        {
            documentPath: {type: String},
            checklistCategory: {type: String},
            group: {type: String},
            requiredCriteria: {type: String},
            serialNo: {type: Number},
        }
    ],
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
    versionKey: false,
  }
)

ChecklistDocumentSchema.statics.createNew = function (file) {
  return this.create(file)
}

ChecklistDocumentSchema.statics.getAll = function (){
  return this.find({}).lean()
}

ChecklistDocumentSchema.statics.getById = function (id){
    return this.findOne({_id: id}).lean()
  }

  ChecklistDocumentSchema.statics.deleteAll = function () {
    return this.deleteMany({}).lean()
  }

  ChecklistDocumentSchema.statics.deleteOne = function(chkLstDocId){
    return this.findOneAndDelete({_id: chkLstDocId}).exec();
  }  

const ChecklistDocument = mongoose.model(model, ChecklistDocumentSchema)
module.exports = ChecklistDocument
