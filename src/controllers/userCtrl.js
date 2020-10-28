const { UserSpaceRole } = require('../types');
const { SpaceService } = require('../services/spaceSvc');
const spaceSvc = SpaceService.getInstance()
var userSvc = require('../services/userSvc')
var historySvc = require('../services/historySvc')
var router = require('express').Router()
var resMapper = require('../helper/resMapper.js')
var log = require('../helper/logger.js').log
const regexhelper = require('../helper/regex')
const cError = require('../helper/customError')
const mongoose = require('mongoose')
const Sharing = mongoose.model('Sharing')
const File = mongoose.model('File')
const User = mongoose.model('User')
const _ = require('lodash')
const escapeStringRegexp = require('escape-string-regexp')
const errors = require('../helper/errors')
const bcrypt = require('bcryptjs')
const util = require('../helper/util')
const OtpModel = mongoose.model('Otp')

async function getUserInfo(req, res, next) {
  const user = await userSvc.getUserById(req.body.authed.userId)
  const us = await spaceSvc.findMyUserSpace({_id: req.body.authed.RESERVED_USID, valid: true})
  const userResp = _.assign({}, user.toObject(), {role: us.role, positionType: us.positionType })
  resMapper.removeAllWithKeyName(userResp, ['brand', 'profileType']) // hide field (if it's completely removedm in the DB, then we can remove this line as well)
  res.json(resMapper.users(userResp))
}

async function getUsers(req, res, next) {
  const spaceId = req.body.authed.RESERVED_SPACEID
  const userRole = req.body.authed.RESERVED_USROLE
  const space = await spaceSvc.findSpaceById(spaceId)
  if (!space.isUserDirectory && userRole !== UserSpaceRole.ADMIN){
    throw new cError.InvalidRequestPayloadException('The space does not have user directory')
  }
  const users = await userSvc.getUsers(req.body.authed.RESERVED_USID)
  resMapper.removeAllWithKeyName(users, ['brand', 'profileType'])
  res.json(resMapper.users(users))
}

async function updateUserType(req, res, next) {
  const userType = req.body.userType
  const userId = req.body.userId
  if (!userId) {
    return errors.makeMessage(res, errors.invalidRequestPayload, 'User Id is not valid')
  }
  const [valid, errMsg] = userSvc.validateUserType(userType)
  if (valid) {
    const user = (await userSvc.setUserUserType(req.body.authed.userId, userId, userType)).toObject()
    res.json(resMapper.users(user))
  } else {
    return errors.makeMessage(res, errors.invalidRequestPayload, errMsg)
  }
}

async function getUserOverview(req, res, next) {
  // superset of /history
  const used = await userSvc.getSpaceUsage(req.body.authed.userId)
  // make the total simple, as its not even specified in the spec.
  const space = { used, total: 5 * 1024 * 1024 * 1024 }
  const historyRaw = await historySvc.getHistoryByUser(req.body.authed)
  const history = resMapper.histories(historyRaw, req.body.authed)
  const overview = {
    space,
    history,
  }
  res.json(overview)
}

async function updateUser(req, res, next) {
  const [valid, errMsg] = userSvc.isUserFieldsModifiable(req.body)
  const user = await userSvc.getUserWithPwd(req.body.authed.userId)
  if (valid) {
    if (req.body.password) {
      const errMsg = regexhelper.passwordValidationError(req.body.password)
      if (errMsg) {
        return errors.makeMessage(res, errors.invalidRequestPayload, errMsg)
      }
      const currentPassword = req.body.currentPassword
      if (user.isRegistered !== false) {
        const match = currentPassword ? await bcrypt.compare(currentPassword, user.password) : false
        if (!match) {
          return errors.makeMessage(res, errors.internalServerError, 'Wrong current password')
        }
      } else {
        if (user && !user.createdAt) {
          await userSvc.setUserById(user.id, { createdAt: new Date() })
        }
        await userSvc.registerAndJoinDefaultSpace(user)
        await OtpModel.removeByUserId(user._id)
      }
      req.body.password = util.hashSalt(req.body.password)
    }
    const userResp = (await userSvc.setUserById(req.body.authed.userId, req.body)).toObject()
    res.json(resMapper.users(userResp))
  } else {
    errors.makeMessage(res, errors.invalidRequestPayload, errMsg)
  }
}

