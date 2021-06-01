var mongoose = require('mongoose')

var model = 'Answer'

var AnswerSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    userId: {type: String},
    surveyId: {type: String},
    status: {type: String},
    allowAnomyous: {type: Boolean},
    lastQuestionId: {type: String},
    lastPageNumber: {type: Number},
    surveyTranslationId: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveyTranslation'},
    answers: [
        {
            controlId: {type: String},
            value: {type: Object},
        }
    ],
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
    versionKey: false,
  }
)

AnswerSchema.statics.getAnswer = function (userId, surveyId){
    return this.findOne({userId: userId, surveyId: surveyId}).lean()
}

AnswerSchema.statics.getAnswerBySurveyTranslationId = function (userId, surveyTranslationId){
  return this.findOne({userId: userId, surveyTranslationId: surveyTranslationId}).lean()
}

AnswerSchema.statics.getAnswerByControllId = function (surveyId, controlId){
  return this.find(
    {surveyId: surveyId, "answers.controlId": controlId, status: "submitted"}, 
    {
      _id: 0, 
      userId: 1,
      allowAnomyous: 1,
      answers: {$elemMatch: {controlId: controlId}}
    })
    .lean()
}

AnswerSchema.statics.submitAnswer = function (model) {
    const options = { upsert: true, new: true }
    return this.findOneAndUpdate(
      { userId: model.userId,
        surveyId: model.surveyId,
        surveyTranslationId: model.surveyTranslationId
      }, 
      { userId: model.userId, 
        surveyId: model.surveyId, 
        status: model.status, 
        allowAnomyous: model.allowAnomyous, 
        lastQuestionId: model.lastQuestionId,
        lastPageNumber: model.lastPageNumber,
        answers: model.answers,
        surveyTranslationId: model.surveyTranslationId
      }, 
      options)
}

const Answer = mongoose.model(model, AnswerSchema)
module.exports = Answer
