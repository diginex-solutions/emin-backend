'use strict';

var dbm;
var type;
var seed;

const _ = require('lodash')
const mongoose = require('mongoose');

const filesCol = 'files'
const AZURE_STORAGE = process.env.AZURE_STORAGE //diginextrustdev
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
  const files = await db._find(filesCol, {"versions.status": {$gt: -1}, "versions.storage": {$eq: null}})

  for (const file of files) {
    const versions = file.versions.map(ver => {
      if (!ver.storage) {
        console.log('file._id', file._id);
        ver.storage = `https://${AZURE_STORAGE}.blob.core.windows.net/files/${ver.uploader}/${ver._id}`
      }
      return ver
    })
    file.versions = versions
    const updateOptions = { // update template to have inputs and languages field
      query: {_id: file._id},
      update: file,
      options: {}
    }
    await db._run('update', filesCol, updateOptions)
  }
}

exports.up = async function(db, callback) {
  console.log('process.env.AZURE_STORAGE', process.env.AZURE_STORAGE);
  if (AZURE_STORAGE) {
    await fileVersioning(db, callback)
  } else {
    throw '***please set AZURE_STORAGE before run***'
  }
  return null;
};

exports.down = async function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
