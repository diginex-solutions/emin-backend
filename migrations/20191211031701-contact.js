'use strict';

var dbm;
var type;
var seed;

const _ = require('lodash')

const filesC = 'files'
const sharingsC = 'sharings'
const usersC = 'users'
const contactsC = 'contacts'
/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

const createContactFromSharing = async function(db, callback) {
  const sharings = await db._find(sharingsC, {})
  for (const sharing of sharings) {
    const files = await db._find(filesC, {_id: sharing.fileId})
    if (files && files.length === 1) {
      const file = files[0]
      const sharedUsers = await db._find(usersC, {email: sharing.email})
      let sharedUser
      if (sharedUsers && sharedUsers.length) {
        sharedUser = sharedUsers[0]
      } else {
        const dummyUser = {
          email: sharing.email,
          isRegistered: false
        }
        const commandResult = await db.insert(usersC, dummyUser)
        if(commandResult.result.n != 1 || commandResult.result.ok != 1) {
          throw new Error(`dummyUser failed to create: ${dummyUser}`)
        }
        sharedUser = commandResult.ops[0]
      }
      const existingContact = await db._find(contactsC, {
        ownerId : file.user,
        userId : sharedUser._id
      })

      if (!(existingContact && existingContact.length)){
        const contact = {
          ownerId : file.user,
          userId : sharedUser._id,
          lang : "en",
          name: sharing.name,
          surname: sharing.surname,
          company: sharing.company,
        }
        db.insert(contactsC, contact)
      }
    } else {
      throw new Error(`error when fetching file. sharing:${sharing} files:${files}`)
    }
  }
}

exports.up = async function(db, callback) {
  await createContactFromSharing(db, callback)
  return null;
};

exports.down = async function(db) {
  const command = 'remove'
  const collection = usersC
  const deleteRow = {isRegistered: false}
  const options = deleteRow
  const rollbackResult = await db._run(command, collection, options)
  db.dropCollection(contactsC)
  return null;
};

exports._meta = {
  "version": 1
};
