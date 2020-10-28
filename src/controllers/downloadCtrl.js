var log = require('../helper/logger.js').log
var router = require('express').Router()
var downloadSvc = require('../services/downloadSvc')

async function publicDownload(req, res, next) {
  if (!req.query.go) {
    res.send(`
    <html>
      <head>
        <meta http-equiv="refresh" content="3; url=?go=true" />
        <meta name="viewport" content="width=device-width" />
      </head>
      <body style="font-family: sans-serif; padding: 0.5em; padding-top: 1em;">
        Your download should begin shortly, if it does not, please <a style="color: #cc2431" href="?go=true">click here to download the file.</a>
      </body>
    </html>`)
  } else {
    var uriSas = await downloadSvc.getBlobLinkSas(req.params.hmac, req.params.sharingId, req.time, req.userAddress)
    if (uriSas) {
      res.redirect(307, uriSas)
    } else {
      res.send(`
      <html>
        <head>
          <meta name="viewport" content="width=device-width" />
        </head>
        <body style="font-family: sans-serif; padding: 0.5em; padding-top: 1em;">
          You are not authorized to access this file or your access has been revoked. Please contact the file owner for more information.
        </body>
      </html>`)
    }
  }
}

router.get('/:hmac/:sharingId', async (req, res, next) => {
  if (!req.query.go) {
    res.send(`
    <html>
      <head>
        <meta http-equiv="refresh" content="3; url=?go=true" />
        <meta name="viewport" content="width=device-width" />
      </head>
      <body style="font-family: sans-serif; padding: 0.5em; padding-top: 1em;">
        Your download should begin shortly, if it does not, please <a style="color: #cc2431" href="?go=true">click here to download the file.</a>
      </body>
    </html>`)
  } else {
    var uriSas = await downloadSvc.getBlobLinkSas(req.params.hmac, req.params.sharingId, req.time, req.userAddress)
    if (uriSas) {
      res.redirect(307, uriSas)
    } else {
      res.send(`
      <html>
        <head>
          <meta name="viewport" content="width=device-width" />
        </head>
        <body style="font-family: sans-serif; padding: 0.5em; padding-top: 1em;">
          You are not authorized to access this file or your access has been revoked. Please contact the file owner for more information.
        </body>
      </html>`)
    }
  }
})

module.exports = {
  publicDownload,
}
