var mongoose = require('mongoose')

var model = "SurveyTranslation";

var SurveyTranslationSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId },
  survey_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey'},
  survey_translations: [
    {
      language_cd: { type: String },
      translate: [
        {
          control_id: { type: String },
          value: { type: String },
        },
      ],
    },
  ],
});

SurveyTranslationSchema.statics.createNew = function (data) {
  return this.create(data);
};

SurveyTranslationSchema.statics.deleteById = function (Id) {
  return this.findOneAndDelete({ _id: Id }).exec();
};

SurveyTranslationSchema.statics.deleteAll = function () {
  return this.deleteMany({}).lean();
};

SurveyTranslationSchema.statics.getSurveyTranslationBySurveyId = function (surveyId){
  return this.find({survey_id: surveyId}).lean()
}

const SurveyTranslation = mongoose.model(model, SurveyTranslationSchema);
module.exports = SurveyTranslation;