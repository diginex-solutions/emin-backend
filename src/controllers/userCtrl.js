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
const fs = require('fs');
const { path } = require('../models/inputsSchema');
const fpath = require('path')
const {
  extractFilename
} = require('../helper/util')

async function getUserInfo(req, res, next) {
  const user = await userSvc.getUserById(req.body.decoded.id)
  const us = await spaceSvc.findMyUserSpace({_id: req.body.RESERVED_USID, valid: true})
  const userResp = _.assign({}, user.toObject(), {role: us.role, positionType: us.positionType })
  resMapper.removeAllWithKeyName(userResp, ['brand', 'profileType']) // hide field (if it's completely removedm in the DB, then we can remove this line as well)
  res.json(userResp)
}

async function getUsers(req, res, next) {
  const spaceId = req.body.RESERVED_SPACEID
  const userRole = req.body.RESERVED_USROLE
  const space = await spaceSvc.findSpaceById(spaceId)
  if (!space.isUserDirectory && userRole !== UserSpaceRole.ADMIN){
    throw new cError.InvalidRequestPayloadException('The space does not have user directory')
  }
  const users = await userSvc.getUsers(req.body.RESERVED_USID)
  resMapper.removeAllWithKeyName(users, ['brand', 'profileType'])
  res.json(resMapper.objReplaceKeyName(users, '_id', 'id'))
}

async function updateUserType(req, res, next) {
  const userType = req.body.userType
  const userId = req.body.userId
  if (!userId) {
    return errors.makeMessage(res, errors.invalidRequestPayload, 'User Id is not valid')
  }
  const [valid, errMsg] = userSvc.validateUserType(userType)
  if (valid) {
    const user = (await userSvc.setUserUserType(req.decoded.userId, userId, userType)).toObject()
    res.json(resMapper.users(user))
  } else {
    return errors.makeMessage(res, errors.invalidRequestPayload, errMsg)
  }
}

async function getUserOverview(req, res, next) {
  // superset of /history
  const used = await userSvc.getSpaceUsage(req.decoded.userId)
  // make the total simple, as its not even specified in the spec.
  const space = { used, total: 5 * 1024 * 1024 * 1024 }
  const historyRaw = await historySvc.getHistoryByUser(req.decoded)
  const history = resMapper.histories(historyRaw, req.decoded)
  const overview = {
    space,
    history,
  }
  res.json(overview)
}

async function updateUser(req, res, next) {
  const [valid, errMsg] = userSvc.isUserFieldsModifiable(req.body)
  const user = await userSvc.getUserWithPwd(req.decoded.userId)
  if (valid) {
    if (req.body.email){
      const u = await userSvc.getUserByEmail(req.body.email)
      if (u && u._id !== req.decoded.userId){
        return errors.makeMessage(res, errors.invalidRequestPayload, "Email has been existed")
      }
    }
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
        await userSvc.registerAndJoinDefaultSpace(user)
        await OtpModel.removeByUserId(user._id)
      }
      req.body.password = util.hashSalt(req.body.password)
    }
    let userResp = (await userSvc.setUserById(req.decoded.userId, req.body)).toObject()
    //update profile strength
    userResp = await userSvc.updateProfileStrength(req.decoded.userId)
    userResp = await userSvc.getUserById(req.decoded.userId)
    res.json(resMapper.users(userResp))
  } else {
    errors.makeMessage(res, errors.invalidRequestPayload, errMsg)
  }
}

async function addExperience(req, res, next) {
  const [valid, errMsg] = userSvc.isUserExperienceFieldsModifiable(req.body)
  if (valid) {
    let userResp = (await userSvc.addUserExperience(req.decoded.userId, req.body))
    //update profile strength
    userResp = await userSvc.updateProfileStrength(req.decoded.userId)
    userResp = await userSvc.getUserById(req.decoded.userId)
    res.json(resMapper.users(userResp))
  } else {
    errors.makeMessage(res, errors.invalidRequestPayload, errMsg)
  }
}

async function findContact(req, res, next) {
  const user = await User.findById(req.decoded.userId).exec()
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
  const { RESERVED_USID: USID, email: emailU, name, surname } = req.body
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
  const myUserId = req.decoded.userId
  const remoteUserId = req.params.userId
  const invitedUser = await userSvc.reinviteUser(myUserId, remoteUserId)
  res.json(resMapper.users(invitedUser))
}

