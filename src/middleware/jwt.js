const log = require('../helper/logger.js').log
const jwt = require('jsonwebtoken')
const config = require('../config')
const errors = require('../helper/errors.js')
const jwtHelper = require('../helper/jwtHelper')
const axios = require('axios')
const qs = require('querystring')
const mongoose = require('mongoose')
const userSvc = require('../services/userSvc')
const { EXT_AUTH_PATH } = require('../constants')
const passport = require('passport')

const TOKEN_INVALID_MSG = 'Authentication failure'
const publicPrefix = '-----BEGIN PUBLIC KEY-----'
const publicSuffix = '-----END PUBLIC KEY-----'
const publicKey = [publicPrefix, config.publicKey, publicSuffix].join('\n')
const getKey = (header, cb) => cb(null, header.alg.startsWith('HS') ? config.secret : publicKey)

function checkToken(req, res, next) {
  // check if prefix /ext/, exchange jwt from v8-trust
  const isExt = Object.values(EXT_AUTH_PATH).reduce((acc, current) => {
    return String(req.url).toLowerCase().startsWith(current) || acc
  }, false)

  const [authType, token] = req.headers['authorization'].split(' ')
  if (!(authType === 'Bearer' && token)) {
    return errors.makeMessage(res, errors.authenticationError, 'Auth token is not supplied')
  }

  if (isExt) {
    req.isExt = isExt
    req.body.jwt = token
    passport.authenticate('ext-auth', async (err, user, info) => {
      if (err) {
        return errors.makeMessage(res, errors.authenticationError, err)
      } else if (!user) {
        return errors.makeMessage(res, errors.authenticationError, info.message)
      }
      req.body.decoded = req.decoded = { ...user }
      next()
    })(req, res, next)
  } else {
    const callback = async (err, decoded) => {
      try {
        if (err) throw err
        const user = (await userSvc.getUserById(decoded.userId)).toObject()
        if (user.email === decoded.user.email) {
          req.body.decoded = req.decoded = { ...decoded, ...user }
          next()
        } else {
          throw new Error('User validation failure')
        }
      } catch (err) {
        return errors.makeMessage(res, errors.authenticationError, `${err}`)
      }
    }
    jwt.verify(token, getKey, callback)
  }
}

async function ssoLogin(req, res) {
  const { code, signInAuthority } = req.body
  if (!code) {
    return errors.make(res, errors.loginNoCode)
  }
  const userInfo = await getUserInfoFromThirdParty(code, signInAuthority, req, res)
  const userDB = await getOrRegisterUser(userInfo, req, res)
  const [token, userSign] = jwtHelper.getJwt(userDB, config.secret)
  res.json({
    token,
    user: userSign,
  })
}

async function getUserInfoFromThirdParty(code, signInAuthority, req, res) {
  try {
    let userInfo
    if (signInAuthority === 'microsoft') {
      userInfo = await getUserInfoFromMicrosoft(req)
    } else if (signInAuthority === 'facebook') {
      userInfo = await getUserInfoFromFacebook(code)
    } else {
      throw new Error(`Unsupported SSO ${signInAuthority}`)
    }

    return userInfo
  } catch (error) {
    log.info('get userinfo error >:', error)
    return errors.makeMessage(
      res,
      errors.authenticationFail,
      `User info could not be retrieved from ${signInAuthority}.`
    )
  }
}

async function getUserInfoFromFacebook(code) {
  const { client_id, client_secret, redirect_uri, tokenUrl, userInfoUrl } = config.facebook.oauth

  // Fetch Facebook token with code sent from frontend

  const combinedURL =
    tokenUrl +
    '?' +
    qs.stringify({
      code,
      client_id,
      client_secret,
      redirect_uri,
    })

  const responseToken = await axios.get(combinedURL)

  // Fetch user data with token

  const responseUser = await axios.get(userInfoUrl, {
    headers: {
      Authorization: 'Bearer ' + responseToken.data.access_token,
    },
  })

  // Compose user object

  const { email, name, first_name, last_name } = responseUser.data

  return {
    email: (email || name).toLowerCase().trim(),
    name: first_name,
    surname: last_name,
  }
}

async function getOrRegisterUser(user, req, res) {
  let userDb = await userSvc.getUserByEmail(user.email)
  if (!userDb || userDb.isRegistered === false) {
    user._id = mongoose.Types.ObjectId()
    userDb = await userSvc.userRegistrationInit(user)
    log.info('new User', userDb.toObject())
  }

  if (!userDb) {
    return errors.makeMessage(res, errors.internalServerError, `User data could not be retrieved from the database.`)
  }

  return userDb.toObject()
}

async function getUserInfoFromMicrosoft(req) {
  // Async call, to fetch access token
  log.info(config.azure.oauth.tokenUrl)
  log.info(config.azure.oauth.config)
  const { code } = req.body
  var host = req.headers.host
  var origin = req.headers.origin
  var redirectUrl
  if (host.indexOf('trust-backend.dev.diginex.fun') > -1) {
    redirectUrl = `https://trust-vue.dev.diginex.fun/signin`
  } else if (host.indexOf('localhost') === 0 || host.indexOf('192.168') === 0) {
    redirectUrl = 'http://localhost:8080/signin'
  } else if (host.indexOf('coca-cola-emin') > -1) {
    redirectUrl = 'https://coca-cola-emin.aks.diginex.app/signin'
  } else if (host.indexOf('emin-api.aks.diginex.app') > -1) {
    redirectUrl = 'https://emin.aks.diginex.app/signin'
  } else if (host.indexOf('trust-backend.qa.diginex.fun') > -1) {
    redirectUrl = 'https://trust-vue.qa.diginex.fun/signin'
  } else if (host.indexOf('trust-backend.dev2.diginex.fun') > -1) {
    redirectUrl = 'https://trust.dev2.diginex.fun/signin'
  } else {
    redirectUrl = 'https://trust.diginex.com/signin'
  }

  log.info(`host ${host}`, `origin ${origin}`)
  log.info('redirectUrl', redirectUrl)

  const responseToken = await axios.post(
    config.azure.oauth.tokenUrl,
    qs.stringify({
      code,
      scope: config.azure.oauth.config.scope,
      grant_type: config.azure.oauth.config.grant_type,
      client_id: config.azure.oauth.config.client_id,
      client_secret: config.azure.oauth.config.client_secret,
      redirect_uri: redirectUrl,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  )

  // Async call to get userinfo from azure service
  const authToken = 'Bearer ' + responseToken.data.access_token
  const headers = { headers: { Authorization: authToken } }
  const responseUser = await axios.get(config.azure.oauth.userInfoUrl, headers)

  // Compose user object
  const resUser = responseUser.data
  const email = (resUser.mail ? resUser.mail : resUser.userPrincipalName).toLowerCase().trim()

  log.info('get userinfo success >:', resUser)

  const user = {
    email,
    name: resUser.givenName,
    surname: resUser.surname,
  }

  return user
}

module.exports = {
  checkToken,
  ssoLogin,
}
