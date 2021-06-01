var mongoose = require('mongoose')

var model = 'Dashlet'

var DashletSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    title: {type: String},
    subtitle: {type: String},
    surveyId: {type: String},
    questionId: {type: String},
    controlId: {type: String},
    subControlId: {type: String},
    dashletModule: {type: Object},
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
    versionKey: false,
  }
)

DashletSchema.statics.deleteById = function (id) {
  return this.findOneAndDelete({ _id: id }).lean()
}

DashletSchema.statics.createNew = function (model) {
  return this.create(model)
}

DashletSchema.statics.updateDashlet = function (model) {
    return this.findOneAndUpdate({ _id: model._id }, 
        { title: model.title, 
          subtitle: model.subtitle, 
          surveyId: model.surveyId,
          questionId: model.questionId,
          controlId: model.controlId,
          subControlId: model.subControlId,
          dashletModule: model.dashletModule,
        }).lean()
}

DashletSchema.statics.getBySurvey = function (surveyId){
  return this.find({surveyId: surveyId}).lean()
}

DashletSchema.statics.getById = function (id){
  return this.findOne({_id: id}).lean()
}

const Dashlet = mongoose.model(model, DashletSchema)
module.exports = Dashlet
