module.exports = {}
const _ = require('lodash')
const mongoose = require('mongoose')
const { SpaceService } = require('./spaceSvc');
const spaceSvc = SpaceService.getInstance()
const UserCaseModel = mongoose.model('UserCase')
const CaseModel = mongoose.model('Case')
const EventModel = mongoose.model('Event')
const UserModel = mongoose.model('User')
const FormModel = mongoose.model('Form')
const FileModel = mongoose.model('File')
const cError = require('../helper/customError')
const { EVENT_TYPE, FILE_CATEGORY } = require('../constants')
const { extractFilename, getDriveDownloadableLink } = require('../helper/util')
const userSvc = require('../services/userSvc')

const fetchFirstCaseObj = (caseList) => {
  if (!caseList || caseList.length == 0) {
    throw new cError.InternalServerError(`Cannot fetch case with id: ${caseId}, please retry`)
  }
  return caseList[0]
}

const userCaseToCase = async (myUserCases) => {
  const caseIds = myUserCases.map((c) => c.caseId)
  const cases = await CaseModel.getCasesById(caseIds)

  const allUserCases = await UserCaseModel.listCasesByIds(caseIds)

  const allUSIDs = _.uniq(allUserCases.map((uc) => String(uc.USID)))
  const userSpaces = await spaceSvc.fetchUserSpacesByIds_(allUSIDs)
  const allUserIds = _.uniq(userSpaces.map((us) => String(us.userId)))
  const allUsers = await UserModel.listUserByIds(allUserIds)
  const allUCsWithUser = allUserCases.map((uc) => {
    const userSpace = userSpaces.find(us => String(us._id) === String(uc.USID))
    const userObj = allUsers.find((u) => String(u._id) === String(userSpace.userId))
    const user = _.pick(userObj, ['_id', 'email', 'name', 'surname'])
    return {
      ...uc,
      user,
    }
  })

  const allEvents = await EventModel.listEventByCases(caseIds)
  const allFileIds = _.uniq(allEvents.filter((e) => e.fileId).map((e) => String(e.fileId)))
  const allFiles = await FileModel.getFilesByIds(allFileIds)

  return cases.map((c) => {
    const owner = allUCsWithUser.find((ucu) => String(ucu.caseId) === String(c._id) && ucu.permission === 'owner')
    // const employee = allUCsWithUser.find(ucu => String(ucu.caseId) === String(c._id) && ucu.permission === 'employee')

    const eventsOfC = allEvents.filter((e) => String(e.caseId) === String(c._id))
    const events = eventsOfC.map((e) => {
      const initiatorUCU = allUCsWithUser.find((ucu) => String(ucu.USID) === String(e.USID))
      const recipientUCU = allUCsWithUser.find((ucu) => String(ucu.USID) === String(e.recipientId))
      const initiator = initiatorUCU.user
      const recipient = recipientUCU ? recipientUCU.user : undefined

      const file = e.fileId ? allFiles.find((f) => String(f._id) === String(e.fileId)) : null
      return eventFormat(e, initiator, recipient, file)
    })

    const users = allUCsWithUser
      .filter(
        (ucu) => String(ucu.caseId) === String(c._id) && ucu.permission != 'owner' && ucu.permission != 'employee'
      )
      .map((ucu) => ucu.user)
    return {
      ...c,
      owner: _.pick(owner.user, ['email', 'name', 'surname']),
      // employee: _.pick(employee.user, ['email', 'name', 'surname']),
      users,
      events: events,
    }
  })
}

async function listMyCases(USID) {
  const myUserCases = await UserCaseModel.listMyCases(USID)
  return await userCaseToCase(myUserCases)
}

async function createCase(USID, caseBody, ts) {
  const employee = caseBody.employee

  const formId = caseBody.formId
  if (formId) {
    const form = await FormModel.getFormById(formId)
    if (!form) throw new cError.ResourceNotFoundException(`Form not found with ID:${formId}`)
  }

  const caseId = mongoose.Types.ObjectId()
  const caseObj = {
    _id: caseId,
    name: caseBody.name,
    employee,
    createdAt: ts,
    updatedAt: ts,
    description: caseBody.description,
    resolutionPlan: caseBody.resolutionPlan,
    status: 'open',
    formId: caseBody.formId,
    caseType: caseBody.caseType,
    events: [],
  }
  const newCase = await CaseModel.createCase(caseObj)
  const userCaseObj = {
    _id: mongoose.Types.ObjectId(),
    USID,
    caseId,
    permission: 'owner',
  }

  const userCases = [userCaseObj]
  const userCase = await UserCaseModel.createUserCase(userCases)
  const eventObj = {
    _id: mongoose.Types.ObjectId(),
    createdAt: ts,
    updatedAt: ts,
    caseId,
    USID,
    action: EVENT_TYPE.STATUS_OPENED,
    data: null,
  }
  const event = await EventModel.createEvent(eventObj)

  const myUserCases = userCase.filter((uc) => uc.permission === 'owner')
  const caseObjs = await userCaseToCase(myUserCases)
  return fetchFirstCaseObj(caseObjs)
}

