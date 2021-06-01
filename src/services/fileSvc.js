module.exports = {}
const { DOCUMENT_TYPES, DOCUMENT_TYPE } = require('../constants')
const { NotificationType } = require('../types')
const { NotificationHelper } = require('../helper/notificationHelper')
const { SpaceService } = require('./spaceSvc')
const spaceSvc = SpaceService.getInstance()
const { checklistSvc } = require('./checklistSvc')
const cError = require('../helper/customError')
var _ = require('lodash')
const { Map } = require('immutable')
var log = require('../helper/logger.js').log
var config = require('../config')
const constants = require('../constants')
var crypto = require('crypto')
var mongoose = require('mongoose')
var File = mongoose.model('File')
var Sharing = mongoose.model('Sharing')
var History = mongoose.model('History')
var User = mongoose.model('User')
const Form = mongoose.model('Form')
const AccessModel = mongoose.model('Access')
var emailSvc = require('./emailSvc')
var historySvc = require('./historySvc')
let userSvc = require('./userSvc')
const actionSvc = require('./actionSvc')
let azureStorageSvc = require('./azureStorageSvc')
let archiver = require('archiver')
let Bluebird = require('bluebird')
const ShareEmail = mongoose.model('ShareEmail')

const {
  startsWith,
  normalizePath,
  getExtension,
  extractFilename,
  genLink,
  getDriveDownloadableLink,
} = require('../helper/util')

const listSharedFolderAccess = async (fileId, asPath, originalType, originalPermissions) => {
  // get owner access for (userId, path)
  // list files prefix by path. (exclude the root file itself)
  // replace owner access path as `asPath`
  const ownerAccess = await AccessModel.findOwner(fileId)
  const ownerAccessTree = await AccessModel.listByPathUWithFile(ownerAccess.USID, ownerAccess.fullpath + '/')
  const ownerAccessTreeAsPath = ownerAccessTree.map((access) => {
    const newPath = access.path.replace(ownerAccess.path, asPath)
    const [pathNormNew, ,] = normalizePath(`${newPath}/${getExtension(access.name, access.extension)}`)
    return {
      ...access,
      path: newPath,
      fullpath: pathNormNew,
      type: originalType,
      permissions: originalPermissions,
    }
  })
  return ownerAccessTreeAsPath
}

const accessFileObject = async (USID, access) => {
  const accessesCompleted = await accessesFileObject(USID, [access])
  return accessesCompleted[0]
}

const listAllAccesses = async (USID) => {
  const accesses = await AccessModel.listSharedAccessesWithFiles(USID)
  const accessComplete = _.flatten(
    await Promise.all(
      accesses.map(async (access) => {
        if (access.type !== constants.MODEL.ACCESS.owner) {
          // not owner access
          if (Array.isArray(access.permissions) && access.permissions.length) {
            // inherit owner, access permissions, access type fields from the parent access
            // replace owner to all of the children
            // replace permission to all of the children
            const subFolder = await listSharedFolderAccess(
              access.fileId._id,
              access.path,
              access.type,
              access.permissions
            )
            return [access].concat(subFolder)
          } else {
            // if permissions == [], discard it
            return
          }
        }
        return access
      })
    )
  ).filter((i) => i)

  const accessesComplete = await accessesFileObject(USID, accessComplete)
  return accessesComplete
}

const listChecklistAccesses = async (USID) => {
  //remove actions, recipients
  const STATUSES = constants.FORM_ACTION

  const userSpace = await spaceSvc.findMyUserSpace({ _id: USID })
  const accesses = await AccessModel.listChecklistAccessesWithFiles(USID)
  const accessesComplete = await accessesFileObject(USID, accesses)
  const documentTypes = await checklistSvc.fetchDocumentTypes(userSpace.spaceId)
  const documentTitles = documentTypes.map(x=>x.title)
  // console.log(documentTitles.includes("Work Visa"))
  //console.log(accessesComplete)
  let result = []
  for(let i =0; i< accessesComplete.length;i++){
    let access = accessesComplete[i]
    if(documentTitles.includes(access.category)){
      let accepted = false;
      if(access && access.actions) {
        for (let j = 0; j < access.actions.length; j++) {
          const action = access.actions[j];
          if(action && action.status && action.status === STATUSES.accepted.text){
            accepted = true;
          }
        }
      }
      access.verified = accepted;
      const accessObj = await AccessModel.findById(access._id)
      access.documentUploaded = (!accessObj.deletedAt || (accessObj.deletedAt && accessObj.deletedAt == 0));
      result.push(access)
    }
  }
  //console.log(result)
  const existingTypes = result.map((access) => access.category).filter((access) => !!access)
  const neededTypes = documentTypes.map(doc => doc.title)
  console.log(documentTypes)
  //console.log(existingTypes)
  const spaceId = String(userSpace.spaceId)
  for (let index = 0; index < neededTypes.length; index++) {
    const title = neededTypes[index]
    if (!existingTypes.includes(title)) {
      const neededDocumentType  = await checklistSvc.fetchDocumentType(spaceId, title)
      const categoryDescription = neededDocumentType && neededDocumentType.description || ''
      result.push({
        id: '',
        name: '',
        category: title,
        extension: '',
        path: constants.RESERVED_PATH.CHECKLIST,
        active: true,
        archive: false,
        documentUploaded: false,
        verified: false,
        recipients: [],
        categoryDescription,
      })
    }
  }
  //SS-293: re-order doc list
  let correctOrderedType = ["verbal_contract","photo","passport","skill_training","language_training","education","work_visa","visa_authorisation_number","employment_agreement_contract","medical_test","temporary_visa", "smart_card","air_travel","work_and_residence_permit","proof_of_payment"]
  let orderedResult = []
  for (let index = 0; index < correctOrderedType.length; index++) {
    let tempItem = result.filter((object) => {
      return object["category"] == correctOrderedType[index]
     })[0]
     if (tempItem) {
       orderedResult.push(tempItem)
     }
  }
  return orderedResult
}

const findChecklistAccess = async (USID, documentType) => {
  return await AccessModel.findChecklistAccess(USID, documentType)
}

const retrieveMyAccessById = async (accessId, USID) => {
  try {
    const access = await AccessModel.getAccessById(accessId)
    //console.log("access: " + JSON.stringify(access))
    if (String(access.USID) === String(USID)) {
      return await accessFileObject(USID, access)
    } else {
      throw new cError.ResourceNotFoundException(`Document not found`)
    }
  } catch (err) {
    throw new cError.ResourceNotFoundException(`Document not found`)
  }
}

