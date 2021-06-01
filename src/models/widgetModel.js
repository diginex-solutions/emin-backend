const mongoose = require('mongoose')
const model = 'Widget'
const { jsonStringifyNullable } = require('../helper/util')

const Widgetschema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    USID: { type: mongoose.Schema.Types.ObjectId, ref: 'userSpace', index: true, required: true },
    name: { type: String, required: true },
    icon: { type: String },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
    fieldId: { type: String, required: false },
    isYearsFromNow: { type: Boolean, required: true, default: false },
    isPercentage: { type: Boolean, required: true, default: false },
    type: { type: String, required: true },
    groups: [
      {
        _id: false,
        min: { type: String, set: jsonStringifyNullable, default: null }, //array sub-doc no getter (known issue)
        max: { type: String, set: jsonStringifyNullable, default: null },
      },
    ],
  },
  {
    versionKey: false,
  }
)

Widgetschema.set('toObject', { getters: true })
Widgetschema.set('toJSON', { getters: true })

Widgetschema.statics.createWidget = function (USID, widgetBody) {
  const widget = {
    _id: mongoose.Types.ObjectId(),
    USID,
    ...widgetBody,
  }
  return this.create(widget)
}

Widgetschema.statics.listByUSID = function (USID) {
  return this.find({ USID }).exec()
}

Widgetschema.statics.deleteWidget = function (USID, widgetId) {
  return this.findOneAndDelete({ USID, _id: widgetId }).exec()
}

Widgetschema.statics.modifyWidget = function (USID, widgetId, widgetBody) {
  const options = { new: true }
  return this.findOneAndUpdate({ USID, _id: widgetId }, widgetBody, options).exec()
}

Widgetschema.statics.getWidgetById = function (USID, widgetId) {
  return this.findOne({ USID, _id: widgetId }).exec()
}

const Widget = mongoose.model(model, Widgetschema)
module.exports = Widget
