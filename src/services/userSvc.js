
module.exports = {}
const { SpaceService } = require('./spaceSvc');
const spaceSvc = SpaceService.getInstance()
const { UserSpaceRole, UserSpacePosition } = require('../types');
const _ = require('lodash')
var log = require('../helper/logger.js').log
const crypto = require('crypto')
const cError = require('../helper/customError')
var mongoose = require('mongoose')
const User = mongoose.model('User')
const File = mongoose.model('File')
const Access = mongoose.model('Access')
const OtpModel = mongoose.model('Otp')
let regex = require('../helper/regex')
const util = require('../helper/util')
const azureStorageSvc = require('./azureStorageSvc')
const fileSvc = require('./fileSvc')
const emailSvc = require('../services/emailSvc')
const config = require('../config')
const constants = require('../constants')
const { NotificationType } = require('../types')

let isUserFieldsModifiable = (req) => {
  let allowedFields = [
    'name',
    'surname',
    'email',
    'dateOfBirth',
    'gender',
    'countryCode',
    'phoneNumber',
    'workTitle',
    'location',
    'workDepartment',
    'lang',
    'password',
    'currentPassword'
  ]
  const user = _.pick(req, allowedFields)
  let keys = Object.keys(user)
  let valid = true
  let errMsg
  let fieldsF = !(
    keys.length <= allowedFields.length &&
    keys.reduce((acc, cur) => acc && allowedFields.indexOf(cur) != -1, true)
  )
  let formatNotValid = false
  let lengthF = false
  let valueF = false

  // if (string) is problematic: if the string is empty (""), it is evaluated as "false", and the checks are not applied.
  // this is ok for optional fields, but is an issue for mandatory ones, like name, surname, email.

  if (user.name) {
    // in French, names like "Ménil-Montant" or "Dupond Dupont" are current. some special characters should be allowed.
    formatNotValid = formatNotValid || !regex.isNameValid(user.name)
    lengthF = lengthF || !(user.name.length > 2 && user.name.length < 31)
  }

  if (user.surname) {
    // in French, names like "Jean-Paul" are current. some special characters should be allowed.
    formatNotValid = formatNotValid || !regex.isNameValid(user.surname)
    lengthF = lengthF || !(user.surname.length > 2 && user.surname.length < 31)
  }

  if (user.email) {
    lengthF = lengthF || !(user.email.length > 2 && user.email.length < 31)
  }
  if (user.dateOfBirth) {
    lengthF = lengthF || !(user.dateOfBirth.length > 5 && user.dateOfBirth.length < 11)
  }
  if (user.gender) {
    valueF = valueF || !['male', 'female', 'other'].includes(user.gender)
  }
  if (user.countryCode) {
    lengthF = lengthF || !(user.countryCode.length > 0 && user.countryCode.length < 5)
  }
  if (user.phoneNumber) {
    lengthF = lengthF || !(user.phoneNumber.length > 4 && user.phoneNumber.length < 11)
  }
  if (user.workTitle) {
    lengthF = lengthF || !(user.workTitle.length < 51)
  }
  if (user.location) {
    lengthF = lengthF || !(user.location.length > 3 && user.location.length < 55)
  }
  if (user.workDepartment) {
    lengthF = lengthF || !(user.workDepartment.length < 51)
  }
  if (user.lang) {
    formatNotValid = formatNotValid || !regex.isAlphabetOnly(user.name)
    lengthF = lengthF || !(user.lang.length == 2)
  }

  if (fieldsF || formatNotValid || lengthF || valueF) {
    valid = false
    errMsg = 'Error updating account details'
  }
  return [valid, errMsg]
}

let validateUserType = (value) => {
  let valid = Object.values(constants.USER_TYPE).includes(value)
  let errMsg = valid ? null : 'User type is not valid'
  return [valid, errMsg]
}

const setUserById = async (userId, user, upsert = false) => {
  await User.setUserById(userId, user, upsert)
  return await User.getUserById(userId)
}

const setUserUserType = async (adminId, userId, userType) => {
  const admin = await User.getUserById(adminId)
  if (admin.userType !== constants.USER_TYPE.diginexAdmin) {
    throw new cError.PermissionDeniedException('Permission denied')
  }
  const user = await User.getUserById(userId)
  if (!user) {
    throw new cError.ResourceNotFoundException('User not found')
  }
  return await User.setUserById(userId, { userType })
}

