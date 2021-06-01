module.exports = {}
var mongoose = require('mongoose')
const Survey = mongoose.model('Survey')
const Answer = mongoose.model('Answer')
const User = mongoose.model('User')
const constants = require('../constants')
const SurveyTranslation = mongoose.model('SurveyTranslation')
const cError = require('../helper/customError')

const getAllSurvey = async () => {
  return await Survey.getAllSurvey()
}

const getUserSurvey = async () => {
    const now = new Date()
    console.log("time" + now)
    return await Survey.getUserSurvey(now)
  }

const getSurveyById = async (surveyId) => {
  return await Survey.getSurveyById(surveyId)
}

const deleteAllSurvey = async () => {
    return await Survey.deleteAllSurvey()
}

const deleteSurvey = async (surveyId) => {
    return await Survey.deleteSurvey(surveyId)
}

const createSurvey = async (survey) => {
    if (!survey._id){
        survey._id = mongoose.Types.ObjectId()
        return await Survey.createSurvey(survey)
    } else{
        await Survey.updateSurvey(survey)
        return await Survey.getSurveyById(survey._id)
    }
}

const addPage = async (surveyId, page) => {
    if (!page._id){
        await Survey.addPage(surveyId, page)
        return Survey.getSurveyById(surveyId)
    } else{
        await Survey.updatePage(surveyId, page)
        return Survey.getSurveyById(surveyId)
    }
    
}

const deletePage = async (surveyId, pageId) => {
    await Survey.deletePage(surveyId, pageId)
    return Survey.getSurveyById(surveyId)
}

const submitAnswer = async (userId, model) => {
    model.userId = userId
    return await Answer.submitAnswer(model)
}

const getAnswer = async (userId, surveyId) => {
    return await Answer.getAnswer(userId, surveyId)
}

const getAnswerBySurveyTranslationId = async (userId, surveyTranslationId) => {
    console.log(userId, surveyTranslationId)
    return await Answer.getAnswerBySurveyTranslationId(userId, surveyTranslationId)
}

const getAnswerByControllId = async (surveyId, controlId) => {
    const controlAnswers = await Answer.getAnswerByControllId(surveyId, controlId)

    const lstUserIds = controlAnswers.map(x=>x.userId)
    const lstUser = await User.listUserByIds(lstUserIds)

    let result = []
    for(var i =0 ; i< controlAnswers.length; i++){
      let answer = controlAnswers[i]  
      const user = lstUser.find(x=>x._id == answer.userId)
      answer.user = user
      result.push(answer)
    }
    console.log(result)
    return result
}

const createSurveyTranslation = async (data) => {
    if(data){
       const serveyData = {
            _id: mongoose.Types.ObjectId(),
            survey_id: data.survey_id,
            survey_translations: data.survey_translations
        }
        return await SurveyTranslation.createNew(serveyData);
    }
    else{
        throw new cError.ResourceNotFoundException('Data is null');
    }
}

const getSurveyTranslationBySurveyId = async (serveyId) => {
    return await SurveyTranslation.getSurveyTranslationBySurveyId(serveyId)
}

module.exports.getAllSurvey = getAllSurvey
module.exports.getSurveyById = getSurveyById
module.exports.deleteAllSurvey = deleteAllSurvey
module.exports.deleteSurvey = deleteSurvey
module.exports.createSurvey = createSurvey
module.exports.addPage = addPage
module.exports.deletePage = deletePage
module.exports.submitAnswer = submitAnswer
module.exports.getAnswer = getAnswer
module.exports.getAnswerByControllId = getAnswerByControllId
module.exports.getUserSurvey = getUserSurvey
module.exports.createSurveyTranslation = createSurveyTranslation
module.exports.getSurveyTranslationBySurveyId = getSurveyTranslationBySurveyId
module.exports.getAnswerBySurveyTranslationId = getAnswerBySurveyTranslationId