async function comment(USID, caseId, comment, ts) {
  const [myUserCase, caseDb] = await getMyOpenCase(USID, caseId)
  const event = {
    _id: mongoose.Types.ObjectId(),
    createdAt: ts,
    updatedAt: ts,
    caseId,
    USID,
    recipientId: null,
    action: EVENT_TYPE.COMMENT,
    status: 0,
    data: comment,
  }

  const eventCreated = await EventModel.createEvent(event)
  return await eventToResponse(eventCreated)
}

const getMyCase = async (USID, caseId) => {
  const myUserCase = await UserCaseModel.getUserCaseByCaseId(USID, caseId)
  if (!myUserCase) throw new cError.ResourceNotFoundException(`It seems you don't have the access to case ${caseId}`)
  const caseDb = await CaseModel.getCaseById(caseId)
  return [myUserCase, caseDb]
}

const getMyOpenCase = async (USID, caseId) => {
  const [myUserCase, caseDb] = await getMyCase(USID, caseId)
  if (caseDb.isOpen !== true) throw new cError.InvalidStateTransitException(`The case is already closed`)
  return [myUserCase, caseDb]
}

const eventToResponse = async (event) => {
  const userIdInit = await spaceSvc.findUserIdByUserSpace({_id: event.USID})
  const initiator = await UserModel.getUserById(userIdInit)
  const recipient = event.recipientId ? await UserModel.getUserById(event.recipientId) : undefined

  const allFiles = event.fileId ? await FileModel.getFilesByIds(event.fileId) : [null]

  return eventFormat(event, initiator, recipient, allFiles[0])
}

const eventFormat = (event, initiatorUser, recipientUser, file) => {
  const userFields = ['email', 'name', 'surname']
  const initiator = _.pick(initiatorUser, userFields)
  const recipient = recipientUser ? _.pick(recipientUser, userFields) : undefined

  let fileObj
  if (event.fileId) {
    const [name, extension] = extractFilename(event.filename)
    const casePrefix = `case/${event.caseId}`
    const latestVer = file.versions.find(v => String(v._id) === String(file.versionId))
    const uri = getDriveDownloadableLink(casePrefix, latestVer._id, name, extension)
    fileObj = {
      id: event.fileId,
      name,
      extension,
      size: file.size,
      uri,
    }
  }
  return {
    id: event._id,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    action: event.action,
    data: event.data,
    initiator,
    recipient,
    file: fileObj,
  }
}

async function deleteComment(USID, commentId, ts) {
  const commentObj = await EventModel.getEventById(commentId)
  if (!commentObj) throw new cError.ResourceNotFoundException(`Comment not found with Id: ${commentId}`)

  const caseId = commentObj.caseId
  const [myUserCase, caseDb] = await getMyOpenCase(USID, caseId)

  const commentResult = await EventModel.deleteEvent(USID, commentId, ts)
  if (!commentResult) throw new cError.ResourceNotFoundException(`Comment with ID:${commentId} is not removable`)
  return await eventToResponse(commentResult)
}

async function updateComment(USID, commentId, comment, ts) {
  const commentObj = await EventModel.getEventById(commentId)
  if (!commentObj) throw new cError.ResourceNotFoundException(`Comment not found with Id: ${commentId}`)

  const caseId = commentObj.caseId
  const [myUserCase, caseDb] = await getMyOpenCase(USID, caseId)

  const commentResult = await EventModel.updateEvent(USID, commentId, comment, ts)
  if (!commentResult) throw new cError.ResourceNotFoundException(`Comment with ID:${commentId} is not modifiable`)
  return await eventToResponse(commentResult)
}

