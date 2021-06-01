const jwt = require('jsonwebtoken')
const errors = require('../helper/errors.js')
const config = require('../config')
const _ = require('lodash')

function getJwt(user, secret = config.secret, expiresIn = '30d') {
  const userSign = _.pick(user, [
    'email',
    'name',
    'surname',
    'userType',
    'createdAt',
    'expiresAt',
    'lang',
    'positionType',
    'isRegistered',
    'userRole'
  ])
  userSign.id = user._id
  return [
    jwt.sign(
      {
        userId: userSign.id,
        user: userSign,
      },
      secret,
      { expiresIn }
    ),
    userSign,
  ]
}

module.exports = {
  getJwt,
}
