var mongoose = require('mongoose')

var model = 'Survey'

var SurveySchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    name: {type: String},
    description: {type: String},
    startDate: {type: Number},
    endDate: {type: Number},
    status: {type: String},
    canUserChangeOnSubmit: {type: Boolean},
    pages: [
        {
            name: {type: String},
            description: {type: String},
            sections: [
                {
                    name: {type: String},
                    description: {type: String},
                    questions: [
                        {
                            name: {type: String},
                            description: {type: String},
                            serialNo: {type: Number},
                            isMandatory: {type: Boolean},
                            controlTypes: [
                                {
                                    type: {type: String},
                                    controlModel: {type: Object}
                                }
                            ]
                        }
                    ]       
                }
            ]
        }
    ],
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
    versionKey: false,
  }
)

SurveySchema.statics.getAllSurvey = function (){
    return this.find({}).lean()
}

SurveySchema.statics.getUserSurvey = function (tme){
    const now = new Date()
    return this.find({
        $and: [
            {
              $or: [
                {
                  startDate: null
                },
                {
                  startDate: {$gt: now.getTime()}
                }
              ]
            },
            {
              status: "published"
            }
          ]
    }).lean()
}

SurveySchema.statics.getSurveyById = function (surveyId){
    return this.findOne({_id: surveyId}).lean()
}

SurveySchema.statics.deleteAllSurvey = function () {
    return this.deleteMany({}).lean()
}

SurveySchema.statics.deleteSurvey = function (surveyId) {
    return this.findOneAndDelete({ _id: surveyId}).exec()
}

SurveySchema.statics.createSurvey = function (survey) {
  return this.create(survey)
}

SurveySchema.statics.updateSurvey = function (survey) {
    return this.findOneAndUpdate({ _id: survey._id }, 
        { name: survey.name, 
          description: survey.description, 
          startDate: survey.startDate,
          endDate: survey.endDate,
          status: survey.status,
          canUserChangeOnSubmit: survey.canUserChangeOnSubmit,
        }).lean()
}

SurveySchema.statics.addPage = function (surveyId, page) {
    return this.findOneAndUpdate({ _id: surveyId }, { $push: {pages: page} }).lean()
}

SurveySchema.statics.updatePage = function (surveyId, page) {
    return this.findOneAndUpdate({ _id: surveyId, "pages._id": page._id }, 
        {$set: {"pages.$.name": page.name,
                "pages.$.description": page.description,
                "pages.$.sections": page.sections
               }
        }).lean()
}

SurveySchema.statics.deletePage = function (surveyId, pageId) {
    return this.findOneAndUpdate({ _id: surveyId }, 
        {$pull: {"pages": {"_id": pageId}}}).lean()
}

const Survey = mongoose.model(model, SurveySchema)
module.exports = Survey
