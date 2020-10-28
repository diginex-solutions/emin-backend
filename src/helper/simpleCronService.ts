
import { CronJob } from 'cron';
import { response } from 'express';
const mongoose = require('mongoose')
const HistoryModel = mongoose.model('History')
const UserSpaceModel = mongoose.model('userSpace')
const UserModel = mongoose.model('User')
const AccessModel = mongoose.model('Access')
const extAppModel = mongoose.model('ExtApp')
const axios = require('axios')
const querystring = require('querystring');
const config = require('../config')
const { HISTORY_ACTION, MODEL } = require('../constants')
const _ = require('lodash')
export class SimpleCronService {
  job: CronJob;

  constructor() {
    this.job = new CronJob('0 */2 * * * *', this.sendNotification, null, true)
    // this.sendNotification()
  }

  //action, user1, user2, fileId, access1, access2
  async sendNotification(): Promise<boolean> {
    const actions = [HISTORY_ACTION.actionCreated, HISTORY_ACTION.actionAccepted, HISTORY_ACTION.actionRejected]
    const histories = await HistoryModel.find({cronNotified: {$ne: true}, action: {$in: actions}})
    const actionDetails = histories.map(hist => {
      const formMeta = JSON.parse(hist.meta)
      return {
        action: hist.action,
        histId: String(hist._id),
        initiatorId: formMeta.initiatorId,
        recipientId: formMeta.recipientId,
        reciAccessId: formMeta.sharingId,
        fileId: hist.fileId
      }
    })
    const USIDs = _.flatten(actionDetails.map(d => [d.initiatorId, d.recipientId]))
    const uss = await UserSpaceModel.find({_id: {$in: USIDs}})
    const userIds = uss.map(uc => uc.userId)
    const users = await UserModel.find({_id: {$in: userIds}}, '-password')
    const operations = actionDetails.map(d => {
      const ucInit = uss.find(uc => String(uc._id) === String(d.initiatorId))
      const ucReci = uss.find(uc => String(uc._id) === String(d.recipientId))
      const userInit = users.find(u => String(u._id) === String(ucInit.userId))
      const userReci = users.find(u => String(u._id) === String(ucReci.userId))
      let applicationId = userInit.applicationId && userInit.applicationId === userReci.applicationId ? userInit.applicationId: false
      return {
        ...d,
        userInit,
        userReci,
        applicationId,
      }
    })
    const fileIds = operations.filter(o => o.applicationId).map(o => o.fileId)
    const initiatorIds = operations.filter(o => o.applicationId).map(o => o.initiatorId)

    const accessesInit = await AccessModel.find({fileId: {$in: fileIds}, USID: {$in: initiatorIds}})
    const requests = operations.filter(o => o.applicationId).map(o => {
      const accInit = accessesInit.find(acc => String(acc.fileId) === String(o.fileId))
      let initAccessId = String(accInit._id)
      return {...o, initAccessId}
    })
    const appIds = requests.map(r => r.applicationId)
    const extApps = await extAppModel.find({applicationId: {$in: appIds}}, '-pubKey')
    const responses: any = await Promise.all(requests.map(async r => {
      const app = extApps.find(a => a.applicationId === r.applicationId)
      // const link = app.notificationLink
      const link = "http://localhost:3000/healthz"
      const queryparams = {
        action: r.action,
        user1: String(r.userInit._id),
        access1: String(r.initAccessId),
        user2: String(r.userReci._id),
        access2: String(r.recipientId),
        file: String(r.fileId)
      }
      try{
        const response = await axios.get(link, { params:queryparams})
        console.log('response', response.status, response.data);
        return {
          ...r,
          status: response.status,
          data: response.data
        }
      } catch (err) {
        return {
          status: 500
        }
      }
    }))

    const skipHistIds = operations.filter(o => o.applicationId === false).map(o => o.histId)
    const successHistIds = responses.filter(o => o.status === 200).map(o => o.histId)
    const failedHistIds = responses.filter(o => o.status !== 200).map(o => o.histId)

    console.log('skipHistIds', skipHistIds);
    console.log('successHistIds', successHistIds);
    console.log('failedHistIds', failedHistIds);
    const successIds = [...successHistIds, ...skipHistIds ]
    await HistoryModel.updateMany({_id: {$in: successIds}}, { $set: { cronNotified: true } })
    await HistoryModel.updateMany({_id: {$in: failedHistIds}}, { $set: { cronNotified: false } })
    return true
  }

}