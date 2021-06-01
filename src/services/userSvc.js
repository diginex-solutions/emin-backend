
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
const {ConnService} = require('../services/connSvc')
const Feed = mongoose.model('Feed')
const {ChecklistService} = require('../services/checklistSvc')
const feedSvc = require('../services/feedSvc')
const Setting = mongoose.model('Setting')
const migrationChecklistSvc = require('../services/migrationChecklistSvc')
const Document = mongoose.model('Document')


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
    'about',
    'skills',
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
    //formatNotValid = formatNotValid || !regex.isNameValid(user.name)
    lengthF = lengthF || !(user.name.length > 1 && user.name.length < 31)
  }

  if (user.surname) {
    // in French, names like "Jean-Paul" are current. some special characters should be allowed.
    //formatNotValid = formatNotValid || !regex.isNameValid(user.surname)
    lengthF = lengthF || !(user.surname.length > 1 && user.surname.length < 31)
  }

  if (user.email) {
    lengthF = lengthF || !(user.email.length > 2 && user.email.length < 36)
  }
  if (user.dateOfBirth) {
    lengthF = lengthF || !(user.dateOfBirth.length > 5 && user.dateOfBirth.length < 13)
  }
  if (user.gender) {
    valueF = valueF || !['0', '1'].includes(user.gender)
  }
  if (user.countryCode) {
    lengthF = lengthF || !(user.countryCode.length > 0 && user.countryCode.length < 5)
  }
  if (user.phoneNumber) {
    lengthF = lengthF || !(user.phoneNumber.length > 4 && user.phoneNumber.length < 16)
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
    //formatNotValid = formatNotValid || !regex.isAlphabetOnly(user.name)
    lengthF = lengthF || !(user.lang.length == 2)
  }

  if (fieldsF || formatNotValid || lengthF || valueF) {
    valid = false
    errMsg = 'Error updating account details'
  }
  return [valid, errMsg]
}


