const cError = require('../helper/customError')
const crypto = require('crypto')
const fileSvc = require('./fileSvc')
const userSvc = require('./userSvc')
const log = require('../helper/logger.js').log
const mongoose = require('mongoose')
const History = mongoose.model('History')
const AccessModel = mongoose.model('Access')
const UserModel = mongoose.model('User')
const _ = require('lodash')
const { SpaceService } = require('./spaceSvc');
const spaceSvc = SpaceService.getInstance()

const subDoc = async (hist) => {
  const ownerAccess = await fileSvc.retrieveFile(hist.fileId, hist.USID)
  const document = {
    name: ownerAccess.name,
    extension: ownerAccess.extension,
    path: ownerAccess.path,
  }
  if (!hist.shared) {
    return {
      ...hist,
      document,
    }
  }
  const userIdRemote = await spaceSvc.findUserIdByUserSpace(hist.shared.USID)
  const sharedUser = await userSvc.getUserById(userIdRemote)
  const user = {
    email: sharedUser.email,
    name: sharedUser.name,
    surname: sharedUser.surname,
  }
  return {
    ...hist,
    document,
    shared: {
      ...user,
    },
  }
}

const setFileIdAs = (fileId) => {
  return (hist) => {
    return {
      ...hist,
      fileId,
    }
  }
}

let saveThenStampHistory = async (action, eventTime, fileId, USID, shareId, ipAddress, email, options, notes) => {
  var history = await History.saveHistory(
    action,
    eventTime,
    fileId,
    USID,
    shareId,
    ipAddress,
    email,
    options,
    notes
  )
  return history
}

let getHistoryByUser = async (USID) => {
  const histories = await History.getHistoryByUSID(USID)
  const fileIds = _.uniq(histories.map((hist) => hist.fileId)).filter((i) => i)
  const USIDs = histories.map(h => _.get(h.shared, 'USID')).filter(i => i)
  const userSpaces = await spaceSvc.fetchUserSpacesByIds_(USIDs)
  const userIds = userSpaces.map(us => us.userId)

  const ownerAccesses = await AccessModel.findOwnerByFileIds(fileIds)
  const remoteUsers = await UserModel.listUserByIds(userIds)

  const histsWithFileShared = histories.map((hist) => {
    const ownerAccess = ownerAccesses.find((acc) => String(acc.fileId) === String(hist.fileId))
    const document = ownerAccess
      ? {
          name: ownerAccess.name,
          extension: ownerAccess.extension,
          path: ownerAccess.path,
        }
      : null
    let shared
    if (hist.shared) {
      const userSpace = userSpaces.find(us => String(us._id) === String(hist.shared.USID))
      const remoteUser = remoteUsers.find(u => String(u._id) === String(userSpace.userId))
      const user = {
        email: remoteUser.email,
        name: remoteUser.name,
        surname: remoteUser.surname,
      }
      shared = {
        ...user,
      }
    }
    return {
      ...hist,
      fileId: ownerAccess ? ownerAccess._id : null,
      document,
      shared,
    }
  })
  return histsWithFileShared
}

let getHistoryByFileId = async (USID, accessId) => {
  const access = await fileSvc.retrieveMyAccessById(accessId, USID)
  if (!access) throw new cError.PermissionDeniedException('You do not have access to the file')
  const histories = await History.getHistoryByFileId(access.fileId)
  const USIDs = histories.map(hi => hi.USID).map(String)
  const userSpaces = await spaceSvc.fetchUserSpacesByIds_(USIDs)
  const userIds = userSpaces.map(us => us.userId)
  const users = await UserModel.listUserByIds(userIds)
  histories.map(hi => {
    const userSpace = userSpaces.find(us => String(us._id) === String(hi.USID))
    const user = users.find((u) => String(u._id) === String(userSpace.userId))
    hi.user = _.pick(user, ['email', 'name', 'surname'])
  })
  const histListWithSub = await Promise.all(histories.map(subDoc))
  const setFileId = setFileIdAs(accessId)
  return histListWithSub.map(setFileId)
}

module.exports = {
  getHistoryByUser,
  getHistoryByFileId,
  saveThenStampHistory,
}
