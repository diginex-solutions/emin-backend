module.exports = {}
var mongoose = require('mongoose')
const Dashlet = mongoose.model('Dashlet')

const deleteDashlet = async (id) => {
    return await Dashlet.deleteById(id)
}

const saveDashlet = async (model) => {
    if (!model._id){
        model._id = mongoose.Types.ObjectId()
        return await Dashlet.createNew(model)
    } else{
        await Dashlet.updateDashlet(model)
        return await Dashlet.getById(model._id)
    }
}

const getBySurvey = async (surveyId) => {
    return Dashlet.getBySurvey(surveyId)
}

const getById = async (id) => {
    return Dashlet.getById(id)
}


module.exports.deleteDashlet = deleteDashlet
module.exports.saveDashlet = saveDashlet
module.exports.getBySurvey = getBySurvey
module.exports.getById = getById