const retrieveFile = async (fileId, USID) => {
  // fix: owner field
  try {
    const access = await AccessModel.getAccess(fileId, USID)
    return await accessFileObject(USID, access)
  } catch (err) {
    throw new cError.ResourceNotFoundException(`Document not found`)
  }
}

const retrieveAllVersions = async (accessId, USID) => {
  const myAccess = await retrieveMyAccessById(accessId, USID)
  const file = await File.getFileById(myAccess.fileId)
  const currentVersionId = file.versionId
  const allVersions = file.versions
  const USIDs = file.versions.map((v) => v.uploader)
  const userSpaces = await spaceSvc.fetchUserSpacesByIds_(USIDs)
  const userIds = userSpaces.map(us => us.userId)
  const users = await User.listUserByIds(userIds)
  const versionsResp = allVersions.map((v) => {
    const userSpace = userSpaces.find((us) => String(us._id) === String(v.uploader))
    const uploader = users.find((u) => String(u._id) === String(userSpace.userId))
    const uri = myAccess.isFolder ? '' : getDriveDownloadableLink(v.uploader, v._id, myAccess.name, myAccess.extension)
    return {
      _id: v._id,
      isCurrentVer: String(v._id) === String(file.versionId),
      uploaded: v.uploaded,
      size: v.size,
      uri,
      uploader: {
        email: uploader.email,
        name: uploader.name,
        surname: uploader.surname,
      },
    }
  })
  return versionsResp
}

let filenameInc = (name) => {
  var myRegexp = /(.*) \((\d*)\)/g
  var match = myRegexp.exec(name)
  var numCopy
  if (match && match[1] && match[2]) {
    name = match[1]
    numCopy = parseInt(match[2]) + 1
  } else {
    numCopy = 2
  }
  return `${name} (${numCopy})`
}

let filenameCollisionHandler = async (USID, path, name, extension) => {
  let nameIter = name
  while (1) {
    const fileGet = await AccessModel.getAccessByFullpath(USID, path, nameIter, extension)
    if (!fileGet) {
      return nameIter
    } else {
      nameIter = filenameInc(nameIter)
    }
  }
}

let newVersionFormShare = async (fileId, oldVersionId, newVersionId, ts, ipAddress) => {
  const accesses = await AccessModel.getSharingAccesses(fileId)
  const permissionFormId = _.flatten(
    accesses.map((acc) => {
      return acc.permissions
        .filter((perm) => perm.type === constants.RIGHT_TYPE.FORM && String(perm.versionId) === String(oldVersionId))
        .map((perm) => perm.ref)
    })
  )
  const forms = await Form.getFormsWithTemplateByIds(permissionFormId)
  const formsRecreated = await Promise.all(
    forms.map(async (f) => {
      //create form
      //create hist
      const formIdVerf = mongoose.Types.ObjectId()
      const formCreated = await Form.createForm(
        formIdVerf,
        constants.FORM_ACTION.pending.text,
        f.message,
        ts,
        null,
        f.sharingId,
        f.initiatorId,
        f.recipientId
      )
      const createNotificationDto = {
        recipientId: f.recipientId,
        initiatorId: f.initiatorId,
        type: NotificationType.VERSION,
        formId: formCreated._id,
        docId: f.sharingId,
      }
      await NotificationHelper.notifyUser(createNotificationDto)
      const histOptions = { meta: JSON.stringify(formCreated) }
      const history = await historySvc.saveThenStampHistory(
        constants.HISTORY_ACTION.actionCreated,
        ts,
        fileId,
        f.initiatorId,
        f.sharingId,
        ipAddress,
        null,
        histOptions
      )

      return formCreated
    })
  )
  return formsRecreated
}

let uploadNewVersion = async (USID, versionFileId, accessId, size, storage, shaHash, ts, ipAddress, filename, pathR) => {
  const myAccess = await retrieveMyAccessById(accessId, USID)
  const oldVersionId = myAccess.versionId
  const version = {
    _id: versionFileId,
    uploader: USID,
    uploaded: ts,
    size,
    storage,
    status: 0,
    hash: shaHash,
  }
  const formsRecreated = await newVersionFormShare(myAccess.fileId, oldVersionId, versionFileId, ts, ipAddress)
  await Promise.all(
    formsRecreated.map(async (f) => {
      const perm = [
        { type: constants.RIGHT_TYPE.FORM, ref: f._id, right: constants.RIGHTS.READ, versionId: versionFileId },
      ]
      await AccessModel.pushPermissions(f.sharingId, f.recipientId, perm)
    })
  )
  const file = await File.pushNewVersion(myAccess.fileId, version)

  const history = await historySvc.saveThenStampHistory(
    constants.HISTORY_ACTION.newVersion,
    ts,
    myAccess.fileId,
    USID,
    undefined,
    ipAddress
  )
  //update fullpath
  const path = pathR ? pathR : '/'
  const [pathNorm, ,] = normalizePath(path)
  const [name, extension] = extractFilename(filename)
  const nameUniq = await filenameCollisionHandler(USID, pathNorm, name, extension)
  const [fullpathNorm, ,] = normalizePath(`${pathNorm}/${getExtension(nameUniq, extension)}`)
  //console.log("upload new version: " + fullpathNorm)
  //console.log("upload new version: " + accessId)
  await AccessModel.uploadNewVersion(accessId, fullpathNorm.toLowerCase(), name, extension)
  //fix bug ss 429
  await AccessModel.uploadNewVersionForAccess(myAccess.fileId, fullpathNorm.toLowerCase(), name, extension)
  //SS 391
  const lstShareEmail = await ShareEmail.getByFile(myAccess.fileId)
  for(let i = 0; i < lstShareEmail.length; i++){
    const element = lstShareEmail[i]
    const remote = await User.findById(element.remoteId)
    const access = await AccessModel.getAccessByAccessId(element.accessId)
    await sendShareEmail(element.ownerId, element.fileId, remote, access, element.isFolder, element.option)
  }

  const newAccess = await retrieveMyAccessById(accessId, USID)
  return newAccess
}

