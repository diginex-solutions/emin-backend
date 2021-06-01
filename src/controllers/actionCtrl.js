const _ = require('lodash')
const log = require('../helper/logger.js').log
const resMapper = require('../helper/resMapper.js')
const fileSvc = require('../services/fileSvc')
const actionSvc = require('../services/actionSvc')
const accessSvc = require('../services/accessSvc')
const errors = require('../helper/errors')
const { checkboxNullToFalse, numberTypeToNumber } = require('../helper/util')
const constants = require('../constants')
const cError = require('../helper/customError')
const { SpaceService } = require('../services/spaceSvc')
const spaceSvc = SpaceService.getInstance()
const { SalesforceService } = require('../services/salesforceSvc')
const salesforceSvc = SalesforceService.getInstance()
const feedSvc = require('../services/feedSvc')
const FeedType = require('../types');
const mongoose = require('mongoose')
const { Users } = require('mandrill-api')
const FormModel = mongoose.model('Form')
const UserModel = mongoose.model('User')
const File = mongoose.model('File')
const userSvc = require('../services/userSvc')

async function createVerification(req, res, next) {
  const accessId = req.body.docId // verification
  const templateId = req.body.templateId // Form
  const USID = req.body.RESERVED_USID
  const spaceId = req.body.RESERVED_SPACEID
  const remoteUserId = req.body.userId
  const remoteUs = await spaceSvc.findMyUserSpace({ userId: remoteUserId, spaceId, valid: true })
  const remoteUSID = remoteUs._id

  const isVerify = req.body.isVerify

  if (accessId || templateId) {
    //XOR: valid request as they are mutual exclusive by nature
    const myAccess = accessId ? await fileSvc.retrieveMyAccessById(accessId, USID) : null
    const createResult = await actionSvc.createVerificationAccess(
      USID,
      myAccess,
      remoteUSID,
      req.body.message,
      req.time,
      req.userAddress,
      templateId,
      isVerify,
      req.decoded.name
    )
    // TODO: check createResult for the status.
    res.json(resMapper.objReplaceKeyName(createResult, '_id', 'id'))
  } else {
    throw new cError.InvalidRequestPayloadException('At least one of docId or templateId must be provided')
  }
}

async function completeVerification(req, res, next) {
  const { userId } = req.decoded
  const { formId } = req.params
  const keys = ['value', 'id']
  const { status, notes } = req.body
  const answers = Array.isArray(req.body.answers)
    ? req.body.answers
        .map(numberTypeToNumber)
        .map(checkboxNullToFalse)
        .map((q) => _.pick(q, keys))
    : []
  const keyValid = answers.every((i) => Object.keys(i).length === keys.length)
  if (!keyValid) {
    return errors.makeMessage(res, errors.invalidRequestPayload, `Every 'answers' item should contain [{${keys}}]`)
  }
  try {
    if (status === 'accepted') {
      const passport = answers[0].value === '34c17680-e43b-4292-994b-58593a098811' ? 'YES' : 'NO'
      const fees = answers[1].value === '6fec73ec-03b5-4ec4-8d09-42dae92c1d1e' ? 'YES' : 'NO'
      const date = new Date()
      const email = req.body.decoded.user.email
      const name = req.body.decoded.user.name
      const surname = req.body.decoded.user.surname
      await salesforceSvc.add(email, name, surname, date, passport, fees)
    }
  } catch (error) {
    console.log(error)
  }

  const completeResult = await actionSvc.completeVerification(
    userId,
    formId,
    status,
    answers,
    req.time,
    req.userAddress,
    notes
  )
  if (status === 'accepted'){
    //SS-50: add new feed for document approved/ rejected
    //formid -> sharing id -> access -> documentid (file id_) -> uploader
    const form = await FormModel.getFormById(formId)
    if (!form) throw new cError.ResourceNotFoundException(`Form with ID: ${formId} does not exist`)
    const access = await accessSvc.getAccessByFormId(formId)
    const uploaderAllVersion = await fileSvc.retrieveLatestUploaderVersions(access)
    const uploaderLatest = uploaderAllVersion[uploaderAllVersion.length - 1].uploader
    console.log(uploaderLatest)
    const uploader = await userSvc.getUserByEmail(uploaderLatest.email)
    console.log(uploader)
    let feed = {
      _id: mongoose.Types.ObjectId(),
      reviewer: {
        id: req.decoded.userId,
        name: req.decoded.name,
        photo: req.decoded.photo
      },
      user: {
        id: uploader._id,
        name: uploader.name,
        photo: uploader.photo
      },
      action: 'verified',
      documentType: access.category,
      createAt: new Date(),
      type: 2
    }
    await feedSvc.addFeed(feed)
    //update profile strength
    await userSvc.updateProfileStrength(uploader._id)
    //userSvc.updateProfileStrength(req.decoded.userId)
  }

  res.json(resMapper.objReplaceKeyName(completeResult, '_id', 'id'))
}

async function getReceivedForms(req, res, next) {
  const USID = req.body.RESERVED_USID
  const forms = await actionSvc.listReceivedForms(USID)
  return res.json(resMapper.objReplaceKeyName(forms, '_id', 'id'))
}

module.exports.createVerification = createVerification
module.exports.completeVerification = completeVerification
module.exports.getReceivedForms = getReceivedForms
