const axios = require('axios')
const config = require('../config')

function send(message) {
  if (process.env.APP_ENV !== 'local') {
    const msg = `[${process.env.APP_ENV}] ${message}`
    axios({
      method: 'post',
      url: config.slackWebhook,
      data: {
        text: msg,
      },
    })
  }
}

module.exports = {
  send,
}
