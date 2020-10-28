'use strict';

var dbm;
var type;
var seed;

const mongoose = require('mongoose');
const _ = require('lodash')

const accessesC = 'accesses'
const filesC = 'files'
const sharingsC = 'sharings'
const usersC = 'users'
const contactsC = 'contacts'
const formsC = 'forms'
const historiesC = 'histories'


const getExtension = (name, extension) => {
  const ext = extension ? `.${extension}` : '';
  const filename = `${name}${ext}`
  return filename
}

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

const createSharingAccess = async function(db, callback) {
  //for each sharings, create a doc in access
  //    find file by sharing.fileId
  //    find user by sharing.userId. If no user found, create a dummy user
  //    find contact by ownerId: file.user, userId: sharedUser._id
  //    create a doc in access as:
  //        formId = sharing.formId
  //        contactId = contact._id
  //        path = /Shared
  //    change form.sharingId from sharing._id to access._id
  //    change hist.sharingId from sharing._id to access._id

  const sharings = await db._find(sharingsC, {})
  for (const sharing of sharings) {
    const files = await db._find(filesC, {_id: sharing.fileId})
    if (files && files.length) {
      const file = files[0]
      if (file.isFolder) {
        throw new Error(`Folders aren't supposed to be shared yet. ${file}`)
      }
      const sharedUsers = await db._find(usersC, {email: sharing.email})

      let sharedUser
      if (sharedUsers && sharedUsers.length) {
        sharedUser = sharedUsers[0]
      } else {
        throw new Error(`User not found. email:${sharing.email}, users:${sharedUsers}`)
      }

      const contacts = await db._find(contactsC, {ownerId: file.user, userId: sharedUser._id})
      let contact
      if (contacts && contacts.length) {
        contact = contacts[0]
      } else {
        throw new Error(`Contact not found. ownerId: ${JSON.stringify(file)}, ownerId: ${file.user} userId: ${sharedUser._id}`)
      }

      const filename = getExtension(file.name, file.extension)

      const permissions = sharing.formId ? sharing.formId.map(formId => {
        return {
          right: 1,
          type: "FORM",
          ref: formId
        }
      }) : [{
        right: 1,
        type: "CONTACT",
        ref: contact._id
      }]
      // console.log(sharing._id, ' permissions: ', permissions);

      const accessRow = {
        // _id: mongoose.Types.ObjectId(),
        fileId: file._id,
        userId: sharedUser._id,
        type: 'sharing',
        active: true,
        name: file.name,
        extension: file.extension,
        path: '/Shared',
        fullpath: `/shared/${filename}`,
        createdAt: file.uploaded,
        modifiedAt: file.uploaded,
        deletedAt: undefined,
        originalPath: undefined,
      }

      const accessDocQuery = { fileId: sharing.fileId, userId: sharedUser._id, type: 'sharing' }
      // upsert access doc, permissions to be pushed to the item if exist
      const updatePermission = { $push: { permissions: {$each: permissions} }, $set: { ...accessRow } }
      const optionsUpdatePermission = {
        query: accessDocQuery,
        update: updatePermission,
        options: {upsert: true}
      }
      const permissionUpdate = await db._run('update', accessesC, optionsUpdatePermission)

      if (!(permissionUpdate.result.n == 1 && permissionUpdate.result.ok == 1)) {
        throw new Error(`Failed to upsert sharing access: ${accessRow}, result: ${permissionUpdate}`)
      }

      const accesses = await db._find(accessesC, accessDocQuery)
      if (accesses && accesses.length !== 1) {
        throw new Error(`Failed to find access: ${accessDocQuery}`)
      }
      const access = accesses[0]

      // change form.sharingId from sharing._id to access._id
      if (sharing.formId && sharing.formId.length) {
        const updateFormSharingId = { $set: { sharingId: access._id } }
        const optionsUpdateFormSharingId = {
          query: { sharingId: sharing._id },
          update: updateFormSharingId,
          options: {}
        }
        const formSharingIdUpdate = await db._run('updateMany', formsC, optionsUpdateFormSharingId)
        // if (!(formSharingIdUpdate.result.n == 1 && formSharingIdUpdate.result.ok == 1)) {
        //   throw new Error(`Failed to update form.sharingId from : ${sharing._id} to: ${access._id}, result: ${formSharingIdUpdate}`)
        // }

      }
      // change hist.sharingId from ...

      const updateHistSharingId = { $set: { shared: access._id } }
      const optionUpdateHistSharingId = {
        query: { shared: sharing._id },
        update: updateHistSharingId,
        options: {}
      }
      const histSharingIdUpdate = await db._run('updateMany', historiesC, optionUpdateHistSharingId)
      // if (!(histSharingIdUpdate.result.n == 1 && histSharingIdUpdate.result.ok == 1)) {
      //   throw new Error(`Failed to update hist.shared from : ${sharing._id} to: ${access._id}, result: ${histSharingIdUpdate}`)
      // }

    }
  }
}