const getUser = async (userId) => {
  const userRes = await User.getUserById_(userId)
  if (!userRes) {
    throw new cError.ResourceNotFoundException('User not found')
  }
  return userRes
}

const getUserById = async (userId) => {
  const userRes = await User.getUserById(userId)
  if (!userRes) {
    throw new cError.ResourceNotFoundException('User not found')
  }
  return userRes
}

const getUserByIds = async (userIds) => {
  return await User.listUserByIds(userIds)
}

const getUsers = async (USID) => {
  const us = await spaceSvc.findMyUserSpace({_id: USID, valid: true})
  const space = await spaceSvc.findSpace({_id: us.spaceId})
  if (space.isUserDirectory || us.role === UserSpaceRole.ADMIN) {
    const usArray = await spaceSvc.findUserSpaces({spaceId: us.spaceId, valid: true})
    const userIds = usArray.map(us => us.userId)
    const users = await User.listUserByIds(userIds)
    const usersResp = users.map(u => {
      const us = usArray.find(us => String(us.userId) === String(u._id))
      return _.assign({}, u, {role: us.role})
    })
    return usersResp
  } else {
    throw new cError.PermissionDeniedException('No user directory can be found in the space')
  }
}

const getUserWithPwByEmail = (email) => {
  return User.getUserWithPwByEmail(email)
}

const getUserByEmail = (email) => {
  return User.getUserByEmail(email)
}

const getUserWithPwd = (userId) => {
  return User.getUserWithPwd(userId)
}

const getSpaceUsage = async (userId) => {
  try{
    const uss = await spaceSvc.findUserSpaces({userId})
    const USIDs = uss.map(us => String(us._id))
    const accesses = await Access.getOwnerAccessWithFile(USIDs)
    const verReducer = (accu, cur) => accu + (cur.size || 0)
    const accReducer = (accu, cur) => accu + cur.fileId.versions.reduce(verReducer, 0)
    const used = accesses.reduce(accReducer, 0)
    return used
  } catch (err) {
    return 0
  }
}

async function changeUserPassword(userId, password) {
  const hashed = util.hashSalt(password)
  return User.changePassword(userId, hashed)
}

async function registerAndJoinDefaultSpace(user, _options) {
  const options = Object.assign(
    {
      role: UserSpaceRole.EMPLOYEE,
      position: UserSpacePosition.OTHERS
    },
    _options
  );

  let joinSpaceId
  if (!options.spaceId) {
    const defaultSpace = await spaceSvc.findSpace({isPrivate: true})
    joinSpaceId = String(defaultSpace._id)
  } else {
    joinSpaceId = options.spaceId
  }
  await spaceSvc.joinSpace(user._id, joinSpaceId, options.role, options.position)
  await setUserById(user._id, { isRegistered: true })
}

async function userRegistrationInit(user, options) {
  const _user = {
    ...user,
    createdAt: new Date(),
    expiresAt: new Date(+new Date() + 1000 * 3600 * 24 * 90),
  }
  const userResult = await setUserById(_user._id, _user, true)
  await registerAndJoinDefaultSpace(userResult, options)
  return userResult
}

async function reinviteUser(userId, invitedUserId) {
  const frontendDomain = config.emailFrontendDomain
  const inviter = await getUserById(userId)
  const invitedUser = await getUserById(invitedUserId)
  if (!invitedUser) {
    throw new cError.ResourceNotFoundException(`User with ${invitedUserId} does not exists`)
  } else if (invitedUser.isRegistered === false) {
    const otp = await OtpModel.getByUserId(invitedUser._id)
    const token = _.get(otp, 'token')
    const referralLink = token ? `${frontendDomain}/signin?token=${token}` : undefined
    emailSvc.sendRegistractionEmail(invitedUser.email, `${inviter.name} ${inviter.surname}`,
      `${invitedUser.name || ''} ${invitedUser.surname || ''}`.trim(), referralLink)
    return {
      referralLink,
      ...invitedUser.toObject()
    }
  } else {
    throw new cError.InvalidStateTransitException(`${invitedUser.email} is already registered`)
  }
}

