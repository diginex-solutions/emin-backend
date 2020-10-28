'use strict';

var dbm;
var type;
var seed;

const _ = require('lodash')
const mongoose = require('mongoose');

const filesCol = 'files'
const accessesCol = 'accesses'

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

const fileVersioning = async function(db, callback) {
  const files = await db._find(filesCol)
  for (const file of files) {
    const accesses = await db._find(accessesCol, {type: "owner"})
    const verId = mongoose.Types.ObjectId()
    const newFile = {
      "_id" : file._id,
      "isFolder" : file.isFolder,
      "category" : file.category,
      "archived" : file.archived,
      "versionId" : verId,
      "versions" : [
        {
          "_id" : verId,
          "uploader" : accesses[0].userId,
          "uploaded" : file.uploaded,
          "size" : file.size,
          "storage" : file.storage,
          "status" : file.size,
          "hash" : file.hash
        }
      ]
    }
    const updateOptions = { // update template to have inputs and languages field
      query: {_id: file._id},
      update: newFile,
      options: {}
    }
    const filesUpdate = file.versions ? null : await db._run('update', filesCol, updateOptions)

  }
}

const accessVersioning = async function(db, callback) {
  const accesses = await db._find(accessesCol, {type: "sharing"})
  for (const access of accesses) {
    const files = await db._find(filesCol, {_id: access.fileId})
    const file = files[0]
    const newPermission = access.permissions.map( p => {
      if (p.type == 'FORM') {
        return {
          ...p,
          versionId: file.versionId
        }
      }
    }).filter( i => i != null)
    const updateOptions = { // update template to have inputs and languages field
      query: {_id: access._id},
      update: { $set: { permissions: newPermission } },
      options: {}
    }
    const accessesUpdate = await db._run('update', accessesCol, updateOptions)
  }
}

exports.up = async function(db, callback) {
  await fileVersioning(db, callback)
  await accessVersioning(db, callback)
  return null;
};

exports.down = async function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
