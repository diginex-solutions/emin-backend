const surveySvc = require('../services/surveySvc')

async function getAllSurvey(req, res, next) {
    const data = await surveySvc.getAllSurvey()
    res.json(data)
}

async function getUserSurvey(req, res, next) {
    const data = await surveySvc.getUserSurvey()
    res.json(data)
}

async function getSurveyById(req, res, next) {
    const data = await surveySvc.getSurveyById(req.params.id)
    res.json(data)
}

async function deleteAllSurvey(req, res, next) {
    const data = await surveySvc.deleteAllSurvey()
    res.json({success: true})
}

async function deleteSurvey(req, res, next){
    await surveySvc.deleteSurvey(req.params.id)
    res.json({success: true})
}

async function createSurvey(req, res, next) {
    const data = await surveySvc.createSurvey(req.body)
    res.json(data)
}

async function addPage(req, res, next) {
    const data = await surveySvc.addPage(req.body.surveyId, req.body.page)
    res.json(data)
}

async function deletePage(req, res, next) {
    const data = await surveySvc.deletePage(req.body.surveyId, req.body.pageId)
    res.json(data)
}

async function getAnswer(req, res, next) {
    const data = await surveySvc.getAnswer(req.query.userId, req.query.surveyId)
    res.json(data)
}

async function getAnswerByControllId(req, res, next) {
    const data = await surveySvc.getAnswerByControllId(req.query.surveyId, req.query.controlId)
    res.json(data)
}

async function submitAnswer(req, res, next) {
    const data = await surveySvc.submitAnswer(req.decoded.userId, req.body)
    res.json(data)
}

async function createSuvreyTranslation(req, res, next){
    const data = await surveySvc.createSurveyTranslation(req.body);
    res.json(data);
}

async function getSurveyTranslationBySurveyId(req, res, next) {
    const data = await surveySvc.getSurveyTranslationBySurveyId(req.query.surveyId);
    res.json(data);
}

async function getAnswerBySurveyTranslationId(req, res, next) {
    const data = await surveySvc.getAnswerBySurveyTranslationId(req.query.userId, req.query.surveyTranslationId);
    res.json(data);
}

module.exports = {
    getAllSurvey,
    getSurveyById,
    deleteAllSurvey,
    deleteSurvey,
    createSurvey,
    addPage,
    deletePage,
    getAnswer,
    submitAnswer,
    getAnswerByControllId,
    getUserSurvey,
    createSuvreyTranslation,
    getSurveyTranslationBySurveyId,
    getAnswerBySurveyTranslationId
}