async function leaveSpace(req, res, next) {
  const { id } = req.body.decoded;
  const spaceId = req.params.spaceId;
  const usLeft = await spaceSvc.leaveSpace(id, spaceId)
  res.json(usLeft)
}

async function kickUserFromSpace(req, res, next) {
  const { userId } = req.params
  const spaceId = req.body.RESERVED_SPACEID;
  const usLeft = await spaceSvc.leaveSpace(userId, spaceId)
  res.json(usLeft)
}

async function changeUserSpaceRole(req, res, next) {
  const { userId } = req.params
  const { role } = req.body
  const spaceId = req.body.RESERVED_SPACEID;
  if (Object.values(UserSpaceRole).includes(role)){
    const us = await spaceSvc.updateRole(userId, spaceId, role)
    res.json(us)
  } else {
    throw new cError.InvalidRequestPayloadException(`Role: ${role} is not in allowed value ${Object.values(UserSpaceRole)}`)
  }
}

async function getProfileStrengthMeter(req, res, next) {
  const meter = await userSvc.getProfileStrengthMeter(req.decoded.userId)
  res.json({meter: Math.round(meter)})
}

async function uploadPhoto(req, res, next) {
  try{
    console.log(req.file)
    await userSvc.uploadPhoto(req.decoded.userId, req.file.url)
    //update profile strength
    await userSvc.updateProfileStrength(req.decoded.userId)
    res.json({success: true, photo: req.file.url})
  }
  catch (e){
    console.log(e)
    return errors.makeMessage(res, errors.internalServerError, JSON.Sharing(e))
  }
}

async function getNewsFeed(req, res, next) {
  const feeds = await userSvc.getNewsFeed(req.decoded.userId, req.body.RESERVED_USID)
  res.json(feeds)
}

async function getUserById(req, res, next){
  const userId = req.params.userid
  const user = await userSvc.getUserById(userId)
  res.json(user)
}

async function getUserByEmail(req, res, next){
  const user = await userSvc.getUserByEmail(req.query.email)
  res.json(user)
}

async function deleteUser(req, res, next){
  const email = req.params.email
  await userSvc.deleteUser(email)
  res.json({success: true})
}

async function exportPdf(req, res, next){
  const path = require('path')
  let fs = require('fs')
  let PDFDocument = require('pdfkit')
  var sizeOf = require('image-size');


  const pdfBuffer = await new Promise(resolve => {
    const doc = new PDFDocument({
      size: 'A4',
      bufferPages: true,
    })
    let  fontPath = path.join(__dirname, "..", "static", "fonts", "burmese_regular.ttf")
    doc.fontSize(24)
    doc.font(fontPath).text(req.body.surveyName, {
      //here it is, 
      align: 'center',
    })
    for(let i =0; i< req.files.length; i++){
      let img = Buffer.from(req.files[i].buffer);
      var dimensions = sizeOf(img);
      // console.log(dimensions.height/ dimensions.width);
      // check if image is long or wide, then fit height or witdh
      if (dimensions.height / dimensions.width > 1.2) { 
        doc.image(img, 23,120,{
          height: 660,
          align: 'center',
          valign: 'top'
        });
      } else {
        doc.image(img, 23,120,{
          width: 550,
          align: 'center',
          valign: 'top'
        });
      }
      if (i < req.files.length - 1){
        doc.addPage()
      }
    } 
    doc.end()

    const buffer = []
    doc.on('data', buffer.push.bind(buffer))
    doc.on('end', () => {
      const data = Buffer.concat(buffer)
      resolve(data)
    })
  })
  //test
  
  // fs.writeFile('test.pdf', pdfBuffer, function(err) {
  //   if(err) {
  //       return console.log(err);
  //   }
  //   console.log("The file was saved!");
  // })

  return res.json(pdfBuffer)
}

module.exports = {
  getUserInfo,
  getUserOverview,
  updateUser,
  addExperience,
  findContact,
  isRegistered,
  getUsers,
  updateUserType,
  inviteUser,
  reinviteUser,
  leaveSpace,
  kickUserFromSpace,
  changeUserSpaceRole,
  getProfileStrengthMeter,
  uploadPhoto,
  getNewsFeed,
  getUserById,
  deleteUser,
  getUserByEmail,
  exportPdf
}