let uploadFile = async (USID, versionFileId, filename, size, storage, shaHash, ts, ipAddress, pathR, category) => {
  const fileId = mongoose.Types.ObjectId()
  const path = pathR ? pathR : '/'
  const [pathNorm, ,] = normalizePath(path)
  if (pathNorm !== '/') {
    //if parent is not root, then check parent existence
    const exist = await checkFolderExist(USID, pathNorm)
    if (!exist) return [, 'Target folder does not exist']
  }
  log.info('Handling file', filename, new Date())
  const eventTime = ts
  const [name, extension] = extractFilename(filename)
  const nameUniq = await filenameCollisionHandler(USID, pathNorm, name, extension)
  const [fullpathNorm, ,] = normalizePath(`${pathNorm}/${getExtension(nameUniq, extension)}`)
  const file = {
    _id: fileId,
    archived: false, // TODO: no archive flag
    isFolder: false,
    category,
    versionId: versionFileId,
    versions: [
      {
        _id: versionFileId,
        uploader: USID,
        uploaded: eventTime,
        size,
        storage,
        status: 0,
        hash: shaHash,
      },
    ],
  }
  const access = {
    _id: mongoose.Types.ObjectId(),
    fileId,
    USID,
    category,
    documentType: category,
    type: constants.MODEL.ACCESS.owner,
    active: true,
    name: nameUniq,
    extension: extension,
    path: pathNorm,
    fullpath: fullpathNorm.toLowerCase(),
    createdAt: eventTime,
    modifiedAt: eventTime,
  }

  const fileRes = (await File.addFile(file)).toObject()
  const accessObj = await AccessModel.createAccess(access)
  const history = await historySvc.saveThenStampHistory(
    constants.HISTORY_ACTION.create,
    eventTime,
    fileId,
    USID,
    undefined,
    ipAddress
  )
  const accessRes = await accessFileObject(USID, accessObj)
  return [accessRes]
}

const fileOrFolderCollisionHandler = async (USID, access, isFolder) => {
  const [fullpathNorm, parent, curName] = normalizePath(access.fullpath)
  let pathShared, nameShared, fullpathShared
  if (isFolder) {
    const nameUniq = await filenameCollisionHandler(USID, constants.RESERVED_PATH.SHARED, curName, access.extension)
    nameShared = access.name
    pathShared = constants.RESERVED_PATH.SHARED + '/' + nameUniq
    fullpathShared = pathShared.toLowerCase()
  } else {
    const nameUniq = await filenameCollisionHandler(USID, constants.RESERVED_PATH.SHARED, access.name, access.extension)
    nameShared = nameUniq
    pathShared = constants.RESERVED_PATH.SHARED
    const [fullpathNorm, ,] = normalizePath(`${pathShared}/${getExtension(nameUniq, access.extension)}`)
    fullpathShared = fullpathNorm.toLowerCase()
  }
  return [pathShared, nameShared, fullpathShared]
}

const sendShareEmail = async (userId, fileId, user, accessRes, isFolder, options) => {
  const email = user.email
  const name = user.name
  const surname = user.surname
  const lang = constants.getSupportLang(user.lang)
  const isRegistered = user.isRegistered === false ? false : true
  const linkParam = {
    view: options.linkType,
    id: options.linkId,
    email: email,
    name: name,
    surname: surname,
    isRegistered,
    lang,
  }
  //const link = genLink(options.linkType, linkParam)
  //ss-526
  const link = `https://safestep.page.link/notifications`
  const owner = await userSvc.getUserById(userId)
  const username = `${owner.name} ${owner.surname}`
  const [, , curName] = normalizePath(accessRes.fullpath)
  const filename = isFolder ? curName : getExtension(accessRes.name, accessRes.extension)
  emailSvc.sendEmail(email, link, filename, name, surname, username, options.isVerify, lang)
}

const shareFile = async (USID, myAccess, remoteUSID, ts, ipAddress, options) => {
  // upsert an access record with with {userId, fileId, permission}
  // send email, record in history
  // if insert, eliminate name duplication as it can cause strange/undefined behaviour like:
  // archive folder, zip download folder requires name uniqueness

  // const isHandlingForm = Array.isArray(formId) && formId.length
  // const histType = isHandlingForm ? constants.HISTORY_ACTION.actionCreated: constants.HISTORY_ACTION.share
  const remoteUserId = await spaceSvc.findUserIdByUserSpace({_id: remoteUSID, valid: true})
  const remoteUser = await userSvc.getUserById(remoteUserId)

  const newAccessId = mongoose.Types.ObjectId()

  const inArchivedDir = startsWith(myAccess.path, constants.RESERVED_PATH.ARCHIVED) ? true : false
  if (inArchivedDir) throw new cError.InvalidStateTransitException('You cannot share an archived file')

  const remoteAccess = await AccessModel.getAccess(myAccess.fileId, remoteUSID)
  const isFolder = myAccess.isFolder

  let accessRes
  if (!remoteAccess) {
    const [pathShared, nameShared, fullpathShared] = await fileOrFolderCollisionHandler(remoteUSID, myAccess, isFolder)
    const nonOtherAccess = {
      _id: newAccessId,
      fileId: myAccess.fileId,
      USID: remoteUSID,
      type: constants.MODEL.ACCESS.sharing,
      active: true,
      name: nameShared,
      extension: myAccess.extension,
      path: pathShared,
      fullpath: fullpathShared.toLowerCase(),
      createdAt: ts,
      modifiedAt: ts,
      permissions: options.permissions,
      category: myAccess.category,
      documentType: myAccess.documentType,
    }

    const access = myAccess.documentType !== DOCUMENT_TYPE.Other ? nonOtherAccess :
      { ...nonOtherAccess,
        documentTypeOther: myAccess.documentTypeOther
      }
    const accessObj = await AccessModel.createAccess(access)
    accessRes = await accessFileObject(USID, accessObj)
    const createNotificationDto = {
      recipientId: remoteUSID,
      initiatorId: USID,
      type: NotificationType.SHARED,
      docId: accessRes.accessId,
    }
    //await NotificationHelper.notifyUser(createNotificationDto)
  } else {
    const accessObj = await AccessModel.pushPermissions(remoteAccess._id, remoteUSID, options.permissions)
    accessRes = await accessFileObject(USID, accessObj)
  }
  const ownerUserId = await spaceSvc.findUserIdByUserSpace({_id: USID, valid: true})
  //console.log("send share email: " + JSON.stringify(accessRes))
  await sendShareEmail(ownerUserId, myAccess.fileId, remoteUser, accessRes, isFolder, options)
  //SS 391
  const shareEmailObj = {
    ownerId: ownerUserId,
    remoteId: remoteUserId,
    fileId: myAccess.fileId,
    accessId: accessRes._id,
    isFolder: isFolder,
    option: {
      linkType: options.linkType,
      linkId: options.linkId,
      isVerify: options.isVerify
    }
  }
  await ShareEmail.upsert(shareEmailObj)

  if (options.histType === constants.HISTORY_ACTION.share) {
    let history = await historySvc.saveThenStampHistory(
      options.histType,
      ts,
      myAccess.fileId,
      USID,
      accessRes.accessId,
      ipAddress,
      remoteUser.email
    )
  }
  return accessRes
}

