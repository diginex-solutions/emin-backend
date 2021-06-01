const settingSvc = require('../services/settingSvc')
const cError = require('../helper/customError')
const _ = require('lodash')
const { SETTING_TYPE } = require('../constants')

async function addSetting(req, res, next) {
  const userId = req.decoded.userId
  const keys = ['name', 'value']
  const setting = { ..._.pick(req.body, keys), type: SETTING_TYPE.userConfig }
  const settingResp = await settingSvc.addSetting(userId, setting)
  res.json(settingResp)
}

async function updateSetting(req, res, next) {
  const userId = req.decoded.userId
  const settingId = req.params.settingId
  const keys = ['name', 'value']
  const setting = { ..._.pick(req.body, keys), type: SETTING_TYPE.userConfig }
  const settingResp = await settingSvc.updateSetting(userId, settingId, setting)
  if (settingResp) {
    res.json(settingResp)
  } else {
    throw new cError.ResourceNotFoundException('Setting does not exist')
  }
}

async function deleteSetting(req, res, next) {
  const userId = req.decoded.userId
  const settingId = req.params.settingId
  const settingResp = await settingSvc.deleteSetting(userId, settingId)
  if (settingResp) {
    res.json(settingResp)
  } else {
    throw new cError.ResourceNotFoundException('Setting does not exist')
  }
}

async function listSettingUserConfig(req, res, next) {
  const userId = req.decoded.userId
  const settingListResp = await settingSvc.listSettingUserConfig(userId)
  if (settingListResp) {
    res.json(settingListResp)
  } else {
    throw new cError.ResourceNotFoundException('Setting does not exist')
  }
}

module.exports = {
  addSetting,
  updateSetting,
  deleteSetting,
  listSettingUserConfig,
}
