module.exports = {}
var mongoose = require('mongoose')
const ChecklistUpload = mongoose.model('ChecklistUpload')
const ChecklistSharing = mongoose.model('ChecklistSharing')
const ChecklistNotification = mongoose.model('ChecklistNotification')
const ChecklistHistory = mongoose.model('ChecklistHistory')
const User = mongoose.model('User')
const emailSvc = require('./emailSvc')
const constants = require('../constants')
const feedSvc = require('../services/feedSvc')
const userSvc = require('../services/userSvc')
const ChecklistDocument = mongoose.model('ChecklistDocument')

const extractFilename = (filename) => {
    let name = filename.lastIndexOf('.') == -1 ? filename : filename.substring(0, filename.lastIndexOf('.'))
    const extension = filename.lastIndexOf('.') == -1 ? '' : filename.substring(filename.lastIndexOf('.') + 1)
    name = filename.lastIndexOf('.') + 1 == filename.length ? name.concat('.') : name
    return [name, extension]
  }

const uploadFiles = async (ownerId, documentType, files) => {
    //insert files
    const currentTime = new Date()
    let lstFiles = []
    for(let i =0; i< files.length; i++){
        //const [name, extension] = extractFilename(files[i].originalname)
        const file = {
            _id: mongoose.Types.ObjectId(),
            documentType: documentType, 
            ownerId: ownerId,
            name: files[i].originalname,
            path: files[i].url,
            uploadedAt: currentTime,
            blobName: files[i].blobName,
            shaHash: files[i].shaHash,
            blobSize: files[i].blobSize
          }
        lstFiles.push(file)
        await ChecklistUpload.createNew(file)
    }
    //insert history
    const history = {
      actor: ownerId,
      action: constants.CHECKLIST_ACTION.upload,
      files: lstFiles,
      updatedAt: currentTime
    }
    const status = constants.CHECKLIST_STATUS.notShared
    let chkHistory = await ChecklistHistory.getByOwnerAndDocumentType(ownerId, documentType)
    if (!chkHistory){
      let histories = []
      histories.push(history)
      chkHistory = {
        _id: mongoose.Types.ObjectId(),
        ownerId: ownerId,
        documentType: documentType,
        status: status,
        times: 1,
        shared: false,
        histories: histories
      }
      await ChecklistHistory.createNew(chkHistory)
    } else{
      //update status
      await ChecklistHistory.update(chkHistory._id, status, chkHistory.times? chkHistory.times + 1 : 1, false)
      //update histories
      await ChecklistHistory.addHistory(chkHistory._id, history)
    }

    const data = {
      documentType: documentType,
      status: constants.CHECKLIST_STATUS.notShared,
      files: await ChecklistUpload.getByOwnerAndDocumentType(ownerId, documentType)
    }
    return data
}

const deleteFile = async (fileId) => {
  //delete file
  const file = await ChecklistUpload.deleteById(fileId)
  if (file){
    let lstFiles = []
    lstFiles.push(file)
    //update history
    const lstOwnerFiles = await ChecklistUpload.getByOwnerAndDocumentType(file.ownerId, file.documentType)
    const lstActiveFiles = lstOwnerFiles.filter(x=> !x.deletedAt)
    const status = lstActiveFiles.length > 0? constants.CHECKLIST_STATUS.notShared : constants.CHECKLIST_STATUS.notUploaded
    let history = {
      actor: file.ownerId,
      action: constants.CHECKLIST_ACTION.delete,
      files: lstFiles,
      updatedAt: new Date()
    }
    let chkHistory = await ChecklistHistory.getByOwnerAndDocumentType(file.ownerId, file.documentType)
    await ChecklistHistory.update(chkHistory._id, status, chkHistory.times + 1, false)
    await ChecklistHistory.addHistory(chkHistory._id, history)
  }
}

const getHistory = async (ownerId, documentType) => {
  return await ChecklistHistory.getByOwnerAndDocumentType(ownerId, documentType)
}

