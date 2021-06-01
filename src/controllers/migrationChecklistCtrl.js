const migrationChecklistSvc = require('../services/migrationChecklistSvc')
const fileSvc = require('../services/fileSvc')
const cError = require('../helper/customError')
const constants = require('../constants')
const feedSvc = require('../services/feedSvc')
const mongoose = require('mongoose')


async function uploadFiles(req, res, next) {
    // ensure Checklist folder exists
    await fileSvc.createFolder(req.decoded.RESERVED_USID, constants.RESERVED_PATH.CHECKLIST, req.time)
    const documentType = req.params.documentType
    const data = await migrationChecklistSvc.uploadFiles(req.decoded.userId, documentType, req.files)

    //SS-50: add new feed for document uploadded
    let feed ={
    _id: mongoose.Types.ObjectId(),
    user: {
        id: req.decoded.userId,
        name: req.decoded.name,
        photo: req.decoded.photo
    },
    reviewer: {
        id:req.decoded.userId
    },
    action: constants.FEED_ACTION.upload,
    documentType,
    createAt: new Date(),
    type: 1
    }
    await feedSvc.addFeed(feed)
    res.json(data)
}

async function deleteFile(req, res, next) {
    await migrationChecklistSvc.deleteFile(req.params.fileId)
    res.json({success: true})
}

async function getHistory(req, res, next) {
    const data = await migrationChecklistSvc.getHistory(req.decoded.userId, req.params.documentType)
    res.json(data)
}

async function share(req, res, next) {
    const ownerId = req.decoded.userId
    const documentType = req.params.documentType
    const request = req.body.message
    const remoteIds = req.body.remoteIds
    await migrationChecklistSvc.shareFile(ownerId, documentType, remoteIds, request)
    res.json({success: true})
}

async function verify(req, res, next) {
    const sharingId = req.params.sharingId
    const comment = req.body.comment
    const approve = req.body.approve
    await migrationChecklistSvc.verifyDocument(sharingId, approve, comment)
    res.json({success: true})
}

async function getNotifications(req, res, next) {
    let skip = parseInt(req.query.skip)
    if (!skip) skip = 0
    let limit = parseInt(req.query.limit)
    if (!limit) limit = 10
    const data = await migrationChecklistSvc.getNotifications(req.decoded.userId, skip, limit)
    res.json(data)
}

async function viewDetailNotification(req, res, next) {
    const data = await migrationChecklistSvc.getNotificationDetail(req.params.id)
    res.json(data)
}

async function getData(req, res, next) {
    
    const data = await migrationChecklistSvc.getData(req.decoded.userId)
    res.json(data)
}

async function countUnReadNotifications(req, res, next) {
    
    const data = await migrationChecklistSvc.countUnRead(req.decoded.userId)
    res.json({number: data})
}

module.exports = {
    uploadFiles,
    deleteFile,
    getHistory,
    share,
    verify,
    getNotifications,
    viewDetailNotification,
    getData,
    countUnReadNotifications
}
