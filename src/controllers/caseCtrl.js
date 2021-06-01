module.exports = {}
const caseSvc = require('../services/caseSvc')
const resMapper = require('../helper/resMapper.js')
const cError = require('../helper/customError')
const { SpaceService } = require('../services/spaceSvc');
const spaceSvc = SpaceService.getInstance()

async function getMyCases(req, res, next) {
  const cases = await caseSvc.listMyCases(req.body.RESERVED_USID)
  res.json(resMapper.cases(cases))
}

async function createCase(req, res, next) {
  const caseObj = await caseSvc.createCase(req.body.RESERVED_USID, req.body, req.time)
  res.json(resMapper.cases(caseObj))
}

const commentValidate = (comment) => {
  if (!(typeof comment === 'string' && comment.length >= 2 && comment.length <= 1000)) {
    throw new cError.InvalidRequestPayloadException(`Comment must have number of characters between 2 to 1000.`)
  } else {
    return comment
  }
}

async function comment(req, res, next) {
  const comment = commentValidate(req.body.comment)
  const caseObj = await caseSvc.comment(req.body.RESERVED_USID, req.params.caseId, comment, req.time)
  res.json(resMapper.cases(caseObj))
}

async function deleteComment(req, res, next) {
  const commentId = req.params.commentId
  const result = await caseSvc.deleteComment(req.body.RESERVED_USID, commentId, req.time)
  res.json(result)
}

async function updateComment(req, res, next) {
  const commentId = req.params.commentId
  const comment = commentValidate(req.body.comment)
  const result = await caseSvc.updateComment(req.body.RESERVED_USID, commentId, comment, req.time)
  res.json(result)
}

async function addUser(req, res, next) {
  const remoteUserId = req.body.userId
  const spaceId = req.body.RESERVED_SPACEID
  const remoteUs = await spaceSvc.findMyUserSpace({userId: remoteUserId, spaceId, valid: true})
  const remoteUSID = remoteUs._id
  const caseObj = await caseSvc.addUser(req.body.RESERVED_USID, req.params.caseId, remoteUSID, req.time)
  res.json(resMapper.users(caseObj))
}

async function updateCase(req, res, next) {
  caseSvc.validateUpdateOrCloseCase(req.body)
  const caseObj = await caseSvc.updateCase(req.body.RESERVED_USID, req.params.caseId, req.body, req.time)
  res.json(resMapper.cases(caseObj))
}

async function uploadCaseFile(req, res, next) {
  const caseId = req.params.caseId
  const USID = req.decoded.RESERVED_USID
  const filename = req.file.originalname

  const size = req.file.blobSize
  const storage = req.file.url.split('?')[0]

  const eventUploaded = await caseSvc.uploadFile(
    caseId,
    USID,
    req.trustVersionFileId,
    req.file.originalname,
    req.file.blobSize,
    storage,
    req.file.shaHash,
    req.time,
    req.userAddress
  )

  res.json(eventUploaded)
}

module.exports.uploadCaseFile = uploadCaseFile
module.exports.updateCase = updateCase
module.exports.getMyCases = getMyCases
module.exports.createCase = createCase
module.exports.comment = comment
module.exports.deleteComment = deleteComment
module.exports.updateComment = updateComment
module.exports.addUser = addUser