async function addUser(USID, caseId, remoteUSID, ts) {
  const us = await spaceSvc.findMyUserSpace({_id: USID, valid: true})
  const usRemote = await spaceSvc.findMyUserSpace({_id: remoteUSID, valid: true})
  if (String(us.spaceId) !== String(usRemote.spaceId)) {
    throw new cError.ResourceNotFoundException(`User '${remoteUSID}' not found in this space`)
  }

  const userIdRemote = String(usRemote.userId)
  const remoteUser = await userSvc.getUserById(userIdRemote)

  const remoteUserCase = await UserCaseModel.getUserCaseByCaseId(remoteUSID, caseId)
  if (remoteUserCase)
    throw new cError.ResourceNotFoundException(`'${remoteUser.email}' is already in the Case`)

  const userCaseManager = {
    _id: mongoose.Types.ObjectId(),
    USID: remoteUSID,
    caseId,
    permission: 'manager',
  }
  const userCase = await UserCaseModel.createUserCase(userCaseManager)

  const event = {
    _id: mongoose.Types.ObjectId(),
    createdAt: ts,
    updatedAt: ts,
    caseId,
    USID,
    recipientId: remoteUSID,
    action: EVENT_TYPE.USER_JOIN,
    data: null,
  }
  const eventCreated = await EventModel.createEvent(event)
  return remoteUser
}

function validateUpdateOrCloseCase(caseBody) {
  const caseUpdate = _.pick(caseBody, ['name', 'employee', 'description', 'resolutionPlan', 'formId', 'caseType'])
  const caseStatus = _.pick(caseBody, ['isOpen'])
  if (Object.keys(caseStatus).length && Object.keys(caseUpdate).length) {
    throw new cError.InvalidRequestPayloadException(`Either closing or updating case properties is allowed`)
  } else {
    return
  }
}

async function updateCase(USID, caseId, caseBody, ts) {
  const [myUserCase, caseDb] = await getMyCase(USID, caseId)
  const caseUpdate = _.pick(caseBody, ['name', 'employee', 'description', 'resolutionPlan', 'formId', 'caseType'])
  const caseStatusToBe = caseBody.isOpen
  if (caseStatusToBe === false || caseStatusToBe === true) {
    // close/reopen case
    if (caseDb.isOpen == caseStatusToBe)
      throw new cError.InvalidStateTransitException(
        `No transition is performed from '${caseDb.isOpen}' to '${caseStatusToBe}'`
      )
    const caseClosed = await CaseModel.updateCaseStatus(caseId, caseStatusToBe, ts)
    const eventStatus = caseStatusToBe ? EVENT_TYPE.STATUS_OPENED : EVENT_TYPE.STATUS_CLOSED
    const event = {
      _id: mongoose.Types.ObjectId(),
      createdAt: ts,
      updatedAt: ts,
      caseId,
      USID,
      action: eventStatus,
      data: null,
    }
    const eventCreated = await EventModel.createEvent(event)
  } else if (Object.keys(caseUpdate).length) {
    // update case
    const formId = caseUpdate.formId
    if (formId) {
      const form = await FormModel.getFormById(formId)
      if (!form) throw new cError.ResourceNotFoundException(`Form not found with ID:${formId}`)
    }
    const caseClosed = await CaseModel.updateCase(caseId, { ...caseUpdate, updatedAt: ts })
  } else {
    throw new cError.InvalidRequestPayloadException(`Either closing or updating case properties is allowed`)
  }
  const caseObjs = await userCaseToCase([myUserCase])
  return fetchFirstCaseObj(caseObjs)
}

async function uploadFile(caseId, USID, versionFileId, filename, size, storage, shaHash, ts, ipAddress) {
  const eventTime = ts
  const fileId = mongoose.Types.ObjectId()
  const file = {
    _id: fileId,
    archived: false, // TODO: no archive flag
    isFolder: false,
    category: FILE_CATEGORY.CASE,
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
  const fileRes = (await FileModel.addFile(file)).toObject()
  console.log('fileRes', fileRes)
  if (fileRes) {
    const event = {
      _id: mongoose.Types.ObjectId(),
      createdAt: eventTime,
      updatedAt: eventTime,
      caseId,
      USID,
      recipientId: null,
      action: EVENT_TYPE.FILE_UPLOAD,
      status: 0,
      data: null,
      fileId,
      filename,
    }
    const eventUploaded = await EventModel.createEvent(event)
    return eventToResponse(eventUploaded)
  } else {
    throw new cError.InternalServerError(`File filed to be processed: ${fileRes}`)
  }
}

module.exports.validateUpdateOrCloseCase = validateUpdateOrCloseCase
module.exports.listMyCases = listMyCases
module.exports.createCase = createCase
module.exports.comment = comment
module.exports.deleteComment = deleteComment
module.exports.updateComment = updateComment
module.exports.addUser = addUser
module.exports.updateCase = updateCase
module.exports.getMyCase = getMyCase
module.exports.uploadFile = uploadFile
