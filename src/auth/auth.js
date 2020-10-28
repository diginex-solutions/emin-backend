const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const _ = require('lodash')
const LocalTokenStrategy = require('passport-auth-token').Strategy
const CustomStrategy = require('passport-custom').Strategy
const fs = require('fs')
const userSvc = require('../services/userSvc')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const regexhelper = require('../helper/regex')
const azureStorageSvc = require('../services/azureStorageSvc')
const fileSvc = require('../services/fileSvc')
const templateCtrl = require('../controllers/templateCtrl')
const templateSvc = require('../services/templateSvc')
const widgetSvc = require('../services/widgetSvc')
const settingSvc = require('../services/settingSvc')
const OtpModel = mongoose.model('Otp')
const UserModel = mongoose.model('User')
const extAppModel = mongoose.model('ExtApp')
const config = require('../config')
const { SETTING_TYPE, getSupportLang } = require('../constants')
const EMAIL_FORMAT_CHECK = config.email_format_check
const jwt = require('jsonwebtoken')
const { UserSpaceRole, UserSpacePosition } = require('../types');
const { SpaceService } = require('../services/spaceSvc');
const spaceSvc = SpaceService.getInstance()

passport.use(
  'local-signup',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    },
    async (req, emailU, password, done) => {
      const errMsg = regexhelper.passwordValidationError(password)
      if (errMsg) return done(null, false, { message: errMsg })

      const email = String(emailU).toLowerCase().trim()
      const name = String(req.body.name)
      const surname = String(req.body.surname)
      const lang = getSupportLang(req.body.lang)

      if (!req.body.name || !req.body.surname) {
        return done(null, false, { message: 'Payload with (email, password, name, surname) is expected' })
      } else if (!regexhelper.isEmail(email) && EMAIL_FORMAT_CHECK) {
        return done(null, false, { message: `Invalid email format ${email}` })
      }

      let userAcc = await userSvc.getUserByEmail(email)
      if (!userAcc || userAcc.isRegistered === false) {
        const salt = bcrypt.genSaltSync(10)
        const hash = bcrypt.hashSync(password, salt)
        const user = {
          _id: userAcc && userAcc._id ? userAcc._id : mongoose.Types.ObjectId(),
          email,
          name,
          surname,
          password: hash,
          lang,
        }
        const userResult = await userSvc.userRegistrationInit(user)
        const userResp = await userSvc.getUserById(userResult._id)
        return done(null, userResp)
      } else {
        return done(null, false, { message: `There is an existing account associated with ${emailU}` })
      }
    }
  )
)

passport.use(
  'local-signin',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (emailU, password, done) => {
      const email = String(emailU).toLowerCase().trim()
      const user = await userSvc.getUserWithPwByEmail(email)
      if (!user) {
        return done(null, false, { message: 'Wrong credentials' })
      } else {
        const hashedPw = user.password
        if (!hashedPw) {
          return done(null, false, { message: 'Wrong credentials' })
        }
        const validate = bcrypt.compareSync(password, hashedPw)
        if (!validate) {
          return done(null, false, { message: 'Wrong credentials' })
        } else {
          return done(null, user, { message: 'Logged in Successfully' })
        }
      }
    }
  )
)

passport.use(
  'local-token',
  new LocalTokenStrategy(
    async (token, done) => {
      const otp = await OtpModel.get(token)
      const userId = _.get(otp, 'userId')
      const user = await userSvc.getUserById(userId)
      const isRegistered = _.get(user, 'isRegistered')
      if (!user || isRegistered !== false) {
        return done(null, false, { message: 'Wrong credentials' })
      } else {
        return done(null, user, { message: 'Logged in Successfully' })
      }
    }
  )
)

function getKey(header, callback) {
  const signingKey = process.env[`pubkey_${header.kid}`] || null
  callback(null, signingKey);
}

passport.use(
  'ext-auth',
  new CustomStrategy(
    async (req, done) => {
      const callback = async (err, decoded) => {
        if (err) done(null, false, { message: 'Authentication error' })
        if (decoded.applicationId && decoded.userId && decoded.email) {
          const applicationId = String(decoded.applicationId).toLowerCase()
          const extUserId = String(decoded.userId)
          if (extUserId.length < 1 || extUserId.length > 36 || !decoded.userId) done(null, false, { message: 'userId length should be between 1 to 36' })
          const user = await UserModel.getExtUser(applicationId, extUserId)
          if (!user && req.isExt === true) {
            done(null, false, { message: 'Unregistered user' })
          }

          const extApp = await extAppModel.findOne({applicationId})
          const finish = async (done, user, spaceId) => {
            const us = await spaceSvc.findMyUserSpace({userId: user._id, spaceId, valid: true})
            done(null, {...user, positionType: us.positionType })
          }
          req.query.spaceId = String(extApp.spaceId)
          if (user) {
            finish(done, user, extApp.spaceId)
          } else {
            //create user, add space
            const user = {
              _id: mongoose.Types.ObjectId(),
              email: decoded.email,
              name: decoded.name,
              surname: decoded.surname,
              lang: decoded.language,
              applicationId,
              extUserId
            }
            const position = String(decoded.role).toLowerCase()
            const validPosition = Object.values(UserSpacePosition).indexOf(position) >= 0
            if (!extApp) done(null, false, { message: `No application can be found with id: ${applicationId}` })
            const options = {
              spaceId: extApp.spaceId,
              position: validPosition ? position : UserSpacePosition.OTHERS
            }
            const userResult = await userSvc.userRegistrationInit(user, options)
            finish(done, userResult.toObject(), extApp.spaceId)
          }
        } else {
          done(null, false, { message: 'applicationId, userId and email fields must be provided' })
        }
      }
      jwt.verify(req.body.jwt, getKey, callback)
    }
  )
)