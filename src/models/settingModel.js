const mongoose = require('mongoose')
const { jsonStringifyNullable } = require('../helper/util')
const model = 'Setting'
const SettingSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    value: { type: String, set: jsonStringifyNullable, get: JSON.parse, default: null },
  },
  {
    versionKey: false,
  }
)

SettingSchema.set('toObject', { getters: true })
SettingSchema.set('toJSON', { getters: true })

SettingSchema.statics.addSetting = function (userId, setting) {
  const settingObj = {
    _id: mongoose.Types.ObjectId(),
    userId,
    ...setting,
  }
  return this.create(settingObj)
}

SettingSchema.statics.updateSetting = function (userId, settingId, setting) {
  const options = { new: true }
  const settingObj = {
    userId,
    ...setting,
  }
  return this.findOneAndUpdate({ userId, _id: settingId }, { ...settingObj }, options).exec()
}

SettingSchema.statics.deleteSetting = function (userId, settingId) {
  return this.findOneAndDelete({ userId, _id: settingId }).exec()
}

SettingSchema.statics.listSettingByType = function (userId, type) {
  return this.find({ userId, type }).exec()
}

SettingSchema.statics.getSettingByName = function (userId, name, type) {
  return this.findOne({ userId, name, type }).exec()
}

const Setting = mongoose.model(model, SettingSchema)
module.exports = Setting
