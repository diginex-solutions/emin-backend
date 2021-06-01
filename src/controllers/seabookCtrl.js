const seabookSvc = require('../services/seabookSvc')
const migrationChecklistSvc = require('../services/migrationChecklistSvc')

async function getAllChecklistCategory(req, res, next) {
    const data = await seabookSvc.getAllChecklistCategory()
    res.json(data)
}

async function createChecklistCategory(req, res, next){
    await seabookSvc.createChecklistCategory(req.body);
    res.json({success: true});
}

async function deleteChecklistCategoryById(req, res, next){
    await seabookSvc.deleteChecklistCategoryById(req.params.id);
    res.json({success: true});
}

async function getChecklistCategoryById(req, res, next) {
    const data = await seabookSvc.getChecklistCategoryById(req.params.id)
    res.json(data)
}

async function deleteChecklistCategory(req, res, next) {
    const data = await seabookSvc.deleteAllChecklistCategory()
    res.json({success: true})
}

async function getAllChecklistDocument(req, res, next) {
    const data = await seabookSvc.getAllChecklistDocument()
    res.json(data)
}

async function createChecklistDocument(req, res, next){
    await seabookSvc.createChecklistDocument(req.body);
    res.json({success: true});
}

async function deleteChecklistDocumentById(req, res, next){
    await seabookSvc.deleteChecklistDocumentById(req.params.id);
    res.json({success:true});
}

async function getChecklistDocumentById(req, res, next) {
    const data = await seabookSvc.getChecklistDocumentById(req.params.id)
    res.json(data)
}

async function deleteChecklistDocument(req, res, next) {
    const data = await seabookSvc.deleteAllChecklistDocument()
    res.json({success: true})
}

async function getAllDocumentPath(req, res, next) {
    const data = await seabookSvc.getAllDocumentPath()
    res.json(data)
}

async function getDocumentPathById(req, res, next) {
    const data = await seabookSvc.getDocumentPathById(req.params.id)
    res.json(data)
}

async function deleteAllDocumentPath(req, res, next) {
    const data = await seabookSvc.deleteAllDocumentPath()
    res.json({success: true})
}

async function createDocumentPath(req, res, next){
    await seabookSvc.createDocumentPath(req.body);
    res.json({success: true});
}

async function deleteDocumentPathById(req, res, next){
    await seabookSvc.deleteDocumentPathById(req.params.id);
    res.json({success: true});
}

async function getData(req, res, next) {
    const data = await migrationChecklistSvc.getSeabookData(req.decoded.userId)
    res.json(data)
}

module.exports = {
    getAllChecklistCategory,
    getChecklistCategoryById,
    deleteChecklistCategory,
    getAllChecklistDocument,
    getChecklistDocumentById,
    deleteChecklistDocument,
    getAllDocumentPath,
    getDocumentPathById,
    deleteAllDocumentPath,
    getData,
    createChecklistCategory,
    deleteChecklistCategoryById,
    createChecklistDocument,
    deleteChecklistDocumentById,
    createDocumentPath,
    deleteDocumentPathById
}
