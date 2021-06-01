const dashletSvc = require('../services/dashletSvc')

async function getBySurvey(req, res, next) {
    const data = await dashletSvc.getBySurvey(req.query.surveyId)
    res.json(data)
}

async function getById(req, res, next) {
    const data = await dashletSvc.getById(req.params.id)
    res.json(data)
}

async function deleteDashlet(req, res, next) {
    await dashletSvc.deleteDashlet(req.params.id)
    res.json({success: true})
}

async function saveDashlet(req, res, next) {
    const data = await dashletSvc.saveDashlet(req.body)
    res.json(data)
}

module.exports = {
    getBySurvey,
    deleteDashlet,
    saveDashlet,
    getById,
}