const modifyFileMeta = async (USID, accessId, body, ts, ipAddress) => {
  let fileRes, errMsg
  const access = await retrieveMyAccessById(accessId, USID)
  if (access) {
    if (access.isFolder) {
      errMsg = 'Only file is allowed'
    } else {
      let clone = {}
      Object.assign(clone, access)
      if (body.hasOwnProperty('name')) {
        if (access.archived) {
          errMsg = 'You cannot rename an archived file'
        }
        if (access.name != body.name) {
          access.name = body.name
        }
      }
      if (body.hasOwnProperty('extension')) {
        if (access.extension != body.extension) {
          access.extension = body.extension
        }
      }

      if (body.hasOwnProperty('category')) {
        if (DOCUMENT_TYPES.includes(body.category)) {
          if (access.documentType !== body.category) {
            access.documentType = body.category
          }
        } else {
          if (access.documentType !== DOCUMENT_TYPE.Other) {
            access.documentType = DOCUMENT_TYPE.Other
            access.documentTypeOther = body.category
          }
        }
      }

      if (body.hasOwnProperty('category')) {
        access.category = body.category
      }
      if (!errMsg && !_.isEqual(access, clone)) {
        const fileExist = await AccessModel.getAccessByFullpath(USID, access.path, access.name, access.extension)
        const isRenaming = Boolean(body.extension || body.name)
        if (!fileExist || !isRenaming) {
          // check file name collision
          const [pathNormNew, ,] = normalizePath(`${access.path}/${getExtension(access.name, access.extension)}`)
          access.fullpath = pathNormNew.toLowerCase()
          await AccessModel.updateAccess(access)

          if (body.hasOwnProperty('category')) {
            const sharedDocs = await AccessModel.getSharingAccesses(access.fileId)
            const updatedShareDocs = sharedDocs.map(shared => {
              const updated = {
                ...shared,
                category: access.category,
                documentType: access.documentType
              }
              return (access.documentType !== DOCUMENT_TYPE.Other) ? updated :
                {
                  ...updated,
                  documentTypeOther: access.documentTypeOther
                }
            })
            await Promise.all(updatedShareDocs.map(async s => await AccessModel.updateAccess(s)))
          }

          const history = await historySvc.saveThenStampHistory(
            isRenaming ? constants.HISTORY_ACTION.renamed : constants.HISTORY_ACTION.categoryAdded,
            ts,
            access.fileId,
            USID,
            undefined,
            ipAddress
          )
        } else {
          errMsg = 'Destination already exists'
        }
      }
      fileRes = await retrieveMyAccessById(accessId, USID)
    }
  } else {
    errMsg = 'File not exist'
  }
  return [fileRes, errMsg]
}

const mergeByXOR = (a, b) => a !== b
const mergeByOR = (a, b) => a || b

// input 3 maps, return map as:((newMap XOR oldMap) || requestMap)
let isCollectionChanged = (newMap, oldMap, requestMap) => {
  const newXOROldMap = oldMap.mergeWith(mergeByXOR, newMap)
  const result = newXOROldMap.mergeWith(mergeByOR, requestMap).toJSON()

  return result
}

// TODO 0: handle duplicate fileIds.
// sol: uniq function
// TODO 1: handle fileIds which have parent-child relations.
// problem: checking may involves o(n!) => O(n^n) complexity.
// Sol: make it synchornized and order matters. So its deterministic and no race conditions could happen
// Aboves may cause race conditions which may update the same record multiple times in any orders undefined hence non-deterministic.
const archiveOrRestoreAccess = async (USID, accessIds, archive, ipAddress, ts) => {
  // LEFTOVER: make prepareUpdateOnes accecpt newPath and originalPath as list, so it can iterates.
  // calc the difference with accessOldMem
  const accesses = await AccessModel.getMyAccessesByAccessIds(USID, accessIds)
  accesses.map((access) => {
    if (archive) reservedPathValidation(access.fullpath)
  })

  const accessesToBeProcess = [],
    pathAfterNormList = [],
    originalPathList = []
  for (const access of accesses) {
    const isRestorable = access.originalPath ? true : false
    const inArchivedDir = startsWith(access.path, constants.RESERVED_PATH.ARCHIVED)
    if (!(inArchivedDir ^ archive)) {
      // is making state transition between `/archived/` and action
      console.log('no state transition')
      continue
    }
    if (!(archive || (!archive && isRestorable))) {
      // allow archive or restore *isRestorable* object (originalPath exists)
      console.log('is not archive or restorable')
      continue
    }
    let originalPath, newPath
    if (archive) {
      const [, parent] = normalizePath(access.fullpath)
      originalPath = parent
      newPath = constants.RESERVED_PATH.ARCHIVED
    } else {
      originalPath = null
      newPath = access.originalPath ? access.originalPath : '/'
      let folderExist = await checkFolderExist(USID, access.originalPath)
      if (!folderExist) {
        let [result, err] = await createFolderRecursive(USID, access.originalPath, ts)
        if (err) {
          console.log('err', err)
          continue
          // TODO: failed to reconstructure the folder. TODO Task: Handle this in a nicer way.
          // No throw for now, so the rest of the accesses restore requests can keep do the operation
        }
      }
    }
    accessesToBeProcess.push(access)
    pathAfterNormList.push(newPath)
    originalPathList.push(originalPath)
  }

  const accessOldMem = new Map(accesses.map((accessOld) => [accessOld._id.toString(), accessOld.path]))
  const filesUpdateOp = await prepareUpdateOnes(USID, accessesToBeProcess, pathAfterNormList, originalPathList)
  console.log('filesUpdateOp', filesUpdateOp)

  const filesUpdateOpBulk = [].concat(...filesUpdateOp).filter((i) => i)
  if (filesUpdateOpBulk && filesUpdateOpBulk.length) {
    const bulkResult = await AccessModel.bulkWrite(filesUpdateOpBulk)
  }
  const accessesNew = await AccessModel.getMyAccessesByAccessIds(USID, accessIds)
  const accessesNewMem = new Map(accessesNew.map((access) => [access._id.toString(), access.path]))
  const accessIdsReqM = new Map(accessIds.map((accessId) => [accessId, false]))
  const filesTransM = isCollectionChanged(accessesNewMem, accessOldMem, accessIdsReqM)
  const documents = Object.keys(filesTransM).map((key) => ({ id: key, success: filesTransM[key] }))
  const overall = documents.every((op) => op.success)
  const result = {
    success: overall,
    documents: documents,
  }
  return [result]
}

