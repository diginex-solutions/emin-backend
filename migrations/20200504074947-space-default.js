'use strict';

var dbm;
var type;
var seed;

const _ = require('lodash')
const mongoose = require('mongoose');
const spacesCol = 'spaces'
const userSpacesCol = 'userspaces'
const usersCol = 'users'



/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};


const addDefaultSpace = async function(db) {
  const users = await db._find(usersCol, {})
  const defaultUserSpace = await db._find(spacesCol, {isPrivate: true})

  for (const user of users) {
    const update = {
      _id: user._id,
      userId: user._id,
      role: 'employee',
      valid: true,
      spaceId: defaultUserSpace[0]._id
    }
    await db._run('insert', userSpacesCol, update)
  }

}


exports.up = async function(db) {
  await addDefaultSpace(db)
  return null;
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
