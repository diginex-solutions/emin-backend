'use strict';
var mongoose = require('mongoose');
var dbm;
var type;
var seed;

const uuidv4 = require('uuid/v4');
const _ = require('lodash')

const { INPUT_SCHEMA_TYPE } = require('../src/constants')

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

const langs = ['en', 'hi', 'ur']
const templateC = "templates"
const formC = "forms"
const widgetC = "widgets"

async function renameFormInputToAnswer(db) {
  const optionsRemoveInputField = {
    query: {},
    update: { $unset: { "inputs.$[].options": true, "inputs.$[].label": "", "inputs.$[].type": "" }},
    options: {}
  }
  await db._run('updateMany', formC, optionsRemoveInputField)

  const optionsRenameForm = {
    query: {},
    update: { $rename: { "inputs": "answers" } },
    options: {}
  }
  await db._run('updateMany', formC, optionsRenameForm)
}

async function genUUIDofInputAndOptionsThenReplaceOthers(db) {
  const templates = await db._find(templateC, {})
  await Promise.all(templates.map(async template => {
    const inputs = []
    const languagesInputs = []
    const changes = []
    template.inputs.map( inputOld => {
      const inputId = uuidv4()
      const isOptionType = inputOld.type === INPUT_SCHEMA_TYPE.SELECT || inputOld.type === INPUT_SCHEMA_TYPE.MULTISELECT
      const options = !isOptionType ? []: inputOld.options.map(optStr => {//String => {_id, label}
        return {_id: uuidv4(), label: optStr}
      })
      
      const inputBase = {
        value: null,
        _id:  inputId,
        options
      }
      const inputItem = {
        ...inputBase,
        type: inputOld.type
      }
      
      const langInputItem = {
        ...inputBase,
        label: inputOld.label,
      }

      const change = {
        templateId: (template._id),
        inputOldId: (inputOld._id),
        inputNewId: String(inputId),
      } // add options if appliable

      inputs.push(inputItem)
      languagesInputs.push(langInputItem)
      changes.push(change)
    })

    const languages = langs.map(lang => { // construct languages
      return {
        _id: mongoose.Types.ObjectId(),
        lang,
        inputs: languagesInputs
      }
    })

    const optionsUpdateTemplate = { // update template to have inputs and languages field
      query: {_id: template._id},
      update: {
        ..._.pick(template, ['_id', 'userId', 'name']),
        inputs,
        languages
      },
      options: {}
    }
    const newTemplate = await db._run('update', templateC, optionsUpdateTemplate)

    // for each change
    await Promise.all(changes.map(async ch => { 
      const update = { $set: { "inputs.$._id" : ch.inputNewId } }
      const optionsUpdateForm = {
        query: {templateId: ch.templateId, "inputs._id": ch.inputOldId},
        update,
        options: {}
      }
      const formUpdate = await db._run('updateMany', formC, optionsUpdateForm)// inputs ObjectId -> UUID


      const updateWidget = { $set: { "fieldId" : ch.inputNewId } }
      const optionsUpdateWidget = {
        query: {templateId: ch.templateId, "fieldId": ch.inputOldId},
        update: updateWidget,
        options: {}
      }
      const widgetUpdate = await db._run('updateMany', widgetC, optionsUpdateWidget)// widget ObjectId -> UUID

    }))
  }))
  
  return 0
  
}



async function answerOptionStrToUUID(db){
  // form.inputs.options: for each option, get UUID (type: select, multiselect)
  // templateId, fieldId, value -> UUID
  const findUUIDofAnswers = (template, fieldId, value) => {
    const [langEn,] = template.languages.filter(lang => lang.lang == 'en')
    const [input,] = langEn.inputs.filter(input => input._id == fieldId)
    const [optionUUID] = input.options.filter(opt => opt.label === value)
    return optionUUID._id
  }

  const forms = await db._find(formC, {})
  await Promise.all(forms.filter(form => form.status === "accepted" && form.inputs.length).map(async form => {
    const inputToBeTransform = form.inputs.
    filter(input => input.type == "select" || input.type == "multiselect").
    filter(input => input.value != null)

    for (const input of inputToBeTransform) {
      const valueRaw = JSON.parse(input.value)
      const templates = await db._find(templateC, {_id: mongoose.Types.ObjectId(form.templateId)})
      const template = templates[0]
      let newValue
      if ( Array.isArray(valueRaw) ) {
        newValue = valueRaw.map(value => findUUIDofAnswers(template, input._id, value))
      } else {
        newValue = findUUIDofAnswers(template, input._id, valueRaw)
      }
      const updateForm = { $set: { "inputs.$.value" : JSON.stringify(newValue) } }
      const optionsUpdateForm = {
        query: {_id: form._id, "inputs._id": input._id},
        update: updateForm,
        options: {}
      }
      await db._run('updateMany', formC, optionsUpdateForm)
    }

  }))
}

exports.up = async function(db) {
  await genUUIDofInputAndOptionsThenReplaceOthers(db)
  await answerOptionStrToUUID(db)
  await renameFormInputToAnswer(db)
  return null;
};
// change forms.inputs._id accordingly
// rename form.inputs to form.answers
// item in options need to be transformed into UUID
// check every field ID in widget exists in template table
exports.down = function(db) {
  return null;
};

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports._meta = {
  "version": 1
};