const getFilesFromMetaFiles = async (USID, accesses) => {
  //if it's file => (fileId, file.name) (root on the zip)
  //is it's folder => list all files by folder.fullpath
  //  subFile.fullpath replace folder parent path as '' (relative path on the zip)
  const filesToDownload = await Promise.all(
    accesses.map(async (access) => {
      if (access.fileId.isFolder) {
        const subFiles = await AccessModel.listByPathUWithFile(USID, access.fullpath)
        return subFiles
          .map((subF) => {
            const [pathNorm, parent, folderName] = normalizePath(access.path)
            const zipPath = subF.fullpath.replace(parent, '')
            return { ...subF, zipPath, isFolder: subF.fileId.isFolder }
          })
          .filter((ele) => ele) // sub folder can be omited (meta file)
      } else {
        const filename = getExtension(access.name, access.extension)
        return { ...access, zipPath: filename, isFolder: false }
      }
    })
  )
  return _.flatten(filesToDownload)
}

const streamZip = async (res, USID, accessIds) => {
  const accesses = await AccessModel.getMyAccessesByAccessIds(USID, accessIds)

  // if (accesses.length == 1) { // if there's only one file, download it from azure instead of zip
  //   let file = filesSelected[0]
  //   return res.redirect(307, getDriveDownloadableLink(file.user, file._id, file.name, file.extension))
  // }

  const filesToDownload = await getFilesFromMetaFiles(USID, accesses)
  const archive = archiver('zip', { zlib: { level: 1 } })
  archive.on('warning', function (err) {
    log.error(err)
    throw err
  })

  archive.on('error', function (err) {
    log.error(err)
    throw err
  })

  res.writeHead(200, {
    'Content-Type': 'application/zip',
    'Content-Disposition': 'attachment; filename=' + 'download.zip',
  })

  archive.pipe(res, { end: false })
  await Bluebird.mapSeries(filesToDownload, async (access, index) => {
    if (!access.isFolder) {
      log.info(`createBlobReadStream for ${access.name}`)
      const curVersion = access.fileId.versions.find((v) => String(v._id) === String(access.fileId.versionId))
      const storage = curVersion.storage
      const elements = storage.split('/')
      const blobReadStream = azureStorageSvc.createBlobReadStream(
        config.azure.containerName,
        `${elements[elements.length - 2]}/${elements[elements.length - 1]}`
      )
      archive.append(blobReadStream, { name: `${access.zipPath}` })
      return new Promise((resolve, reject) => {
        blobReadStream.on('end', function () {
          log.info(`read stream ${access.zipPath} ended`)
          resolve()
        })
        blobReadStream.on('error', function (err) {
          log.error(`Error on stream ${access.zipPath}:`, err)
          reject(err)
        })
      })
    } else {
      archive.append(null, { name: `${access.zipPath}/` })
    }
  })
    .then(function (result) {
      archive.on('end', () => {
        log.info('archiver finished')
        res.end()
      })
    })
    .catch(function (e) {
      log.error('Error streaming zip file:', e)
      // there's actually no way to re-set the status to client from 200 to 500, as its chunked and had sent to client
      res.status(500)
      // sharp cut the connection to indicate error and causing failure to the download without proper end of chunk response (zero-length chunk)
      res.connection.destroy()
    })
  archive.finalize()
}

const checkFolderExist = async (USID, pathNorm) => {
  // path must be normalized as '/a/b'
  const extension = '',
    filename = '' //folder extension and filename as empty string
  const file = await AccessModel.getAccessByFullpath(USID, pathNorm, filename, extension)
  if (file) {
    return file
  } else {
    return false
  }
}

const constructAccess = (USID, fileId, pathNorm, ts) => {
  return {
    _id: mongoose.Types.ObjectId(),
    fileId,
    USID,
    type: constants.MODEL.ACCESS.owner,
    active: true,
    formId: [],
    name: '',
    extension: '',
    path: pathNorm,
    fullpath: `${pathNorm.toLowerCase()}`,
    createdAt: ts,
    modifiedAt: ts,
  }
}

const constructFolder = (USID, uploaded) => {
  const versionFileId = mongoose.Types.ObjectId()
  return {
    _id: mongoose.Types.ObjectId(),
    archived: false,
    isFolder: true,
    versionId: versionFileId,
    versions: [
      {
        uploader: USID,
        _id: versionFileId,
        uploaded,
        size: 0,
        storage: '',
        status: -1,
      },
    ],
  }
}

const createFolderRecursive = async (USID, path, ts) => {
  const [pathNorm, ,] = normalizePath(path)
  const pathArr = pathNorm.split('/').slice(1)
  let results = [],
    errs = []
  for (let index = 0; index < pathArr.length; index++) {
    const curPath = '/' + pathArr.slice(0, index + 1).join('/')
    if (curPath == '/') continue
    const [result, err] = await createFolder(USID, curPath, ts)
    results.push(result)
    errs.push(err)
  }
  return [, errs[errs.length - 1]]
}

const createFolder = async (USID, path, ts) => {
  const [pathNorm, parent, folderName] = normalizePath(path)
  if (pathNorm.length < 2) {
    return [, `Path ${pathNorm} invalid`]
  }
  if (parent !== '/') {
    //if parent is not root, then check parent existence
    const parentExist = await checkFolderExist(USID, parent)
    if (!parentExist) {
      return [, 'Parent Folder does not exist']
    }
  }

  const exist = await checkFolderExist(USID, pathNorm)
  if (exist) {
    return [, `"${folderName}" already exists`]
  }

  const folder = constructFolder(USID, ts)
  const folderRes = (await File.addFile(folder)).toObject()
  const access = constructAccess(USID, folderRes._id, pathNorm, ts)
  const accessObj = await AccessModel.createAccess(access)
  const accessRes = await accessFileObject(USID, accessObj)
  return [accessRes]
}

