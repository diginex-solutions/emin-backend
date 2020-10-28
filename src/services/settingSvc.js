const mongoose = require('mongoose')
const Setting = mongoose.model('Setting')
const cError = require('../helper/customError')
const { SETTING_TYPE } = require('../constants')

async function addSetting(userId, setting) {
  let existing = await Setting.getSettingByName(userId, setting.name, setting.type)
  if (existing) {
    throw new cError.UniqueConstraintException(`Setting with name:'${setting.name}' already exists`)
  }
  return Setting.addSetting(userId, setting)
}

async function updateSetting(userId, settingId, setting) {
  let existing = await Setting.getSettingByName(userId, setting.name, setting.type)
  if (existing && String(existing._id) != settingId) {
    // if there's existing record but not itself
    throw new cError.UniqueConstraintException(`Setting with name '${setting.name}' already exists`)
  }
  return Setting.updateSetting(userId, settingId, setting)
}

function deleteSetting(userId, settingId) {
  return Setting.deleteSetting(userId, settingId)
}

function listSettingUserConfig(userId) {
  return Setting.listSettingByType(userId, SETTING_TYPE.userConfig)
}

module.exports = {
  addSetting,
  updateSetting,
  deleteSetting,
  listSettingUserConfig,
}