async function findContact(req, res, next) {
  const user = await User.findById(req.body.authed.userId).exec()
  if (!user) {
    return res.json(403, { status: 'unauthorized' })
  }

  const files = await File.find({ user: user.id }).select('_id').exec()
  const fileIds = files.map((x) => x.id)
  const sharings = await Sharing.find({
    fileId: { $in: fileIds },
    $or: [
      { email: new RegExp(escapeStringRegexp(req.query.q || ''), 'i') },
      { company: new RegExp(escapeStringRegexp(req.query.q || ''), 'i') },
      { name: new RegExp(escapeStringRegexp(req.query.q || ''), 'i') },
      { surname: new RegExp(escapeStringRegexp(req.query.q || ''), 'i') },
    ],
  })
    .sort('-_id')
    .limit(100)
    .exec()

  res.json(
    _.uniqBy(sharings, (x) => x.email).map((x) => ({
      email: x.email,
      company: x.company,
      surname: x.surname,
      name: x.name,
    }))
  )
}

async function isRegistered(req, res, next) {
  const email = String(req.query.email).toLowerCase().trim()
  const user = await userSvc.getUserByEmail(email)
  const isRegistered = user && user.email === email && user.isRegistered !== false ? true : false
  res.json({ isRegistered })
}

async function inviteUser(req, res, next) {
  const { email: emailU, name, surname } = req.body
  const USID = req.body.authed.RESERVED_USID
  // removed this line, because the invited user should have the same company as the inviter.
  // Extra logic is going to be added in inviteUser below.
  const { lang, userType, role } = req.body

  const [, userTypeErr] = userSvc.validateUserType(userType)
  if (userTypeErr) throw new cError.InvalidRequestPayloadException('Invalid user type')

  const email = String(emailU).toLowerCase().trim()
  const invitedUser = await userSvc.inviteUser(USID, email, name, surname, lang, userType, role)

  const invitedUserRole = await userSvc.findInvitedUserRole(USID, invitedUser)
  if (invitedUserRole) {
    const invitedUserWithRole = _.assign({}, invitedUser, { role: invitedUserRole })
    return res.json(resMapper.users(invitedUserWithRole))
  }
  res.json(resMapper.users(invitedUser))
}

async function reinviteUser(req, res, next) {
  const myUserId = req.body.authed.userId
  const remoteUserId = req.params.userId
  const invitedUser = await userSvc.reinviteUser(myUserId, remoteUserId)
  res.json(resMapper.users(invitedUser))
}

async function leaveSpace(req, res, next) {
  const { userId } = req.body.authed;
  const spaceId = req.params.spaceId;
  const usLeft = await spaceSvc.leaveSpace(userId, spaceId)
  res.json(usLeft)
}

async function kickUserFromSpace(req, res, next) {
  const { userId } = req.params
  const spaceId = req.body.authed.RESERVED_SPACEID;
  const usLeft = await spaceSvc.leaveSpace(userId, spaceId)
  res.json(usLeft)
}

async function changeUserSpaceRole(req, res, next) {
  const { userId } = req.params
  const { role } = req.body
  const spaceId = req.body.authed.RESERVED_SPACEID;
  if (Object.values(UserSpaceRole).includes(role)){
    const us = await spaceSvc.updateRole(userId, spaceId, role)
    res.json(us)
  } else {
    throw new cError.InvalidRequestPayloadException(`Role: ${role} is not in allowed value ${Object.values(UserSpaceRole)}`)
  }
}

module.exports = {
  getUserInfo,
  getUserOverview,
  updateUser,
  findContact,
  isRegistered,
  getUsers,
  updateUserType,
  inviteUser,
  reinviteUser,
  leaveSpace,
  kickUserFromSpace,
  changeUserSpaceRole
}