const shareFile = async (ownerId, documentType, remoteIds, request) => {
  const lstFiles = await ChecklistUpload.getByOwnerAndDocumentType(ownerId, documentType)
  const lstActiveFiles = lstFiles.filter(x=> !x.deletedAt)
  const owner = await User.getUserById(ownerId)
  for(let i = 0; i< remoteIds.length; i++){
    const remoteId = remoteIds[i]
    //insert sharing
    const sharing = {
      _id: mongoose.Types.ObjectId(),
      ownerId: ownerId,
      remoteId: remoteId,
      documentType: documentType,
      status: constants.CHECKLIST_STATUS.notVerify,
      sharedAt: new Date(),
      files: lstActiveFiles,
      request: request,
    }
    await ChecklistSharing.createNew(sharing)
     //update history
     let history = {
      actor: ownerId,
      action: constants.CHECKLIST_ACTION.share,
      files: lstActiveFiles,
      updatedAt: new Date()
    }
    let chkHistory = await ChecklistHistory.getByOwnerAndDocumentType(ownerId, documentType)
    await ChecklistHistory.addHistory(chkHistory._id, history)
    await ChecklistHistory.update(chkHistory._id, constants.CHECKLIST_STATUS.notVerify, chkHistory.times, true)
    //insert notification
    const noti = {
      _id: mongoose.Types.ObjectId(),
      ownerId: remoteId,
      remoteId: ownerId,
      documentType: documentType,
      notificationType: constants.NOTIFICATION_TYPE.share,
      action: constants.NOTIFICATION_TYPE.share,
      createdAt: new Date(),
      sharingId: sharing._id,
      times: chkHistory.times,
      isRead: false,
    }
    await ChecklistNotification.createNew(noti)
    //send share email
    const remote = await User.getUserById(remoteId)
    const email = remote.email
    const name = remote.name
    const surname = remote.surname
    const lang = constants.getSupportLang(remote.lang)
    const link = constants.APP_CONFIG.notificationLink
    const username = `${owner.name} ${owner.surname}`
    const fileName = documentType
    const isVerify = true
    emailSvc.sendEmail(email, link, fileName, name, surname, username, isVerify, lang)  
  }
}

const getNotifications = async (ownerId, skip, limit) => {
  let notis = await ChecklistNotification.getByOwner(ownerId, skip, limit)
  const lstUserIds = notis.map(x=>x.remoteId)
  const lstUser = await User.listUserByIds(lstUserIds)
  const lstSharingIds = notis.map(x=>x.sharingId)
  const lstSharing = await ChecklistSharing.getByIds(lstSharingIds)
  let result = []
  for(var i =0 ; i< notis.length; i++){
    let noti = notis[i]  
    const user = lstUser.find(x=>x._id == noti.remoteId)
    noti.remote = {
      _id: user._id,
      email: user.email,
      name: user.name,
      surname: user.surname
    }
    const sharing = lstSharing.find(x=>x._id == noti.sharingId)
    noti.share = sharing
    result.push(noti)
  }
  return result
}

const getNotificationDetail = async (notiId) => {
  await ChecklistNotification.markRead(notiId)
  let noti = await ChecklistNotification.getById(notiId)
  let sharing = await ChecklistSharing.getById(noti.sharingId)
  let files = await ChecklistUpload.getByIds(sharing.files.map(x=>x._id))
  const remote = await User.getUserById(noti.remoteId)
  const owner = await User.getUserById(noti.ownerId)
  const fileOwner = await User.getUserById(sharing.ownerId)
  noti.fileOwner = {
    _id: fileOwner._id,
    email: fileOwner.email,
    name: fileOwner.name,
    surname: fileOwner.surname
  }
  const chkHistory = await ChecklistHistory.getByOwnerAndDocumentType(noti.remoteId, noti.documentType)
  noti.remote = {
    _id: remote._id,
    email: remote.email,
    name: remote.name,
    surname: remote.surname
  }
  noti.owner = {
    _id: owner._id,
    email: owner.email,
    name: owner.name,
    surname: owner.surname
  }

  noti.share = sharing
  noti.files = files
  noti.isLatest = (noti.notificationType === constants.NOTIFICATION_TYPE.share? chkHistory.times === noti.times : true)
  //populate hasNewNoti?
  const countLatestNoti = await ChecklistNotification.count({ ownerId: noti.ownerId, documentType: noti.documentType, createdAt: {$gt: noti.createdAt}})
  noti.hasNewNoti = countLatestNoti > 0
  return noti
}

