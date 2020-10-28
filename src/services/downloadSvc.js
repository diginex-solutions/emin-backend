var log = require('../helper/logger.js').log
var config = require('../config')
var crypto = require('crypto')
var mongoose = require('mongoose')
var Sharing = mongoose.model('Sharing')
var History = mongoose.model('History')
var File = mongoose.model('File')
var azureStorageSvc = require('./azureStorageSvc')
var historySvc = require('./historySvc')
let { getExtension } = require('../helper/util')
const constants = require('../constants')

let getBlobLinkSas = async (hmac, sharingId, ts, ipAddress) => {
  var key = String(config.hmacSecret)
  var verifyHmac = crypto.createHmac('sha1', key).update(sharingId).digest('hex')

  if (verifyHmac == hmac) {
    var share = await Sharing.getSharingById(sharingId)
    if (share) {
      var file = await File.getFileById(share.fileId._id)
      let filename = getExtension(file.name, file.extension)

      var blobPath = `${share.fileId.user}/${share.fileId._id}`
      var uriSas = azureStorageSvc.getBlobLinkSas(config.azure.containerName, blobPath, 'r', filename)
      var history = await historySvc.saveThenStampHistory(
        constants.HISTORY_ACTION.view,
        ts,
        share.fileId._id,
        share.fileId.user,
        sharingId,
        ipAddress,
        share.email
      )
      return uriSas.uri
    }
  }
  return null
}

module.exports = {
  getBlobLinkSas,
}
