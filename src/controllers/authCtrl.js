const errors = require('../helper/errors')
const jwtHelper = require('../helper/jwtHelper')
const passport = require('passport')
const config = require('../config')
const userSvc = require('../services/userSvc')
const emailSvc = require('../services/emailSvc')
const crypto = require('crypto')
const mongoose = require('mongoose')
const Otp = mongoose.model('Otp')
const regexhelper = require('../helper/regex')
const { stringify } = require('querystring')
const axios = require('axios')
const bcrypt = require('bcryptjs')
const resMapper = require('../helper/resMapper.js')
const cError = require('../helper/customError')
const jwt = require('jsonwebtoken')
function getKey(header, callback) {
  const signingKey = process.env[`pubkey_${header.kid}`] || null
  callback(null, signingKey);
}


async function passportExtAuth(req, res, next, cb) {
  passport.authenticate('ext-auth', async (err, user, info) => {
    if (err) {
      return errors.makeMessage(res, errors.registrationFail, err)
    } else if (!user) {
      return errors.makeMessage(res, errors.registrationFail, info.message)
    } else {
      return cb(req, res, next, user)
    }
  })(req, res, next)
}

async function extAuthCreateUser(req, res, next) {
  const cb = (req, res, next, user) => {
    const [token, userSign] = jwtHelper.getJwt(user, config.secret)
    res.json(userSign)
  }
  return passportExtAuth(req, res, next, cb)
}

async function extAuthSignIn(req, res, next) {
  const cb = (req, res, next, user) => {
    const [token, userSign] = jwtHelper.getJwt(user, config.secret)
    res.json({
      token: token,
      user: userSign,
    })
  }
  return passportExtAuth(req, res, next, cb)
}

async function signup(req, res, next) {
  await validateReRecaptcha(req.body.captcha, req.connection.remoteAddress)
  passport.authenticate('local-signup', async (err, user, info) => {
    if (err) {
      return errors.makeMessage(res, errors.registrationFail, err)
    }
    if (!user) {
      return errors.makeMessage(res, errors.registrationFail, info.message)
    }
    const [token, userSign] = jwtHelper.getJwt(user, config.secret)
    return res.json({
      token: token,
      user: userSign,
    })
  })(req, res, next)
}

async function signupWithFb(req, res, next) {
  passport.authenticate('fb-token', async (err, user, info) => {
    if (err) {
      return errors.makeMessage(res, errors.registrationFail, err)
    }
    if (!user) {
      return errors.makeMessage(res, errors.registrationFail, info.message)
    }
    const [token, userSign] = jwtHelper.getJwt(user, config.secret)
    return res.json({
      token: token,
      user: userSign,
    })
  })(req, res, next)
}

async function validateReRecaptcha(captcha, remoteAddress) {
  // if (process.env.APP_ENV === 'local' || process.env.APP_ENV === 'development') {
  //   return //skip checking to ease our development
  // }
  // const secretKey = config.reCaptcha.secretV2
  // // Verify URL
  // const query = stringify({
  //   secret: secretKey,
  //   response: captcha,
  //   remoteip: remoteAddress,
  // })
  // const verifyURL = `${config.reCaptcha.verifyURL}?${query}`

  // // Make a request to verifyURL
  // const body = await axios.get(verifyURL)
  // // If not successful
  // if (!body.data.success) {
  //   throw new cError.ReCaptchaException('Invalid reCaptcha value')
  // }
  return
}

async function signin(req, res, next) {
  await validateReRecaptcha(req.body.captcha, req.connection.remoteAddress)
  const localStrategy = req.body.token ? 'local-token' : 'local-signin'
  passport.authenticate(localStrategy, { session: false }, async (err, user, info) => {
    try {
      if (err) {
        return next(new Error(err))
      }
      if (!user) {
        return errors.makeMessage(res, errors.authenticationFail, info.message)
      }
      const [token, userSign] = jwtHelper.getJwt(user, config.secret)
      return res.json({
        token: token,
        user: userSign,
      })
    } catch (error) {
      return next(error)
    }
  })(req, res, next)
}

