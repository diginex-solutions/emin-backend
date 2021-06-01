const documentSvc = require('../services/documentSvc')
const fileSvc = require('../services/fileSvc')
const constants = require('../constants')
const smartContractService = require('../services/smartContract')

async function getDocumentContact(req, res, next) {
    const data = await documentSvc.getDocumentContact()
    res.json(data)
}

async function getDocumentContactDetail(req, res, next) {
    const data = await documentSvc.getDocumentContactDetail(req.params.id, req.decoded.userId)
    res.json(data)
}

async function uploadDocument(req, res, next) {
    // ensure Checklist folder exists
    await fileSvc.createFolder(req.decoded.RESERVED_USID, constants.RESERVED_PATH.DOCUMENT, req.time)
    const data = await documentSvc.uploadDocument(req.decoded.userId, req.query.shareTo, req.files, req.query.docType)
    res.json(data)
}

async function shareDocument(req, res, next) {
    await documentSvc.shareDocument(req.body.docId, req.body.message)
    res.json({success: true})
}

async function deleteDocument(req, res, next) {
    await documentSvc.deleteDocument(req.params.docId)
    res.json({success: true})
}

async function getDocumentNoti(req, res, next) {
    let skip = parseInt(req.query.skip)
    if (!skip) skip = 0
    let limit = parseInt(req.query.limit)
    if (!limit) limit = 10
    const data = await documentSvc.getDocumentNoti(req.decoded.userId, skip, limit)
    res.json(data)
}

async function getDocumentNotiDetails(req, res, next) {
    const data = await documentSvc.getDocumentNotiDetails(req.params.notiId)
    res.json(data)
}

async function verifyDocument(req, res, next) {
    if (!req.body.notiId) return res.json({message: "notiId is required"})
    await documentSvc.verifyDocument(req.body.notiId, req.body.docId, req.body.approve, req.body.message, req.body.thirdPartyConsent)
    res.json({success: true})
}

async function getDocumentByUser(req, res, next) {
    const data = await documentSvc.getDocumentByUser(req.query.userId)
    res.json(data)
}

async function countUnReadNotifications(req, res, next) {
    
    const data = await documentSvc.countUnRead(req.decoded.userId)
    res.json({number: data})
}

async function uploadDataToBlockChain(req, res, next) {
    const data = await smartContractService.uploadToBlockChain()
    res.json({success: true})
}

module.exports = {
    getDocumentContact,
    uploadDocument,
    shareDocument,
    deleteDocument,
    getDocumentNoti,
    getDocumentNotiDetails,
    verifyDocument,
    getDocumentByUser,
    countUnReadNotifications,
    getDocumentContactDetail,
    uploadDataToBlockChain
}
