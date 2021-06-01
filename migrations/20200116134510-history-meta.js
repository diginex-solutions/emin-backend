'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

const formsC = 'forms'
const historiesC = 'histories'

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
      if(property === keyOld){
        obj[keyNew] = obj[property];
        // delete obj[property];
      } else if (typeof obj[property] == "object") {
        replaceKeyName(obj[property], keyOld, keyNew);
      }
    }
  }
}

const recoverHistMeta = async function(db) {
  const forms = await db._find(formsC, {})
  for (const form of forms) {
    const histories = await db._find(historiesC, {shared: form.sharingId})
    for (const hist of histories) {
      // console.log('hist', hist);
      if (!hist.meta) {
        const form_ = objReplaceKeyName(form, '_id', 'id')
        if (hist.action == "action_accepted" || hist.action == "action_rejected") {
          form_.status = 'received'
          form_.dateFilled = null
        } else if (hist.action == "action_received") {
          form_.status = "pending"
          form_.dateFilled = null
          form_.dateReceived = null
        } else if (hist.action == "action_created") {
          form_.dateFilled = null
          form_.dateReceived = null
        }

        const meta = JSON.stringify(form_)
        const updateMeta = { $set: {meta: meta }}
        const optionsUpdateMeta = {
          query: {_id: hist._id},
          update: updateMeta,
          options: {}
        }
        const metaUpdate = await db._run('update', historiesC, optionsUpdateMeta)

      }
    }

  }
}


exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async function(db) {
  await recoverHistMeta(db)
  return null;
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
