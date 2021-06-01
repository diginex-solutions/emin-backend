var mongoose = require('mongoose')

var model = 'ChecklistCategory'

var ChecklistCategorySchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    name: {type: String},
    department: {type: String},
    address: {type: String},
    description: {type: String},
    instruction: {type: String},
    documentPath: [{type: String}],
    requiredCriteria: {type: String},
    order: {type: Number}
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
    versionKey: false,
  }
)

ChecklistCategorySchema.statics.createNew = function (file) {
  return this.create(file)
}

ChecklistCategorySchema.statics.getAll = function (){
  return this.find({}).lean()
}

ChecklistCategorySchema.statics.getById = function (id){
    return this.findOne({_id: id}).lean()
}

ChecklistCategorySchema.statics.deleteAll = function () {
    return this.deleteMany({}).lean()
  }

  ChecklistCategorySchema.statics.deleteOne = function(chkLstCatId){
    return this.findOneAndDelete({_id: chkLstCatId}).exec()
  }

const ChecklistCategory = mongoose.model(model, ChecklistCategorySchema)
module.exports = ChecklistCategory
