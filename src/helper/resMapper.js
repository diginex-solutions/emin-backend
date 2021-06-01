const _ = require('lodash')
const log = require('../helper/logger.js').log
const config = require('../config')

const objReplaceKeyName = (obj, keyOld, keyNew) => {
  if (obj) {
    let pojo = JSON.parse(JSON.stringify(obj))
    replaceKeyName(pojo, keyOld, keyNew)
    return pojo
  } else {
    return obj
  }
}

const replaceKeyName = (obj, keyOld, keyNew) => {
  for (var property in obj) {
    if (obj.hasOwnProperty(property)) {
      if (property === keyOld) {
        obj[keyNew] = obj[property]
        delete obj[property]
      } else if (typeof obj[property] == 'object') {
        replaceKeyName(obj[property], keyOld, keyNew)
      }
    }
  }
}

const removeAllWithKeyName = (obj, keys) => {
  for (var property in obj) {
    if (obj.hasOwnProperty(property)) {
      if (keys.indexOf(property) !== -1) {
        delete obj[property]
      } else if (typeof obj[property] == 'object') {
        removeAllWithKeyName(obj[property], keys)
      }
    }
  }
}

const ethStatusMapping = (f) => {
  f.status = f.status === 4 ? true : false
  return f
}

const formatOwner = (file, userId) => {
  const fowner = file.owner
  const owner = fowner ?
      {
        email: fowner.email,
        name: fowner.name,
        surname: fowner.surname,
      } : undefined
  return {
    ...file,
    permissions: undefined,
    owner: fowner && String(fowner.id) !== String(userId) ? owner : undefined
  }
}

const filesView = (fileResp, decodedUser) => {
  if (Array.isArray(fileResp)) {
    fileResp = fileResp.map(f => formatOwner(f, decodedUser.userId)).map(ethStatusMapping)
  } else {
    fileResp = ethStatusMapping(formatOwner(fileResp, decodedUser.userId))
  }
  removeAllWithKeyName(fileResp, ['fileId', 'accessId', 'versionId'])
  return objReplaceKeyName(fileResp, '_id', 'id')
}

// NOTE: user field at here at the JSON response is referring to `shared` field but not `user` field
// as required as the View being projected. Not to confuse those fields.
const histories = (histories, userDecoded) => {
  return objReplaceKeyName(histories, '_id', 'id')
    .map((history) => {
      history.fileOwner = history.action === 'view' ? history.shared : history.user
      history.user = history.action !== 'view'&& history.shared ? history.shared : undefined
      history.status = history.status == 4 ? true: false
      history.txNetwork = history.txNetwork === 'mainnet' ? '' : history.txNetwork
      if (config.tezos.enable) {
        history.tezosNetwork = config.tezos.network
      }
      return _.omit(history, ['shared', 'sharedEmail', 'ots', 'hash', 'blockHash'])
    })
}

const users = (users) => {
  return objReplaceKeyName(users, '_id', 'id')
}

const cases = (cases) => {
  return objReplaceKeyName(cases, '_id', 'id')
}

module.exports = {
  filesView,
  histories,
  users,
  objReplaceKeyName,
  removeAllWithKeyName,
  cases,
}