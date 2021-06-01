module.exports = {}
const { constant } = require('lodash')
const { Users } = require('mandrill-api')
var mongoose = require('mongoose')
const Document = mongoose.model('Document')
const DocumentContact = mongoose.model('DocumentContact')
const DocumentNotification = mongoose.model('DocumentNotification')
const constants = require('../constants')
const {ConnService} = require('../services/connSvc')
const { SpaceService } = require('./spaceSvc')
const spaceSvc = SpaceService.getInstance()
const User = mongoose.model('User')
const BlockChainHistory = mongoose.model('BlockChainHistory')
const smartContractService = require('./smartContract')
const config = require('../config')
const emailSvc = require('./emailSvc')

const getDocumentContact = async () => {
    const suplier = await User.getByRole('supplier')
    if (!suplier) return null
    const userId = suplier._id
    let result = []
    let lstContact = []
    const lstDocumentContact = await DocumentContact.getAll()
    try{
        const userSpace = await spaceSvc.findUserSpace(userId)
        let connSvc = new ConnService();
        const connections = await connSvc.getAllConn(userSpace._id)
        if (connections && connections.length > 0) {
          const userIds = connections.map(c => c.userId)
          lstContact = await User.listUserByIds(userIds)
          lstContact.forEach(element => {
              const con = connections.find(x=>x.userId.equals(element._id))
              if(con){
                element.isValid = con.valid
              }
          });
        }
      } catch (e){
        console.log(e)
    }
    lstContact.forEach(element => {
        let obj = {
            userId: element._id,
            email: element.email,
            name: element.name,
            surname: element.surname,
            phoneNumber: element.phoneNumber,
            isValid: element.isValid
        }
        const docContact = lstDocumentContact.find(x=>x.userId == element._id)
        if (docContact){
            obj.lastUpdatedTime = docContact.lastUpdatedTime
            obj.lastUploadedTime = docContact.lastUploadedTime
        }
        result.push(obj)
    });
    return result
}

const getDocumentContactDetail = async (contactId, userId) => {
    const contact = await DocumentContact.getById(contactId)
    const user = await User.getUserById(contactId)
    const userSpace = await spaceSvc.findUserSpace(userId)
    let connSvc = new ConnService();
    const connections = await connSvc.getAllConn(userSpace._id)
    const con = connections.find(x=>x.userId == contactId)
    let obj = {
        userId: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        phoneNumber: user.phoneNumber,
    }
    if (con){
        obj.isValid = con.valid
    }
    if (contact){
        obj.lastUpdatedTime = contact.lastUpdatedTime,
        obj.lastUploadedTime = contact.lastUploadedTime
    }
    return obj
}

const uploadDocument = async (uploadedBy, shareTo, file, docType) => {
    let ids = []
    for(let i =0; i< file.length; i++){
        const doc = {
            _id:  mongoose.Types.ObjectId(),
            name: file[i].originalname,
            documentType: docType,
            uploadedAt: new Date(),
            updatedAt: new Date(),
            uploadedBy: uploadedBy,
            status: constants.DOCUMENT_STATUS.notShared,
            sharedTo: shareTo,
            url: file[i].url,
        }
        ids.push(doc._id)
        const message = "Upload new document.";
        //const tezosOpHash = await smartContractService.setChildRecord(constants.HISTORY_ACTION.upload, message, doc.name, shareTo, constants.DOCUMENT_STATUS.notShared, doc.uploadedAt, config.tezos.contractAddress);
        const tezosOpHash = constants.TEZOS_HASH;
        const blockChainHistory = {
            _id:  mongoose.Types.ObjectId(),
            documentId: doc._id,
            date: new Date(),
            uploadedBy: uploadedBy,
            status: constants.DOCUMENT_STATUS.notShared,
            shareTo: shareTo,
            tezosOpHash: tezosOpHash,
            action: constants.HISTORY_ACTION.upload,
            message: message,
            name: doc.name
        }
        await BlockChainHistory.saveBlockChainHistory(blockChainHistory);
        await Document.createNew(doc)
    }
    await DocumentContact.updateUploadedTime(shareTo)
    return await Document.getByIds(ids)
}