async function signinWithFb(req, res, next) {
  passport.authenticate('fb-signin', async (err, user, info) => {
    if (err) {
      return errors.makeMessage(res, errors.registrationFail, err)
    }
    if (!user) {
      return errors.makeMessage(res, errors.registrationFail, info.message)
    }
    const [token, userSign] = jwtHelper.getJwt(user, config.secret)
    return res.json({
      token: token,
      user: userSign,
    })
  })(req, res, next)
}

async function signinWithLine(req, res, next) {
  passport.authenticate('line', async (err, lineInfo, info) => {
    if (err) {
      return errors.makeMessage(res, errors.registrationFail, err)
    }
    if (!lineInfo) {
      return errors.makeMessage(res, errors.registrationFail, info.message)
    }

    let userAcc = await userSvc.getUserByLineId(lineInfo.id)
    if (!userAcc) {
      if (req.body.email) {email = req.body.email}
      const user = {
        _id: userAcc && userAcc._id ? userAcc._id : mongoose.Types.ObjectId(),
        lineId: lineInfo.id,
        email,
        name: req.body.name,
        surname: req.body.surname,
        photo: lineInfo.photo
      }
      const userResult = await userSvc.userRegistrationInit(user)
      await userSvc.updateProfileStrength(userResult._id)
      userAcc = await userSvc.getUserById(userResult._id)
    }
    const [token, userSign] = jwtHelper.getJwt(userAcc, config.secret)
    return res.json({
      token: token,
      user: userSign,
    })
  })(req, res, next)
}

async function loginWithLine(req, res, next) {
  try{
    passport.authenticate('line-token', async (err, lineInfo, info) => {
      if (err) {
        return errors.makeMessage(res, errors.registrationFail, err)
      }
      if (!lineInfo) {
        return errors.makeMessage(res, errors.registrationFail, info.message)
      }
      let userAcc = await userSvc.getUserByLineId(lineInfo.id)
      let email = lineInfo.email
      if (!userAcc) {
        if (req.body.email) {email = req.body.email}
        const user = {
          _id: userAcc && userAcc._id ? userAcc._id : mongoose.Types.ObjectId(),
          lineId: lineInfo.id,
          email,
          name: req.body.name,
          surname: req.body.surname,
          photo: lineInfo.photo
        }
        const userResult = await userSvc.userRegistrationInit(user)
        await userSvc.updateProfileStrength(userResult._id)
        userAcc = await userSvc.getUserById(userResult._id)
      }
      const [token, userSign] = jwtHelper.getJwt(userAcc, config.secret)
      return res.json({
        token: token,
        user: userSign,
      })
    })(req, res, next)
  }catch(err){
    console.log(err)
    return errors.makeMessage(res, errors.registrationFail, err)
  }
}


async function resetPassword(req, res, next) {
  await validateReRecaptcha(req.body.captcha, req.connection.remoteAddress)
  // param: email address
  // response: 202 Accepted no matter the address exists or not
  // do: check existing email address,
  // generate long random byte as token then save it to store with expiry
  // send the email to the address with the token
  if (req.body.email) {
    const email = String(req.body.email).trim()
    const user = await userSvc.getUserWithPwByEmail(email)
    if (user && user.isRegistered !== false) {
      const token = crypto.randomBytes(32).toString('hex')
      const otp = await Otp.set(token, user._id)
      emailSvc.sendPasswordResetEmail(email, user.name, token)
    }
    res.status(202)
    res.json({ success: true })
  } else {
    return errors.makeMessage(res, errors.invalidRequestPayload, 'Payload should contain email field')
  }
}