const createOwnerAccess = async function(db, callback) {
  // for each files,
  //    if file is folder
  //        create `owner` type doc in `accesses` col. with {userId, path, name} fields from files.
  //        remove the doc from `files`
  //    if file is file
  //        create `owner` type doc in `accesses` col. with {fileId, userId, path, name} fields from files.
  //        remove 'path', 'fullpath', 'name', 'extension', 'user', 'recipients'
  const files = await db._find(filesC, {})
  for (const file of files) {
    const accessRow = {
      fileId: file._id,
      userId: file.user,
      type: 'owner',
      active: true,
      name: file.name,
      extension: file.extension,
      path: file.path,
      fullpath: file.fullpath,
      createdAt: file.uploaded,
      modifiedAt: file.uploaded,
      deletedAt: undefined,
      originalPath: undefined,
      permissions: [],
    }

    const acc = await db.insert(accessesC, accessRow)
    if (acc.result.n == 1 && acc.result.ok == 1) {
      const command = 'update'
      const collection = filesC
      const update = _.omit(file, ['path', 'fullpath', 'name', 'extension', 'user', 'recipients']);
      const options = {
        query: {_id: file._id},
        update,
        options: {}
      }
      const newFile = await db._run(command, collection, options)
      if (!(newFile.result.n === 1 && newFile.result.ok === 1)) {
        console.log('transform failed', option.query._id, file.user, file.fullpath);
      }
    } else {
      throw new Error(`Failed to create an owner access: ${accessRow}, result: ${acc}`)
    }
  }
}

const preflightCheck = async function(db, callback) {
  // check if reversed path is occupied
  const checkShareds = await db._find(filesC, {fullpath: '/shared'})
  const checkArchiveds = await db._find(filesC, {fullpath: '/archived'})
  if (checkShareds.length === 0 && checkArchiveds.length === 0) {
    return true
  } else {
    return false
  }

}
const createDefaultFolders = async function(db, callback, path) {
  const users = await db._find(usersC, {isRegistered: {$ne: false}})
  const fileList = [], accessList = []
  users.map(u => {
    const fileId = mongoose.Types.ObjectId()
    const fileRow = {
      _id: fileId,
      isFolder: true,
      uploaded: u.createdAt,
      size: 0,
      archived: false,
      storage: '',
      status: -1
    }

    const accessRow = {
      _id : mongoose.Types.ObjectId(),
      fileId : fileId,
      userId : u._id,
      type : "owner",
      active : true,
      name : "",
      extension : "",
      path : path,
      fullpath : path.toLowerCase(),
      createdAt : u.createdAt,
      modifiedAt : u.createdAt,
      permissions : [],
    }
    fileList.push(fileRow)
    accessList.push(accessRow)
  })
  const files = await db.insert(filesC, fileList)

  if (files.result.n != fileList.length) {
    throw new Error(`Error occur creating default folders, ${files}`)
  }

  const accesses = await db.insert(accessesC, accessList)
  if (accesses.result.n != accessList.length) {
    throw new Error(`Error occur creating default folders, ${access}`)
  }

}

const mup = async function(db, callback) {
  // create two folder for every existing users /Shared, /Archived
  // archived files path prefix /Archived
  // shared files path prefix with /Shared
  let isOk = await preflightCheck(db, callback)
  if (isOk) {
    let accessCollection = await db.createCollection(accessesC)
    let sharingAccesses = await createSharingAccess(db, callback)
    let ownerAccesses = await createOwnerAccess(db, callback)
    let sharedFolders = await createDefaultFolders(db, callback, '/Shared')
    let archivedFolders = await createDefaultFolders(db, callback, '/Archived')
  }
  // remove sharing data
};

const mdown = async function(db, callback) {
  db.dropCollection(accessesC)
  return null;
};

exports.up = mup

exports.down = mdown

exports._meta = {
  "version": 1
};

