const CorsError = require('./customError').CorsError
const config = require('../config')
let whitelist = config.corsWhitelist
let corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin || whitelist.indexOf('*') !== -1) {
      callback(null, true)
    } else {
      callback(new CorsError('Not allowed by CORS'))
    }
  },
}

module.exports = {
  corsOptions,
}
