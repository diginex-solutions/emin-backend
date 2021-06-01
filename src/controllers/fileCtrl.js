var log = require('../helper/logger.js').log
var resMapper = require('../helper/resMapper.js')
var mongoose = require('mongoose')
var fileSvc = require('../services/fileSvc')
var caseSvc = require('../services/caseSvc')
var config = require('../config')
const multer = require('@diginex/multer')
var MulterAzureStorage = require('@galkin/multer-azure-blob-storage').MulterAzureStorage
const errors = require('../helper/errors')
const azureStorageSvc = require('../services/azureStorageSvc')
const cError = require('../helper/customError')
const constants = require('../constants')
const feedSvc = require('../services/feedSvc')
const FeedType = require('../types/feed')
const { getUserById } = require('../services/userSvc.js')
const userSvc = require('../services/userSvc')

const resolveBlobName = async (req, file) => {
  const documentPath = '/documents'
  const documentChecklistPath = '/checklist/:documentType'
  const versionDocumentPath = '/documents/:accessId'
  const caseDocPath = '/cases/:caseId/document'
  const documentWorkcontractPath = '/document/uploadDocument'
  const currentRoute = req.route.path
  req['trustVersionFileId'] = mongoose.Types.ObjectId()
  const uploadPhotoPath = '/user/upload-photo'
  if (currentRoute === uploadPhotoPath){
    return req.decoded.userId + '/' + req['trustVersionFileId']
  }
  if (currentRoute === documentWorkcontractPath){
    return req.decoded.userId + '/' + req['trustVersionFileId']
}
  if (currentRoute === documentPath || currentRoute === documentChecklistPath || currentRoute === versionDocumentPath 
    || currentRoute === constants.EXT_AUTH_PATH.documents) {
    return req.decoded.RESERVED_USID + '/' + req['trustVersionFileId']
  } else if (currentRoute === caseDocPath) {
    console.log('req.url', req.url)
    // const [myUserCase, caseDb] = await caseSvc.getMyCase(req.decoded.RESERVED_USID, req.params.caseId)
    return 'case/' + req.params.caseId + '/' + req['trustVersionFileId']
  } else {
    throw new cError.InternalServerError(`${currentRoute} is not valid`)
  }
}

const azureStorage = new MulterAzureStorage({
  containerName: config.azure.containerName,
  blobName: resolveBlobName,
  containerAccessLevel: config.azure.containerAccessLevel,
  urlExpirationTime:  50000000
})

const multerUpload = multer({
  // TODO: any control or log on the event. useful for cases like auth/conn errors.
  storage: azureStorage,
})

async function resolveBlobNames(req, file) {
  if (!req.trustVersionFileIds) {
    req.trustVersionFileIds = {}
  }
  if (!req.trustVersionFileIds[file.fieldname]) {
    req.trustVersionFileIds[file.fieldname] = []
  }
  req.trustVersionFileIds[file.fieldname].push({
    id: mongoose.Types.ObjectId(),
    originalname: file.originalname
  })

  const caseDocPath = '/cases/:caseId/documents'
  const documentChecklistPath = '/migrationChecklist/:documentType'
  const documentWorkcontractPath = '/document/uploadDocument'
  const currentRoute = req.route.path
  req['trustVersionFileId'] = mongoose.Types.ObjectId()
  if (currentRoute === documentChecklistPath) {
    //return req.decoded.RESERVED_USID + '/' + req['trustVersionFileId']
    return file.originalname
  }
  if (currentRoute === documentWorkcontractPath) {
    // return req.decoded.RESERVED_USID + '/' + req['trustVersionFileId']
    return file.originalname
  }
  if (currentRoute === caseDocPath) {
    const trustVersionFiles  = req.trustVersionFileIds[file.fieldname]
    const trustVersionFile = (trustVersionFiles || []).find(item => item.originalname === file.originalname)
    const trustVersionFileId = trustVersionFile ? trustVersionFile.id : ''
    const storageUrl = `case/${req.params.caseId}/${trustVersionFileId}`
    return storageUrl
  } else {
    throw new cError.InternalServerError(`${currentRoute} is not valid`)
  }
}

const azureMultiStorage = new MulterAzureStorage({
  containerName: config.azure.containerName,
  blobName: resolveBlobNames,
  containerAccessLevel: config.azure.containerAccessLevel,
  urlExpirationTime:  50000000
})

const multerMultiUploads = multer({
  // TODO: any control or log on the event. useful for cases like auth/conn errors.
  storage: azureMultiStorage,
})

async function listFiles(req, res, next) {
  const files = await fileSvc.listAllAccesses(req.body.RESERVED_USID)
  res.json(resMapper.filesView(files, req.decoded))
}

async function listChecklistFiles(req, res, next) {
  const files = await fileSvc.listChecklistAccesses(req.body.RESERVED_USID)
  res.json(resMapper.filesView(files, req.decoded))
}

async function downloadZip(req, res, next) {
  try {
    await fileSvc.streamZip(res, req.body.RESERVED_USID, req.body.documents)
  } catch (err) {
    log.error('download-zip error', err)
    errors.makeMessage(res, errors.internalServerError, err)
  }
}

async function retrieveFileById(req, res, next) {
  const file = await fileSvc.retrieveMyAccessById(req.params.accessId, req.body.RESERVED_USID)
  res.json(resMapper.filesView(file, req.decoded))
}