let isUserExperienceFieldsModifiable = (req) => {
  let allowedFields = [
    'title',
    'companyName',
    'startDate',
    'endDate',
    'location',
    'remark'
  ]
  const experience = _.pick(req, allowedFields)
  let keys = Object.keys(experience)
  let valid = true
  let errMsg
  let fieldsF = !(
    keys.length <= allowedFields.length &&
    keys.reduce((acc, cur) => acc && allowedFields.indexOf(cur) != -1, true)
  )
  let lengthF = false
  let valueF = false

  if (experience.title) {
    lengthF = lengthF || !(experience.title.length > 0 && experience.title.length < 55)
  }
  if (experience.companyName) {
    lengthF = lengthF || !(experience.companyName.length > 0 && experience.companyName.length < 55)
  }
  if (experience.startDate) {
    lengthF = lengthF || !(experience.startDate.length > 0 && experience.startDate.length < 55)
  }
  if (experience.endDate) {
    lengthF = lengthF || !(experience.endDate.length > 0 && experience.endDate.length < 55)
  }
  if (experience.location) {
    lengthF = lengthF || !(experience.location.length > 0 && experience.location.length < 55)
  }
  if (experience.remark) {
    lengthF = lengthF || !(experience.remark.length < 55)
  }
  if (fieldsF || lengthF || valueF) {
    valid = false
    errMsg = 'Error updating experience details'
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

const getUserByAppleId = (email) => {
  return User.getUserByAppleId(email)
}

const getUserByLineId = (id) => {
  return User.getUserByLineId(id)
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

async function registerAndJoinDefaultSpace(user, options) {
  options = Object.assign(
    {
      role: UserSpaceRole.EMPLOYEE,
      position: UserSpacePosition.OTHERS
    },
    options
  );

  let joinSpaceId
  if (!options.spaceId) {
    const defaultSpace = await spaceSvc.findSpace({isPrivate: true})
    joinSpaceId = String(defaultSpace._id)
  } else {
    joinSpaceId = options.spaceId
  }
  const us = await spaceSvc.joinSpace(user._id, joinSpaceId, options.role, options.position)
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
  const frontendDomain = config.downloadDomain
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
  const frontendDomain = config.downloadDomain
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
    const referralLink = `${frontendDomain}/signin?token=${token}`
    emailSvc.sendRegistractionEmail(email, `${inviter.name} ${inviter.surname}`, `${name || ''} ${surname || ''}`.trim(), referralLink)
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
      const link = `${config.downloadDomain}/spaces?spaceId=${us.spaceId}`
      const space = await spaceSvc.findSpaceById(String(us.spaceId))
      const spaceName = space.name
      emailSvc.sendSpaceInvitedEmail(email, `${inviter.name} ${inviter.surname}`, `${name} ${surname}`, spaceName, link)

      const usRemote = await spaceSvc.joinSpace(invitedUser._id, us.spaceId, role)
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

async function addUserExperience(userId, experience){
  await User.addUserExperience(userId, experience)
  return User.findById(userId)
}

const getProfileStrengthMeter = async (userId) => {
  const user = await User.getUserById(userId)
  if (!user) {
    throw new cError.ResourceNotFoundException('User not found')
  }
  const userSpace = await spaceSvc.findUserSpace(userId)
  let checklistSvc = new ChecklistService();
  //const documentTypes = await checklistSvc.fetchDocumentTypes(userSpace.spaceId)
  //const total = 12 + documentTypes.length
  let sum = 0
  if (user.photo) {sum += 1.25}
  if (user.name) {sum += 1.25}
  if (user.surname) {sum += 1.25}
  if (user.email) {sum += 1.25}
  if (user.dateOfBirth) {sum += 1.25}
  if (user.phoneNumber) {sum += 1.25}
  if (user.gender) {sum += 1.25}
  if (user.location) {sum += 1.25}
  if (user.about) {sum += 10}
  if (user.experiences && user.experiences.length > 0) {sum += 25}
  if (user.skills && user.skills.length > 0) {
    if (user.skills.length == 1) {sum += 5}
    if (user.skills.length == 2) {sum += 10}
    if (user.skills.length > 2) {sum += 15}
  }
  //work contract
  const lstContract = await Document.getByUser(userId)
  const contractVerify = lstContract.find(x=>x.status == constants.DOCUMENT_STATUS.verified)
  if (contractVerify) {sum += 20}
  //connections
  try{
    let connSvc = new ConnService();
    const connections = await connSvc.getConn(userSpace._id)
    if (connections && connections.length > 0) {
      const userIds = connections.map(c => c.userId)
      const users = await User.listUserByIds(userIds)
      let no = 0
      for (let index = 0; index < users.length; index++) {
        if (users[index].isRegistered){
          no +=1
        }
      }
      if (no > 2) {sum +=20}
    }
  } catch (e){
    console.log(e)
  }
  return (sum)
}

async function uploadPhoto(userId, photo){
  await User.updatePhoto(userId, photo)
  //return User.findById(userId)
}

async function getNewsFeed(userId, USID){
  //console.log(userId)
  let connSvc = new ConnService();
  const connections = await connSvc.getConn(USID)
  let userIds = connections.map(x=>x.userId)
  userIds.push(userId)
  let lstPublicusers = []
  for(let i =0; i< userIds.length; i++){
    const privacy = await Setting.getSettingByName(userIds[i], 'privacy', 'user_config')
    if (!privacy || !privacy.value){
      lstPublicusers.push(userIds[i])
    }
  }
  console.log("cons: " + connections)
  console.log("userIds: " + userIds)
  console.log("privacy: " + lstPublicusers)
  const feeds = await Feed.getByUser(lstPublicusers)
  let result = []
  for(let i=0; i< feeds.length; i++){
    //upload document
    if (feeds[i].type === 1){
      result.push(feeds[i])
    }
    //verify document
    if (feeds[i].type === 2){
      const userPrivacy = await Setting.getSettingByName(feeds[i].user.id, 'privacy', 'user_config')
      const reviewerPrivacy = await Setting.getSettingByName(feeds[i].reviewer.id, 'privacy', 'user_config')
      if ((!userPrivacy || !userPrivacy.value) && (!reviewerPrivacy || !reviewerPrivacy.value)){
        result.push(feeds[i])
        // if (userId !== feeds[i].user.id && userId!== feeds[i].reviewer.id){
        //   if (userIds.includes(feeds[i].user.id) && userIds.includes(feeds[i].reviewer.id)){
        //     result.push(feeds[i])  
        //   }
        // } else{
        //   result.push(feeds[i])
        // }
      }
    }
    //profile strength
    if (feeds[i].type === 3) {
      if (feeds[i].profileStrength >= 50 && feeds[i].profileStrength < 75){
        //check if exist in result
        let exist = false
        for (let j=0; j < result.length; j++){
          if (result[j].type === 3 && result[j].user.id === feeds[i].user.id && result[j].profileStrength === 50){
            exist = true
            break
          }
        }
        if (!exist){
          feeds[i].profileStrength = 50
          result.push(feeds[i])
        }
      } else{
        if (feeds[i].profileStrength >= 75 && feeds[i].profileStrength < 100){
          //check if exist in result
          let exist = false
          for (let j=0; j < result.length; j++){
            if (result[j].type === 3 && result[j].user.id === feeds[i].user.id && result[j].profileStrength === 75){
              exist = true
              break
            }
          }
          if (!exist){
            feeds[i].profileStrength = 75
            result.push(feeds[i])
          }
        } else{
          if (feeds[i].profileStrength == 100){
            //check if exist in result
            let exist = false
            for (let j=0; j < result.length; j++){
              if (result[j].type === 3 && result[j].user.id === feeds[i].user.id && result[j].profileStrength === 100){
                exist = true
                break
              }
            }
            if (!exist){
              feeds[i].profileStrength = 100
              result.push(feeds[i])
            }
          }
        }
      }
    }
  }
  return result;
}

async function updateProfileStrength(userId){
  const profileStrength = await getProfileStrengthMeter(userId)
  const user = await User.updateProfileStrength(userId, profileStrength)
  //push feed here
  if (profileStrength >= 50){
    let feed = {
      _id: mongoose.Types.ObjectId(),
      user: {
        id: user._id,
        name: user.name,
        photo: user.photo
      },
      reviewer:{
        id: user._id
      },
      action: "has reached",
      profileStrength: profileStrength,
      createAt: new Date(),
      type: 3
    }
    await feedSvc.addFeed(feed)
  }
  return await User.getUserById(userId)
}

async function deleteUser(email){
  await User.findOneAndDelete({email: email})
}

;(module.exports.isUserFieldsModifiable = isUserFieldsModifiable),
(module.exports.isUserExperienceFieldsModifiable = isUserExperienceFieldsModifiable),
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
module.exports.addUserExperience = addUserExperience
module.exports.getProfileStrengthMeter = getProfileStrengthMeter
module.exports.uploadPhoto = uploadPhoto
module.exports.getNewsFeed = getNewsFeed
module.exports.updateProfileStrength = updateProfileStrength
module.exports.getUserByAppleId = getUserByAppleId
module.exports.getUserByLineId = getUserByLineId
module.exports.deleteUser = deleteUser