const verifyDocument = async (sharingId, approve, comment) => {
  //update sharing 
  const sharing = await ChecklistSharing.updateVerify(sharingId, approve? constants.CHECKLIST_STATUS.verified : constants.CHECKLIST_STATUS.rejected, comment)
  //create notification
  const noti = {
    _id: mongoose.Types.ObjectId(),
    ownerId: sharing.ownerId,
    remoteId: sharing.remoteId,
    documentType: sharing.documentType,
    notificationType: approve? constants.NOTIFICATION_TYPE.approve: constants.NOTIFICATION_TYPE.reject,
    action: approve? constants.NOTIFICATION_TYPE.approve: constants.NOTIFICATION_TYPE.reject,
    createdAt: new Date(),
    sharingId: sharing._id
  }
  await ChecklistNotification.createNew(noti)
  //update document status
  let history = {
    actor: sharing.ownerId,
    action: approve? constants.CHECKLIST_ACTION.approve : constants.CHECKLIST_ACTION.reject,
    updatedAt: new Date()
  }
  let chkHistory = await ChecklistHistory.getByOwnerAndDocumentType(sharing.ownerId, sharing.documentType)
  await ChecklistHistory.addHistory(chkHistory._id, history)
  const status = approve? constants.CHECKLIST_STATUS.verified : constants.CHECKLIST_STATUS.rejected
  if (chkHistory.status !== constants.CHECKLIST_STATUS.verified){
    await ChecklistHistory.update(chkHistory._id, status, chkHistory.times, true)
  }
  //ss-50
  if(approve){
    
    const owner = await User.getUserById(sharing.ownerId)
    const remote = await User.getUserById(sharing.remoteId)
    let feed = {
      _id: mongoose.Types.ObjectId(),
      reviewer: {
        id: remote._id,
        name: remote.name,
        photo: remote.photo
      },
      user: {
        id: owner._id,
        name: owner.name,
        photo: owner.photo
      },
      action: 'verified',
      documentType: sharing.documentType,
      createAt: new Date(),
      type: 2
    }
    await feedSvc.addFeed(feed)
    //update profile strength
    await userSvc.updateProfileStrength(owner._id)
  }
}

const getData = async (ownerId) => {
  const lstFiles = await ChecklistUpload.getByOwner(ownerId)
  const lstChecklist = await ChecklistHistory.getByOwner(ownerId)
  let result = []
  for(let i = 0; i< constants.APP_CONFIG.listDocumentTypes.length; i++){
    const docType = constants.APP_CONFIG.listDocumentTypes[i]
    const checklist = lstChecklist.find(x=>x.documentType == docType)
    const files = lstFiles.filter(x=>x.documentType == docType && !x.deletedAt)
    let chk = {
      documentType: docType,
      status: checklist? checklist.status: constants.CHECKLIST_STATUS.notUploaded,
      shared: checklist? checklist.shared: false,
      files: files
    }
    result.push(chk)
  }
  return result
}

const getSeabookData = async (ownerId) => {
  const lstFiles = await ChecklistUpload.getByOwner(ownerId)
  const lstChecklist = await ChecklistHistory.getByOwner(ownerId)
  let result = []
  const lstDocType = await ChecklistDocument.getAll()
  for(let i = 0; i< lstDocType.length; i++){
    const docType = lstDocType[i].documentType
    const checklist = lstChecklist.find(x=>x.documentType == docType)
    const files = lstFiles.filter(x=>x.documentType == docType && !x.deletedAt)
    let chk = {
      documentType: docType,
      status: checklist? checklist.status: constants.CHECKLIST_STATUS.notUploaded,
      shared: checklist? checklist.shared: false,
      files: files,
      expiredAt: lstDocType[i].expiredAt,
      locations: lstDocType[i].locations
    }
    result.push(chk)
  }
  return result
}

const countUnRead = async (ownerId) => {
  const result = await ChecklistNotification.count({ ownerId: ownerId, isRead: false })
  return result
}

module.exports.uploadFiles = uploadFiles
module.exports.deleteFile = deleteFile
module.exports.getHistory = getHistory
module.exports.shareFile = shareFile
module.exports.getNotifications = getNotifications
module.exports.getNotificationDetail = getNotificationDetail
module.exports.verifyDocument = verifyDocument
module.exports.getData = getData
module.exports.countUnRead = countUnRead
module.exports.getSeabookData = getSeabookData
