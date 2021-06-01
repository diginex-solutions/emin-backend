const InputsSchema = require('./inputsSchema')
const mongoose = require('mongoose')
const model = 'Template'
const Templateschema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    name: String,
    USID: { type: mongoose.Schema.Types.ObjectId, ref: 'userSpace', index: true },
    inputs: [InputsSchema],
    languages: [
      {
        lang: { type: String, required: true },
        inputs: [InputsSchema],
      },
    ],
  },
  {
    versionKey: false,
  }
)

Templateschema.set('toObject', { getters: true })
Templateschema.set('toJSON', { getters: true })

Templateschema.statics.createTemplate = function (USID, name, inputs, languages) {
  const template = {
    _id: mongoose.Types.ObjectId(),
    USID,
    name,
    inputs,
    languages,
  }
  return this.create(template)
}

Templateschema.statics.listTemplates = function (USID) {
  return this.find({ USID }).lean()
}

Templateschema.statics.getTemplate = function (USID, templateId) {
  return this.findOne({ USID, _id: templateId }).exec()
}

Templateschema.statics.getTemplates = function (USID, templateIds) {
  return this.find({ USID, _id: { $in: templateIds } }).exec()
}

Templateschema.statics.deleteTemplate = function (USID, templateId) {
  return this.findOneAndDelete({ USID, _id: templateId }).exec()
}

Templateschema.statics.modifyTemplate = function (USID, templateId, template) {
  const options = { new: true }
  return this.findOneAndUpdate({ USID, _id: templateId }, { ...template }, options).exec()
}

const Template = mongoose.model(model, Templateschema)
module.exports = Template