const shareDocument = async (docId, message) => {
    await Document.shareDocument(docId, message)
    const doc = await Document.getById(docId)
    await DocumentContact.updateUpdatedTime(doc.sharedTo)
    //create noti
    const noti = {
        _id: mongoose.Types.ObjectId(),
        ownerId: doc.sharedTo,
        documentId: doc._id,
        uploadedBy: doc.uploadedBy,
        status: constants.DOCUMENT_STATUS.shared,
        createdAt: new Date(),
        isRead: false,
        sharedAt: new Date(),
        sharedMessage: message,
    }
    //upload status to blockchain
    // const tezosOpHash = await smartContractService.setChildRecord(
    //     constants.HISTORY_ACTION.share, 
    //     message, 
    //     doc.name,
    //     doc.sharedTo,
    //     constants.DOCUMENT_STATUS.shared,
    //     noti.createdAt,
    //     config.tezos.contractAddress
    // );
    const tezosOpHash = constants.TEZOS_HASH;
    const blockChainHistory = {
        _id:  mongoose.Types.ObjectId(),
        documentId: docId,
        date: new Date(),
        uploadedBy: doc.uploadedBy,
        status: constants.DOCUMENT_STATUS.shared,
        sharedTo: doc.sharedTo,
        tezosOpHash: tezosOpHash,
        action: constants.HISTORY_ACTION.share,
        message: message,
        name: doc.name

    }
    await BlockChainHistory.saveBlockChainHistory(blockChainHistory);
    await DocumentNotification.createNew(noti);
    //send share email
    const remote = await User.getUserById(doc.uploadedBy)
    const owner = await User.getUserById(doc.sharedTo)
    const email = owner.email
    const name = remote.name
    const surname = remote.surname
    const lang = constants.getSupportLang(remote.lang)
    const link = constants.APP_CONFIG.notificationLink
    const username = `${owner.name} ${owner.surname}`
    const fileName = doc.name
    const isVerify = true
    emailSvc.sendEmail(email, link, fileName, name, surname, username, isVerify, lang)
}

const deleteDocument = async (docId) => {
    //delete doc
    const doc = await Document.getById(docId)
    //update last updated time
    await DocumentContact.updateUpdatedTime(doc.sharedTo)
    //delete noti
    await DocumentNotification.deleteByDocId(docId)
    await Document.deleteById(docId)
}

const getDocumentNoti = async (userId, skip, limit) => {
    const data = await DocumentNotification.getByOwner(userId, skip, limit)
    if (data){
        const lstUploaderId = data.map(x=>x.uploadedBy)
        if (lstUploaderId && lstUploaderId.length > 0){
            const lstUploader = await User.listUserByIds(lstUploaderId)
            const lstDocId = data.map(x=>x.documentId)
            const lstDoc = await Document.getByIds(lstDocId)
            let result = []
            for(var i =0 ; i< data.length; i++){
            let noti = data[i]  
                const user = lstUploader.find(x=>x._id == noti.uploadedBy)
                noti.uploader = {
                    _id: user._id,
                    email: user.email,
                    name: user.name,
                    surname: user.surname
                }
                const doc = lstDoc.find(x=>x._id == noti.documentId)
                if (doc){
                    noti.docName = doc.name
                    noti.url = doc.url
                    result.push(noti)
                }
            }
            return result
        } else{
            return data
        }
    }
    return null
}

const getDocumentNotiDetails = async (notiId) => {
    await DocumentNotification.markRead(notiId)
    let noti = await DocumentNotification.getById(notiId)
    if (!noti) return null
    let doc = await Document.getById(noti.documentId)
    const uploadedBy = await User.getUserById(doc.uploadedBy)
    doc.uploader = {
        id: uploadedBy._id,
        email: uploadedBy.email,
        name: uploadedBy.name,
        surname: uploadedBy.surname
    }
    noti.document = doc
    return noti
}

const verifyDocument = async (notiId, docId, accept, message, thirdPartyConsent) => {
    //update doc
    const status = accept? constants.DOCUMENT_STATUS.verified : constants.DOCUMENT_STATUS.rejected
    const doc = await Document.verifyDocument(docId, accept, message, thirdPartyConsent)
    //update last updated time
    await DocumentContact.updateUpdatedTime(doc.sharedTo)
     //upload status to blockchain
     //const tezosHas = await smartContractService.setChildRecord(constants.HISTORY_ACTION.verify, message, doc.name, doc.sharedTo, status, new Date(), config.tezos.contractAddress);
     const tezosHas = constants.TEZOS_HASH;
     const blockChainHistory = {
         _id:  mongoose.Types.ObjectId(),
         documentId: doc._id,
         date: new Date(),
         uploadedBy: doc.uploadedBy,
         status: status,
         shareTo: doc.sharedTo,
         tezosOpHash: tezosHas,
         action: constants.HISTORY_ACTION.verify,
         message: message,
         name: doc.name
     }
     await BlockChainHistory.saveBlockChainHistory(blockChainHistory); 
    //update noti
    await DocumentNotification.updateStatus(notiId, status, message, thirdPartyConsent)
}

const getDocumentByUser = async (userId) => {
    const data = await Document.getByUser(userId);
    return data
}

const countUnRead = async (ownerId) => {
    const result = await DocumentNotification.count({ ownerId: ownerId, isRead: false })
    return result
}

module.exports.getDocumentContact = getDocumentContact
module.exports.uploadDocument = uploadDocument
module.exports.shareDocument = shareDocument
module.exports.deleteDocument = deleteDocument
module.exports.getDocumentNoti = getDocumentNoti
module.exports.getDocumentNotiDetails = getDocumentNotiDetails
module.exports.verifyDocument = verifyDocument
module.exports.getDocumentByUser = getDocumentByUser
module.exports.countUnRead = countUnRead
module.exports.getDocumentContactDetail = getDocumentContactDetail


