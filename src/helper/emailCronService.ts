
import { CronJob } from 'cron';
import caseEventModel from '../models/caseEventModel';
import caseModel from '../models/caseV2Model';
import userCaseModel from '../models/userCaseV2Model';
import { EventAction, UserCasePermission, IssueType } from '../types';
import { SpaceService } from '../services/spaceSvc';
const spaceSvc = SpaceService.getInstance()
const mongoose = require('mongoose')
const User = mongoose.model('User')
const config = require('../config')
const emailSvc = require('../services/emailSvc')

export class EmailCronService {
  job: CronJob;

  constructor() {
    this.job = new CronJob('1 * * * * *', this.sendManagerAssignedEmail, null, true)
    this.job = new CronJob('30 * * * * *', this.sendCommentedEamil, null, true)
  }

  async sendManagerAssignedEmail(): Promise<boolean> {
    const events = await caseEventModel.find({action: EventAction.MANAGER_ASSIGNED, notified: {$ne: true}})

    // Originator name
    const USIDs = events.map(e => e.USID).map(String)
    const userSpacesO = await spaceSvc.fetchUserSpacesByIds_(USIDs) // event Originator
    const userIdsO = userSpacesO.map(us => us.userId)
    const usersO = await User.listUserByIds(userIdsO)

    // case
    const caseIds = events.map(e => e.caseId)
    const cases = await caseModel.find({_id: caseIds})

    // case creator to be notified
    const usercases = await userCaseModel.find({caseId: caseIds, permission: {$in: [UserCasePermission.OWNER, UserCasePermission.MEMBER]}})
    const caseUSIDs = usercases.map(uc => uc.USID).map(String)
    const userSpacesM = await spaceSvc.fetchUserSpacesByIds_(caseUSIDs) // case members
    const userIdsM = userSpacesM.map(us => us.userId)
    const caseusers = await User.listUserByIds(userIdsM)

    events.map(async e => {
      const relatedUs = userSpacesO.find(us => String(us._id) === String(e.USID))
      const relatedUser = usersO.find(u => String(u._id) === String(relatedUs.userId))
      const relatedUsername = relatedUser.name

      const kase = cases.find(c => String(c._id) === String(e.caseId))
      if (kase.issueType === IssueType.GRIEVANCE || 1) { // disable check temp
        const link = `${config.downloadDomain}/cases/${kase._id}/feed?spaceId=${relatedUs.spaceId}`
        const ucs = usercases.filter(uc => String(uc.caseId) === String(e.caseId))
        const uss = userSpacesM.filter(us => ucs.find(uc => String(uc.USID) === String(us._id)) )
        const notifyUsers = caseusers.filter(u => uss.find(us => String(us.userId) === String(u._id)))
        notifyUsers.forEach(user => {
          emailSvc.sendCaseManagerAssignedEmail(user.email, user.name, relatedUsername, kase.caseNumber, link)
        });
      }
      const res = await caseEventModel.findOneAndUpdate({_id: e._id}, {notified: true})
    })
    return true
  }

  async sendCommentedEamil(): Promise<boolean> {
    const events = await caseEventModel.find({action: EventAction.COMMENT, notified: {$ne: true}})

    // Originator name
    const USIDs = events.map(e => e.USID).map(String)
    const userSpacesO = await spaceSvc.fetchUserSpacesByIds_(USIDs) // event Originator
    const userIdsO = userSpacesO.map(us => us.userId)
    const usersO = await User.listUserByIds(userIdsO)

    // case
    const caseIds = events.map(e => e.caseId)
    const cases = await caseModel.find({_id: caseIds})

    // other users to be notify
    const usercases = await userCaseModel.find({caseId: caseIds, permission: {$ne: UserCasePermission.RELATEDTO}})
    const caseUSIDs = usercases.map(uc => uc.USID).map(String)
    const userSpacesM = await spaceSvc.fetchUserSpacesByIds_(caseUSIDs) // case members
    const userIdsM = userSpacesM.map(us => us.userId)
    const caseusers = await User.listUserByIds(userIdsM)

    events.map(async e => {
      const relatedUs = userSpacesO.find(us => String(us._id) === String(e.USID))
      const relatedUser = usersO.find(u => String(u._id) === String(relatedUs.userId))
      const relatedUsername = relatedUser.name

      const kase = cases.find(c => String(c._id) === String(e.caseId))
      if (kase.issueType === IssueType.GRIEVANCE || 1) { // disable check temp
        const link = `${config.downloadDomain}/cases/${kase._id}/feed?spaceId=${relatedUs.spaceId}`
        const ucs = usercases.filter(uc => String(uc.caseId) === String(e.caseId))
        const uss = userSpacesM.filter(us => ucs.find(uc => String(uc.USID) === String(us._id)) )
        const notifyUsers = caseusers.filter(u => uss.find(us => String(us.userId) === String(u._id)))
        notifyUsers.forEach(user => {
          if (relatedUser.email !== user.email) {
            emailSvc.sendCaseCommentedEmail(user.email, user.name, relatedUsername, kase.caseNumber, link)
          }
        });
      }
      const res = await caseEventModel.findOneAndUpdate({_id: e._id}, {notified: true})
    })
    return true
  }

}