async function retrieveAllVersions(req, res, next) {
  const versions = await fileSvc.retrieveAllVersions(req.params.accessId, req.body.RESERVED_USID)
  res.json(resMapper.objReplaceKeyName(versions.reverse(), '_id', 'id'))
}

async function handleUpload(req, res, next) {
  var [file, errMsg] = await fileSvc.uploadFile(
    req.decoded.RESERVED_USID,
    req.trustVersionFileId,
    req.file.originalname,
    req.file.blobSize,
    req.file.url.split('?')[0],
    req.file.shaHash,
    req.time,
    req.userAddress,
    req.query.path
  )
  if (errMsg) {
    errors.makeMessage(res, errors.invalidRequestPayload, errMsg)
  } else {
    res.json(resMapper.filesView(file, req.decoded))
  }
}

async function handleUploadVersion(req, res, next) {
  const file = await fileSvc.uploadNewVersion(
    req.decoded.RESERVED_USID,
    req.trustVersionFileId,
    req.params.accessId,
    req.file.blobSize,
    req.file.url.split('?')[0],
    req.file.shaHash,
    req.time,
    req.userAddress
  )
  res.json(resMapper.filesView(file, req.decoded))
}

async function handleChecklistUpload(req, res, next) {

  // ensure Checklist folder exists
  await fileSvc.createFolder(req.decoded.RESERVED_USID, constants.RESERVED_PATH.CHECKLIST, req.time)
  // get the documentType
  const documentType = req.params.documentType
  const existing = await fileSvc.findChecklistAccess(req.decoded.RESERVED_USID, documentType)
  // if the file with this document type exists, upload a new version
  // else upload a new file
  if (existing) {
    const file = await fileSvc.uploadNewVersion(
      req.decoded.RESERVED_USID,
      req.trustVersionFileId,
      existing._id,
      req.file.blobSize,
      req.file.url.split('?')[0],
      req.file.shaHash,
      req.time,
      req.userAddress,
      req.file.originalname,
      req.query.path
    )
    //SS-50: add new feed for document uploadded
    //console.log(FeedType.UPLOAD)
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
      action: 'has uploaded',
      documentType,
      createAt: new Date(),
      type: 1
    }
    await feedSvc.addFeed(feed)
    res.json(resMapper.filesView(file, req.decoded))
  } else {
    req.query.path = '/Checklist'
    const category = documentType
    var [file, errMsg] = await fileSvc.uploadFile(
      req.decoded.RESERVED_USID,
      req.trustVersionFileId,
      req.file.originalname,
      req.file.blobSize,
      req.file.url.split('?')[0],
      req.file.shaHash,
      req.time,
      req.userAddress,
      req.query.path,
      category
    )
    if (errMsg) {
      errors.makeMessage(res, errors.invalidRequestPayload, errMsg)
    } else {
      //SS-50: add new feed for document uploadded
      console.log(FeedType.UPLOAD)
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
        action: 'has uploaded',
        documentType,
        createAt: new Date(),
        type: 1
      }
      await feedSvc.addFeed(feed)
      res.json(resMapper.filesView(file, req.decoded))
    }
  }
}

async function archiveOrRestore(req, res, next) {
  let fileIds = req.body.documents
  let result, errMsg
  if (!(req.body.archived === true || req.body.archived === false)) {
    errMsg = 'Field "archived" should be boolean'
  } else if (!Array.isArray(fileIds)) {
    errMsg = 'Field "documents" should be list of fileId'
  } else {
    ;[result, errMsg] = await fileSvc.archiveOrRestoreAccess(
      req.body.RESERVED_USID,
      req.body.documents,
      req.body.archived,
      req.userAddress,
      req.time
    )
  }

  if (errMsg) {
    errors.makeMessage(res, errors.invalidRequestPayload, errMsg)
  } else {
    if (result.success) {
      res.json(result)
    } else {
      res.status(422)
      res.json(result)
    }
  }
}

async function modifyFileMetaThenResp(req, res, next) {
  let [fileRes, errMsg] = await fileSvc.modifyFileMeta(
    req.body.RESERVED_USID,
    req.params.accessId,
    req.body,
    req.time,
    req.userAddress
  )
  if (errMsg) {
    errors.makeMessage(res, errors.invalidRequestPayload, errMsg)
  } else {
    res.json(resMapper.filesView(fileRes, req.decoded))
  }
}

async function deleteDocument(req, res, next) {
  try{
    const documentId = req.params.documentId
    fileSvc.deleteFile(documentId)
    console.log(documentId)
    //update profile strength
    await userSvc.updateProfileStrength(req.decoded.userId)
    res.json({success: true})
  }catch(e){
    console.log(e)
    errors.makeMessage(res, errors.InternalServerError, e)
  }
}

async function countUpload(req, res, next) {
  try{
    const data = await fileSvc.countUpload(req.params.type)
    res.json(data)
  }catch(e){
    console.log(e)
    errors.makeMessage(res, errors.InternalServerError, e)
  }
}

module.exports = {
  multerUpload,
  listFiles,
  listChecklistFiles,
  handleChecklistUpload,
  downloadZip,
  retrieveFileById,
  handleUpload,
  handleUploadVersion,
  archiveOrRestore,
  modifyFileMetaThenResp,
  retrieveAllVersions,
  multerMultiUploads,
  deleteDocument,
  countUpload
}