async function changePasswordWithOTPToken(req, res, next) {
  // param: OTP, password
  // check token exist, not used, not expired
  // change password
  const token = String(req.query.token).trim()
  const password = String(req.body.password)
  const errMsg = regexhelper.passwordValidationError(password)
  if (errMsg) return errors.makeMessage(res, errors.invalidRequestPayload, errMsg)
  const otp = await Otp.use(token)
  if (otp && otp.userId) {
    const user = await userSvc.changeUserPassword(otp.userId, password)
    if (user) {
      return res.json(user)
    } else {
      return errors.makeMessage(res, errors.internalServerError, 'There is an unexpected error during reset')
    }
  } else {
    return errors.makeMessage(res, errors.invalidRequestPayload, 'The token provided is not valid')
  }
}

async function reset(req, res, next) {
  if (req.query.token) {
    return await changePasswordWithOTPToken(req, res, next)
  } else {
    return await resetPassword(req, res, next)
  }
}

async function changePassword(req, res, next) {
  const { password: newPassword, currentPassword } = req.body
  const { userId } = req.decoded
  const user = await userSvc.getUserWithPwd(userId)
  const errMsg = regexhelper.passwordValidationError(newPassword)
  if (errMsg) {
    return errors.makeMessage(res, errors.invalidRequestPayload, errMsg)
  }

  if (user.isRegistered !== false) {
    const match = currentPassword ? await bcrypt.compare(currentPassword, user.password) : false
    if (!match) {
      return errors.makeMessage(res, errors.wrongPasswordError, 'Wrong current password')
    }
  } else {
    await userSvc.registerAndJoinDefaultSpace(user)
    await Otp.removeByUserId(user._id)
  }

  const updatedUser = await userSvc.changeUserPassword(userId, newPassword)
  if (updatedUser) {
    return res.json(resMapper.users(updatedUser))
  } else {
    return errors.makeMessage(res, errors.internalServerError, 'An unexpected error occured.')
  }
}

const {AppleSignIn} = require("apple-sign-in-rest");

/**
 * See docs for full list of options and descriptions:
 * https://renarsvilnis.github.io/apple-sign-in-rest/classes/_applesignin_.applesignin.html#constructor
 */
const appleSignIn = new AppleSignIn({
  /**
   * This secret depends on that login "flow" you trying to create:
   *   - "web login" - this is the "serviceId"
   *   - "ios login" - this is the app "bundleId", choose only this if you trying to
   *                   verify user that has signed into using the native iOS way
   *
   */
  clientId: "-",
  teamId: "-",
  keyIdentifier: "-",
  privateKey: "-",
  // or instead of privateKey use privateKeyPath to read key from file
  //privateKeyPath: '/Users/arnold/my-project/credentials/AuthKey.p8';
})

async function signinWithApple(req, res, next) {
  const clientSecret = "-"
  const code = req.body.code
  try{
    const tokenResponse = await appleSignIn.getAuthorizationToken(clientSecret, code, {
    });
    const claim = await appleSignIn.verifyIdToken(tokenResponse.id_token, {
    });
    let email = claim.email
    if (!email){
      errors.makeMessage(res, errors.registrationFail, "There is no email for apple ID")
    }
    let userAcc = await userSvc.getUserByAppleId(email)
    if (!userAcc) {
      if (req.body.email) {email = req.body.email}
      const user = {
        _id: userAcc && userAcc._id ? userAcc._id : mongoose.Types.ObjectId(),
        appleId: email,
        email,
        name: req.body.name,
        surname: req.body.surname
      }
      const userResult = await userSvc.userRegistrationInit(user)
      await userSvc.updateProfileStrength(userResult._id)
      userAcc = await userSvc.getUserById(userResult._id)
    }
    const [token, userSign] = jwtHelper.getJwt(userAcc, config.secret)
    return res.json({
      token: token,
      user: userSign,
    })
  }catch (err){
    console.log(err)
    return errors.makeMessage(res, errors.registrationFail, err)
  }
}

module.exports = {
  signin,
  signup,
  signupWithFb,
  reset,
  changePassword,
  passportExtAuth,
  extAuthSignIn,
  extAuthCreateUser,
  signinWithFb,
  signinWithApple,
  signinWithLine,
  loginWithLine
}
