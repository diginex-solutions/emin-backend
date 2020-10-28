var bencode = require('bencode')
var crypto = require('crypto')
const _ = require('lodash')
let historysha256sum = (history) => {
  if (history && history.fileId){
    delete history.fileId._id
  }
  const histCan = _.pickBy({
    _id: String(history._id), //String casting required for bencode, else ObjectId
    file: history.fileId,
    action: history.action,
    date: history.date,
    user: history.user,
    shared: history.shared,
    ipAddress: history.ipAddress,
    meta: history.meta,
  })

  const sha256sum = crypto.createHash('sha256')
  sha256sum.update(bencode.encode(histCan))
  return sha256sum.digest('hex')
}

module.exports = {
  historysha256sum,
}