function reservedPathValidation(path) {
  const [pathNorm, ,] = normalizePath(String(path).toLowerCase())
  const errorMsg = `Modification on reserved path is not allowed ${path}`
  Object.values(constants.RESERVED_PATH).map((reserved) => {
    if (startsWith(pathNorm, String(reserved).toLowerCase())) throw new cError.PermissionDeniedException(errorMsg)
  })
  return true
}

const deleteFolder = async (USID, path) => {
  let accessRes, errMsg
  const [pathNorm, ,] = normalizePath(path)

  const accesses = await AccessModel.listMyAccessByPath(USID, pathNorm)
  if (accesses.length === 0) {
    errMsg = 'Folder does not exist'
  } else if (accesses.length === 1) {
    const access = await AccessModel.deleteByPath(USID, pathNorm)
    if (access) {
      const file = await File.deleteFolderById(access.fileId)
      accessRes = await accessFileObject(USID, access)
    } else {
      errMsg = 'Error when deleting folders'
    }
  } else {
    errMsg = 'You have to remove all the items in this folder before you can delete the folder.'
  }
  return [accessRes, errMsg]
}

const updateByDir = async (USID, access, pathAfterNorm, originalPathNorm) => {
  const [pathNorm, , folderName] = normalizePath(access.path)
  const [name, extension] = extractFilename(folderName)
  if (startsWith(pathAfterNorm, access.path)) {
    // trying to move parent to child recursively
    console.log('recursive detected', access.path, pathAfterNorm)
    return null
  } else {
    const nameUniq = await filenameCollisionHandler(USID, pathAfterNorm, name, extension)
    const nameUniqComplete = getExtension(nameUniq, extension)
    const childAccesses = await AccessModel.listByPathU(USID, access.path)
    return childAccesses.map((childA) => {
      const [pathNormSub, ,] = normalizePath(childA.path.replace(pathNorm, `${pathAfterNorm}/${nameUniqComplete}/`))
      const [pathNormSubNew, ,] = normalizePath(`${pathNormSub}/${getExtension(childA.name, childA.extension)}`)
      const originalPath = access._id && access._id.toString() === childA._id.toString() ? originalPathNorm : null
      // set originalPath to parent access only
      return {
        updateOne: {
          filter: { _id: childA._id },
          update: { path: pathNormSub, fullpath: pathNormSubNew.toLowerCase(), originalPath },
        },
      }
    })
  }
}

//Warning: if accesses passed in contain two access with relationship of ancestor/../descendant, the behaviour is undefined. As there will be two updateOne modifying the same record in DB.
const prepareUpdateOnes = async (USID, accesses, pathAfterNormList, originalPathListOption = []) => {
  if (accesses.length !== pathAfterNormList.length) {
    throw new cError.InternalServerError(`Internal error when moving folders`)
  }
  return Promise.all(
    accesses.map(async (access, i) => {
      const originalPathOption = originalPathListOption[i]
      const [originalPathNorm, ,] = originalPathOption ? normalizePath(originalPathOption) : [null, ,]
      let updateOne
      if (access.fileId.isFolder) {
        const [, parentPath] = normalizePath(access.path)
        if (parentPath == pathAfterNormList[i]) {
          // skipping update of identity a => a
          updateOne = null
        } else {
          updateOne = updateByDir(USID, access, pathAfterNormList[i], originalPathNorm)
        }
      } else {
        if (access.path == pathAfterNormList[i]) {
          // skipping update of identity a => a
          updateOne = null
        } else {
          const nameUniq = await filenameCollisionHandler(USID, pathAfterNormList[i], access.name, access.extension)
          const [pathNormNew, ,] = normalizePath(`${pathAfterNormList[i]}/${getExtension(nameUniq, access.extension)}`)
          updateOne = {
            updateOne: {
              filter: { _id: access._id },
              update: {
                name: nameUniq,
                path: pathAfterNormList[i],
                fullpath: pathNormNew.toLowerCase(),
                originalPath: originalPathNorm,
              },
            },
          }
        }
      }
      return updateOne
    })
  )
}

const updateDir_ = async (USID, accessIds, pathAfterNorm) => {
  reservedPathValidation(pathAfterNorm)
  if (pathAfterNorm !== '/') {
    //if target is not root, then check for its existence
    const exist = await checkFolderExist(USID, pathAfterNorm)
    if (!exist) return [, 'Target folder does not exist']
  }
  const accesses = await AccessModel.getMyAccessesByAccessIds(USID, accessIds)
  accesses.map((access) => reservedPathValidation(access.fullpath))
  const accessOldMem = new Map(accesses.map((accessOld) => [accessOld._id.toString(), accessOld.path]))
  const pathAfterNormList = Array(accesses.length).fill(pathAfterNorm)
  const filesUpdateOp = await prepareUpdateOnes(USID, accesses, pathAfterNormList)
  const filesUpdateOpBulk = [].concat(...filesUpdateOp).filter((i) => i)
  if (filesUpdateOpBulk && filesUpdateOpBulk.length) {
    const bulkResult = await AccessModel.bulkWrite(filesUpdateOpBulk)
  }
  const accessesNew = await AccessModel.getMyAccessesByAccessIds(USID, accessIds)
  const accessesNewMem = new Map(accessesNew.map((access) => [access._id.toString(), access.path]))
  const accessIdsReqM = new Map(accessIds.map((accessId) => [accessId, false]))
  const filesTransM = isCollectionChanged(accessesNewMem, accessOldMem, accessIdsReqM)
  const documents = Object.keys(filesTransM).map((key) => ({ id: key, success: filesTransM[key] }))
  const overall = documents.every((op) => op.success)
  const result = {
    success: overall,
    documents: documents,
  }
  return [result]
}

const updateDir = async (USID, accessIds, pathAfter) => {
  const [pathAfterNorm, ,] = normalizePath(pathAfter)
  if (accessIds && accessIds.length) {
    return await updateDir_(USID, accessIds, pathAfterNorm)
  } else {
    return [, 'Documents field is not provided']
  }
}

