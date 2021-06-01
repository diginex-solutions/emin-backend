let requestTracker = (req, res, next) => {
  req.body.RESERVED_TIME = req.time = Date.now()
  var rx = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/
  const forwarded = req.headers['x-forwarded-for']
  req.userAddress =
    forwarded && rx.test(forwarded.split(',')[0]) ? forwarded.split(',')[0] : req.connection.remoteAddress
  next()
}

module.exports = {
  requestTracker,
}