async function inviteUser(USID, email, name, surname, lang, userType, role = UserSpaceRole.EMPLOYEE) {
  const { NotificationHelper } = require('../helper/notificationHelper')
  const frontendDomain = config.emailFrontendDomain
  const us = await spaceSvc.findMyUserSpace({_id: USID, valid: true})
  const userId = us.userId
  const inviter = await getUserById(userId)
  const invitedUser = await getUserByEmail(email)
  if (!invitedUser) {
    const dummyUser = {
      _id: mongoose.Types.ObjectId(),
      email,
      name,
      surname,
      lang,
      userType,
      isRegistered: false,
    }
    const targetUser = await initDummyUser(dummyUser)
    const defaultSpace = await spaceSvc.findSpace({isPrivate: true})
    if (defaultSpace._id !== us.spaceId.spaceId) {
      const usRemoteDefault = await spaceSvc.joinSpace(targetUser._id, defaultSpace._id, UserSpaceRole.EMPLOYEE)
    }
    const usRemote = await spaceSvc.joinSpace(targetUser._id, us.spaceId, role)
    const token = crypto.randomBytes(32).toString('hex')
    const otp = await OtpModel.set(token, targetUser._id)
    const referralLink = `${frontendDomain}/signin?token=${token}&spaceId=${us.spaceId}`
    emailSvc.sendRegistractionEmail(email, `${inviter.name} ${inviter.surname}`, `${name || ''} ${surname || ''}`.trim(), referralLink)
    const createNotificationDto = {
      recipientId: usRemote._id,
      initiatorId: USID,
      type: NotificationType.SPACE_INVITED
    }
    await NotificationHelper.notifyUser(createNotificationDto)
    return {
      referralLink,
      ...targetUser.toObject()
    }
  } else {
    let usRemoteCurrent
    try {
      usRemoteCurrent = await spaceSvc.findMyUserSpace({spaceId: us.spaceId, userId: invitedUser._id, valid: true})
    } catch (err) {
      usRemoteCurrent = null
    }

    if (usRemoteCurrent) {
      throw new cError.InvalidStateTransitException(`User:${email} is already listed in this space`)
    } else {
      const link = `${config.emailFrontendDomain}/spaces?spaceId=${us.spaceId}`
      const space = await spaceSvc.findSpaceById(String(us.spaceId))
      const spaceName = space.name
      const usRemote = await spaceSvc.joinSpace(invitedUser._id, us.spaceId, role)
      emailSvc.sendSpaceInvitedEmail(email, `${inviter.name} ${inviter.surname}`, `${invitedUser.name || ''} ${invitedUser.surname || ''}`, spaceName, link)
      const createNotificationDto = {
        recipientId: usRemote._id,
        initiatorId: USID,
        type: NotificationType.SPACE_INVITED
      }
      await NotificationHelper.notifyUser(createNotificationDto)
      const otp = await OtpModel.getByUserId(invitedUser._id)
      const token = _.get(otp, 'token')
      const referralLink = token ? `${frontendDomain}/signin?token=${token}` : undefined
      return {
        referralLink,
        ...invitedUser.toObject()
      }
    }
  }
}

async function initDummyUser(user) {
  return await setUserById(user._id, user, true)
}

async function findInvitedUserRole(USID, invitedUser) {
  const us = await spaceSvc.findMyUserSpace({_id: USID, valid: true})
  const space = await spaceSvc.findSpace({_id: us.spaceId})
  if (space.isUserDirectory || us.role === UserSpaceRole.ADMIN) {
    const usArray = await spaceSvc.findUserSpaces({spaceId: us.spaceId, valid: true})
    const foundUser = usArray.find(us => String(us.userId) === String(invitedUser._id))
    return foundUser ? foundUser.role : null
  }
  return null
}

;(module.exports.isUserFieldsModifiable = isUserFieldsModifiable),
  (module.exports.setUserById = setUserById),
  (module.exports.getUserById = getUserById),
  (module.exports.getUserByEmail = getUserByEmail),
  (module.exports.getUserWithPwByEmail = getUserWithPwByEmail),
  (module.exports.getSpaceUsage = getSpaceUsage),
  (module.exports.changeUserPassword = changeUserPassword),
  (module.exports.userRegistrationInit = userRegistrationInit)
module.exports.initDummyUser = initDummyUser
;(module.exports.getUsers = getUsers)
module.exports.validateUserType = validateUserType
module.exports.setUserUserType = setUserUserType
module.exports.getUserWithPwd = getUserWithPwd
module.exports.inviteUser = inviteUser
module.exports.reinviteUser = reinviteUser
module.exports.registerAndJoinDefaultSpace = registerAndJoinDefaultSpace
module.exports.getUserByIds = getUserByIds
module.exports.findInvitedUserRole = findInvitedUserRole
module.exports.getUser = getUser