const renameDir = async (USID, accessIds, pathAfter) => {
  const [pathAfterNorm, pathAfterParent, pathAfterFolderName] = normalizePath(pathAfter)
  if (!(accessIds && accessIds.length == 1)) {
    return [, 'Renaming should take exactly 1 documents']
  }

  if (pathAfterNorm == '/') {
    return [, 'Modifying root directory not permitted']
  }

  const [, parentPathAfter, folderNameAfter] = normalizePath(pathAfterNorm)
  if (parentPathAfter !== '/') {
    //if parent is not root, then check parent existence
    const parentExist = await checkFolderExist(USID, parentPathAfter)
    if (!parentExist) {
      return [, 'Parent Folder does not exist']
    }
  }

  const currentAccess = await retrieveMyAccessById(accessIds[0], USID)
  const currentFile = await File.getFileById(currentAccess.fileId)

  if (!currentAccess) {
    return [, `Folder does not exist`]
  } else if (currentFile.isFolder !== true) {
    return [, `Only folder is allowed`]
  } else if (currentAccess.path === pathAfterNorm) {
    return [, `No changes are performed`]
  } else if (constants.isReservedPath(currentAccess.fullpath)) {
    throw new cError.PermissionDeniedException(`Reserved folder cannot be renamed: ${currentAccess.path}`)
  }

  const nameUniq = await filenameCollisionHandler(USID, pathAfterParent, pathAfterFolderName, '')
  if (nameUniq != pathAfterFolderName) {
    // reject if the destination alreadu exist
    return [, `"${folderNameAfter}" already exists`]
  }

  const result = await AccessModel.updatePath(USID, currentAccess.path, pathAfterNorm)
  if (result && result.nModified) {
    const result = {
      success: true,
      documents: [{ id: accessIds[0], success: true }],
    }
    return [result]
  } else {
    return [, 'Folder not found']
  }
}

const accessesFileObject = async (USID, accesses) => {
  const userSpace = await spaceSvc.findMyUserSpace({ _id: USID })
  const userId = String(userSpace.userId)
  const spaceId = String(userSpace.spaceId)
  const currentUser = await userSvc.getUserById(userId)
  const fileIds = accesses.map((access) => access.fileId._id)

  //############################### Get remote SHARING Access for owner access
  const fileIdsByOwner = accesses
    // .filter((acc1) => acc1.type === constants.MODEL.ACCESS.owner)
    .map((acc1) => acc1.fileId._id)
  const sharedAccesses = await AccessModel.getAccessShared(fileIdsByOwner)
  const USIDs = sharedAccesses.map(acc3 => acc3.USID)
  const userSpaces = await spaceSvc.fetchUserSpacesByIds_(USIDs)
  const contactsOfAcc3 = sharedAccesses.map((acc3) => {
    const us = userSpaces.find((us) => String(us._id) === String(acc3.USID))
    return {
      userId: us.userId,
      fId: String(acc3.fileId),
    }
  })

  //0. ############################### get remote FORM accesses
  const accessesWithFormRaw = await AccessModel.getAccessWithForm(fileIds, 'fId')
  const accessesWithForm = accessesWithFormRaw.map((acc2) => {
    const acc1 = accesses.find((acc1) => String(acc1.fileId._id) === String(acc2.fId))
    return {
      ...acc2,
      requestAccType: acc1.type,
      versionId: acc1.fileId.versionId,
    }
  })

  //1. ############################### Get all Forms then attach fileId as fId
  const formIds = _.flatten(
    accessesWithForm.map((acc2) =>
      acc2.permissions
        .filter((perm) => perm.type === 'FORM' && String(perm.versionId) === String(acc2.versionId))
        .map((perm) => perm.ref)
    )
  )
  const formsTemp = await Form.getFormsWithTemplateByIds(formIds)

  const forms = formsTemp
    .filter((form) => [form.initiatorId, form.recipientId].map(String).includes(String(USID)))
    .map((form) => {
      const answers = form.answers.map((ans) => {
        return {
          ...ans,
          value: JSON.parse(ans.value),
        }
      })
      return {
        ...form,
        answers,
      }
    })

  const formsOfAcc2 = forms.map((form) => {
    const acc2 = accessesWithForm.find((acc2) => String(acc2._id) === String(form.sharingId))
    return {
      ...form,
      fId: String(acc2.fId),
      requestAccType: acc2.requestAccType,
    }
  })

  //2. ############################### Get all owner of non-owner access
  const accessesFromOwner = await AccessModel.findOwnerByFileIds(fileIds)

  const ownerUSIDs = accessesFromOwner.map(acc => acc.USID)
  const formInitRecpUSIDs = _.flatten(formsTemp.map(form =>[form.initiatorId, form.recipientId])).filter(i => i)
  const relatedUSIDs = _.uniq(ownerUSIDs.concat(formInitRecpUSIDs).map(String))

  const userSpacesForm = await spaceSvc.fetchUserSpacesByIds_(relatedUSIDs)
  const relatedUserIds = userSpacesForm.map(us => us.userId)
  const relatedUserList = await User.listUserByIds(relatedUserIds)

  const ownersByFileId = accessesFromOwner.map((accOwner) => {
    const usO = userSpacesForm.find(us => String(us._id) === String(accOwner.USID))
    return {
      user: relatedUserList.find((user) => String(user._id) === String(usO.userId)),
      fId: String(accOwner.fileId),
    }
  })

  //3. ############################### Get all form recipient for owner user
  const formsOfAcc2WInitReci = formsOfAcc2.map((fOfAcc2) => {
    const isInitiator = String(fOfAcc2.initiatorId) === String(USID)
    const template = fOfAcc2.templateId ? _.pick(fOfAcc2.templateId, ['_id', 'name', 'inputs', 'languages']) : null
    const usI = userSpacesForm.find((us) => String(us._id) === String(fOfAcc2.initiatorId))
    const usR = userSpacesForm.find((us) => String(us._id) === String(fOfAcc2.recipientId))
    const initiatorUser = relatedUserList.find((user) => String(user._id) === String(usI.userId))
    const recipientUser = relatedUserList.find((user) => String(user._id) === String(usR.userId))
    const type = fOfAcc2.templateId ? constants.FORM_TYPE.FORM : constants.FORM_TYPE.VERIFICATION

    const initiator = {
      email: initiatorUser.email || '',
      name: initiatorUser.name || '',
      surname: initiatorUser.surname || '',
    }
    const recipientForm = {
      email: recipientUser.email || '',
      name: recipientUser.name || '',
      surname: recipientUser.surname || '',
      isRegistered: recipientUser.isRegistered || false
    }
    return {
      ...fOfAcc2,
      template,
      initiator,
      recipient: recipientForm,
      isInitiator,
      type,
    }
  })

  //4. ############################### Construct accesses then respond
  const accessesComplete = await Promise.all(accesses.map(async (acc1) => {
    const curVersion = acc1.fileId.versions.find((v) => String(v._id) === String(acc1.fileId.versionId))
    const isInitiator = acc1.type === constants.MODEL.ACCESS.owner
    const owner = isInitiator
      ? currentUser
      : _.get(
        ownersByFileId.find((owner) => String(owner.fId) === String(acc1.fileId._id)),
        ['user']
      )
    const uploaded = constants.isReservedPath(acc1.fullpath) ? undefined : curVersion.uploaded
    const archived = startsWith(acc1.path, constants.RESERVED_PATH.ARCHIVED)
    const uri = acc1.fileId.isFolder
      ? ''
      : getDriveDownloadableLink(curVersion.uploader, curVersion._id, acc1.name, acc1.extension)
    const actionFields = [
      '_id',
      'message',
      'status',
      'dateReceived',
      'dateFilled',
      'dateCreated',
      'template',
      'answers',
      'initiator',
      'recipient',
      'isInitiator',
      'notes',
      'type'
    ]
    const formsOfAcc2IR = formsOfAcc2WInitReci
      .filter((fOfAcc2IR) => fOfAcc2IR.fId === String(acc1.fileId._id))
      .map((fOfAcc2) => _.pick(fOfAcc2, actionFields))

    const recipientUserIds = contactsOfAcc3
      .filter((conOfAcc3) => conOfAcc3.fId === String(acc1.fileId._id))
      .map((conOfAcc3) => _.get(conOfAcc3, 'userId'))

    const users = await userSvc.getUserByIds(recipientUserIds)
    const recipients = users.map(r => ({
        id: r._id,
        email: r.email,
        lang: r.lang,
        name: r.name,
        surname: r.surname,
        isRegistered: r.isRegistered
    }))

    const objDocumentType = await checklistSvc.fetchDocumentType(spaceId, acc1.documentType)
    const categoryDescription = objDocumentType && objDocumentType.description || ''

    const result = {
      versionId: acc1.fileId.versionId,
      _id: acc1._id,
      fileId: acc1.fileId._id,
      type: acc1.type,
      active: acc1.active,
      name: acc1.name,
      extension: acc1.extension,
      category: acc1.category,
      documentType: acc1.documentType,
      documentTypeOther: acc1.documentTypeOther,
      path: acc1.path,
      fullpath: acc1.fullpath,
      createdAt: acc1.createdAt,
      originalPath: acc1.originalPath,
      permissions: acc1.permissions,
      accessId: acc1._id,
      size: curVersion.size,
      storage: curVersion.storage,
      status: curVersion.status,
      isFolder: acc1.fileId.isFolder,
      uploaded,
      archived,
      uri,
      owner,
      actions: formsOfAcc2IR,
      recipients,
      categoryDescription,
    }
    return result
  }))

  return accessesComplete
}

