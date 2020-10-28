var bunyan = require('bunyan')
var obj = {}
if (!obj.log) {
  if (process.env.NODE_ENV === 'test') {
    obj.log = bunyan.createLogger({
      name: 'trust',
      streams: [
        {
          stream: process.stdout,
          level: 'fatal',
        },
      ],
    })
  } else {
    obj.log = bunyan.createLogger({ name: 'trust' })
  }
}
module.exports = obj