const getShareRecipients = async(access) => {
  const fileIdsByOwner = [access].map((acc1) => acc1.fileId._id)
  const sharedAccesses = await AccessModel.getAccessShared(fileIdsByOwner)
  const USIDs = sharedAccesses.map(acc3 => acc3.USID)
  const userSpaces = await spaceSvc.fetchUserSpacesByIds_(USIDs)
  const contactsOfAcc3 = sharedAccesses.map((acc3) => {
    const us = userSpaces.find((us) => String(us._id) === String(acc3.USID))
    return {
      userId: us.userId,
      fId: String(acc3.fileId),
    }
  })

  const recipientUserIds = contactsOfAcc3
    .filter((conOfAcc3) => conOfAcc3.fId === String(access.fileId._id))
    .map((conOfAcc3) => _.get(conOfAcc3, 'userId'))

  const users = await userSvc.getUserByIds(recipientUserIds)
  const recipients = users.map(r => ({
    id: r._id,
    email: r.email,
    lang: r.lang,
    name: r.name,
    surname: r.surname,
    isRegistered: r.isRegistered
  }))
  return recipients
}

let deleteFile = async(fileId) =>{
  await AccessModel.deleteByFileId(fileId)
  //File.deleteById(fileId)
}

const retrieveLatestUploaderVersions = async (myAccess) => {
  const file = await File.getFileById(myAccess.fileId)
  const allVersions = file.versions
  const USIDs = file.versions.map((v) => v.uploader)
  const userSpaces = await spaceSvc.fetchUserSpacesByIds_(USIDs)
  const userIds = userSpaces.map(us => us.userId)
  const users = await User.listUserByIds(userIds)
  const versionsResp = allVersions.map((v) => {
    const userSpace = userSpaces.find((us) => String(us._id) === String(v.uploader))
    const uploader = users.find((u) => String(u._id) === String(userSpace.userId))
    return {
      uploader: {
        email: uploader.email,
        name: uploader.name,
        surname: uploader.surname,
      },
    }
  })
  return versionsResp
}

const countUpload = async (type) =>{
  const data = await AccessModel.countUpload(type)
  let correctOrderedType = ["verbal_contract","photo","passport","skill_training","language_training","education","work_visa","visa_authorisation_number","employment_agreement_contract","medical_test","temporary_visa", "smart_card","air_travel","work_and_residence_permit","proof_of_payment"]
  let orderedResult = []
  for (let index = 0; index < correctOrderedType.length; index++) {
    let tempItem = data.filter((object) => {
      return object["_id"] == correctOrderedType[index]
     })[0]
     if (tempItem) {
       orderedResult.push(tempItem)
     }
  }
  return orderedResult
}

module.exports.uploadFile = uploadFile
module.exports.shareFile = shareFile
module.exports.modifyFileMeta = modifyFileMeta
module.exports.retrieveFile = retrieveFile
module.exports.retrieveMyAccessById = retrieveMyAccessById
module.exports.archiveOrRestoreAccess = archiveOrRestoreAccess
module.exports.streamZip = streamZip
module.exports.createFolder = createFolder
module.exports.deleteFolder = deleteFolder
module.exports.updateDir = updateDir
module.exports.renameDir = renameDir
module.exports.listAllAccesses = listAllAccesses
module.exports.listChecklistAccesses = listChecklistAccesses
module.exports.findChecklistAccess = findChecklistAccess
module.exports.reservedPathValidation = reservedPathValidation
module.exports.uploadNewVersion = uploadNewVersion
module.exports.retrieveAllVersions = retrieveAllVersions
module.exports.newVersionFormShare = newVersionFormShare
module.exports.getShareRecipients = getShareRecipients
module.exports.retrieveLatestUploaderVersions = retrieveLatestUploaderVersions
module.exports.deleteFile = deleteFile
module.exports.countUpload = countUpload