import _ from 'lodash';
import mongoose from 'mongoose';
import { CreateCaseDto } from '../dto';
import caseEventModel from '../models/caseEventModel';
import caseTypeModel from '../models/caseTypeModel';
import caseModel from '../models/caseV2Model';
import fileModel from '../models/fileModel';
import formModel from '../models/formModel';
import userCaseModel from '../models/userCaseV2Model';
import { SpaceService } from '../services/spaceSvc';
import { CaseEvent, CaseStatus, CaseType, EventAction, FileCategory, UserCasePermission, UserSpacePosition } from '../types';
const spaceSvc = SpaceService.getInstance()
const { extractFilename, getDriveDownloadableLink } = require('../helper/util')
const config = require('../config')
const cError = require('../helper/customError')
const userSvc = require('../services/userSvc')
const emailSvc = require('../services/emailSvc')

export class CaseService {

  static INSTANCE: CaseService;
  static getInstance(): CaseService {
    if (!CaseService.INSTANCE) {
      CaseService.INSTANCE = new CaseService();
    }
    return CaseService.INSTANCE;
  }

  static prevPrefix = '';

  async addCaseType(spaceId: string, caseTypes: string[]): Promise<CaseType[]> {
    const options = { upsert: true, new: true }
    const topicRes = await Promise.all(caseTypes.map((ct: any) => {
      if (typeof ct === 'string' || ct instanceof String)
        return caseTypeModel.findOneAndUpdate({spaceId, value: ct}, {spaceId, value: ct}, options)
    }))
    return topicRes
  }

  async fetchAllTypes(spaceId: string): Promise<CaseType[]> {
    return await caseTypeModel.find({spaceId}, "-spaceId")
  }

  fetchFirstCaseObj(caseList, caseId) {
    if (!caseList || caseList.length == 0) {
      throw new cError.InternalServerError(`Cannot fetch case with id: ${caseId}, please retry`)
    }
    return caseList[0]
  }

  eventFormat(event, initiatorUser, recipientUser, file, managerUser){
    const userFields = ['email', 'name', 'surname']
    const initiator = _.pick(initiatorUser, userFields)
    const recipient = recipientUser ? _.pick(recipientUser, userFields) : undefined
    const manager = managerUser ?  _.pick(managerUser, userFields) : undefined

    let fileObj
    if (event.fileId) {
      const [name, extension] = extractFilename(event.filename)
      const casePrefix = `case/${event.caseId}`
      const latestVer = file.versions.find(v => String(v._id) === String(file.versionId))
      const uri = getDriveDownloadableLink(casePrefix, latestVer._id, name, extension)
      fileObj = {
        id: event.fileId,
        name,
        extension,
        size: file.size,
        uri,
      }
    }
    return {
      id: event._id,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      action: event.action,
      data: event.data,
      initiator,
      recipient,
      file: fileObj,
      manager
    }
  }

  async userCaseToCase(caseIds: string[]): Promise<any> {
    const userFields = ['_id', 'email', 'name', 'surname', 'isRegistered'];
    const cases = await caseModel.find({_id: caseIds}).sort({ _id: -1 }).lean()
    const allUserCases = await userCaseModel.find({caseId: caseIds}).lean()
    const allUSIDs = _.uniq(allUserCases.map((uc) => String(uc.USID)))
    const userSpaces = await spaceSvc.fetchUserSpacesByIds_(allUSIDs)
    const allUserIds = _.uniq(userSpaces.map((us) => String(us.userId)))
    const allUsers = await userSvc.getUserByIds(allUserIds)

    const allUCsWithUser = allUserCases.map((uc) => {
      const userSpace = userSpaces.find(us => String(us._id) === String(uc.USID))
      const userObj = allUsers.find((u) => String(u._id) === String(userSpace.userId))
      const user = _.pick(userObj, userFields)
      return {
        ...uc,
        user,
      }
    })
    const allEvents = await caseEventModel.find({caseId: caseIds, valid: 0})

    const allManagerUSIds = _.uniq(allEvents.filter(e => e.managerId).map(e => String(e.managerId)))
    const managerUserSpaces = await spaceSvc.fetchUserSpacesByIds_(allManagerUSIds, true)
    const allManagerUserIds = _.uniq(managerUserSpaces.map((us) => String(us.userId)))
    const allManagers = await userSvc.getUserByIds(allManagerUserIds)

    const allManagersWithUser = managerUserSpaces.map(us => {
      const userObj = allManagers.find(m => String(m._id) === String(us.userId))
      const user = _.pick(userObj, userFields)
      return {
        ...us,
        user
      }
    })

    // const allEvents = await EventModel.listEventByCases(caseIds)
    const allFileIds = _.uniq(allEvents.filter((e) => e.fileId).map((e) => String(e.fileId)))
    const allFiles = await fileModel.find({ _id: { $in: allFileIds } }, "versionId versions").lean();

    return cases.map((c) => {
      const owner = allUCsWithUser.find((ucu) => String(ucu.caseId) === String(c._id) && ucu.permission === UserCasePermission.OWNER)
      const origAssignedTo = allUCsWithUser.find((ucu) => String(ucu.caseId) === String(c._id) && ucu.permission === UserCasePermission.ASSIGNEDTO)
      const relatedTo = allUCsWithUser.find((ucu) => String(ucu.caseId) === String(c._id) && ucu.permission === UserCasePermission.RELATEDTO)

      const eventsOfC = allEvents.filter((e) => String(e.caseId) === String(c._id))
      const events = eventsOfC.map((e) => {
        const initiatorUCU = allUCsWithUser.find((ucu) => String(ucu.USID) === String(e.USID))
        const recipientUCU = allUCsWithUser.find((ucu) => String(ucu.USID) === String(e.recipientId))
        const initiator = initiatorUCU && initiatorUCU.user
        const recipient = recipientUCU ? recipientUCU.user : undefined
        const file = e.fileId ? allFiles.find((f) => String(f._id) === String(e.fileId)) : null
        const managerObj = e.managerId ? allManagersWithUser.find(u => String(u._id) === String(e.managerId)) : undefined
        const manager = managerObj ? managerObj.user : undefined
        return this.eventFormat(e, initiator, recipient, file, manager)
      })
      const users = allUCsWithUser
        .filter(
          (ucu) => String(ucu.caseId) === String(c._id) && ucu.permission === UserCasePermission.MEMBER)
        .map((ucu) => ucu.user)

      const assignedTo = origAssignedTo ? _.pick(origAssignedTo.user, userFields) : null
      return {
        ...c,
        owner: _.pick(owner.user, userFields),
        assignedTo,
        relatedTo: relatedTo ? _.pick(relatedTo.user, ['email', 'name', 'surname']) : null,
        users,
        events,
      }
    })
  }

  private generateCaseNumber(lastPrefix) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lastAlphabet = alphabet[alphabet.length - 1]
    const firstAlphabet = alphabet[0]
    const substrBeforeLast = lastPrefix.substr(0, lastPrefix.length - 1)

    if (lastPrefix === '') {
      return `${firstAlphabet}${firstAlphabet}`
    } else if (lastPrefix[lastPrefix.length - 1] === lastAlphabet) {
      const allUsed = lastPrefix.split('').filter(c => c !== lastAlphabet).length === 0
      if (allUsed) {
        return `${Array(lastPrefix.length).fill(firstAlphabet).join('')}${firstAlphabet}`
      }
      return `${this.generateCaseNumber(substrBeforeLast)}${firstAlphabet}`
    } else {
      const idx = alphabet.indexOf(lastPrefix[lastPrefix.length - 1])
      const nextAlphabet = alphabet[idx + 1]
      return `${substrBeforeLast}${nextAlphabet}`
    }
  }

  private genTimestamp() {
    const currentDate = new Date()
    const strYear = currentDate.getFullYear().toString().substr(2)
    const month = currentDate.getMonth() + 1
    const strMonth = `${ month < 10 ? '0' : '' }${month}`
    const date = currentDate.getDate()
    const strDate = `${ date < 10 ? '0' : '' }${date}`
    const hour = currentDate.getHours()
    const strHour = `${ hour < 10 ? '0' : '' }${hour}`
    const minute = currentDate.getMinutes()
    const strMinute = `${ minute < 10 ? '0' : '' }${minute}`
    const second = currentDate.getSeconds()
    const strSecond = `${ second < 10 ? '0' : '' }${second}`

    return `${strYear}${strMonth}${strDate}${strHour}${strMinute}${strSecond}`
  }

  async newCase(USID: string, spaceId: string, createCaseDto: CreateCaseDto, ts: number): Promise<any> {
    const formId = createCaseDto.formId
    if (formId) {
      const form = await formModel.findOne({ _id: formId }).populate('templateId')
      if (!form) throw new cError.ResourceNotFoundException(`Form not found with ID:${formId}`)
    }

    const relatedUs = await spaceSvc.findUserSpaces({userId: createCaseDto.relatedTo, spaceId})

    const prefix = this.generateCaseNumber(CaseService.prevPrefix)
    const timestamp = this.genTimestamp()

    const caseNumber = `${prefix}${timestamp}`;
    const caseCreated = await caseModel.create({ ...createCaseDto,  caseNumber, spaceId })
    CaseService.prevPrefix = prefix

    const userCaseObj = {
      USID,
      caseId: caseCreated._id,
      permission: UserCasePermission.OWNER,
    }
    const myuserCase = await userCaseModel.create(userCaseObj)

    if (relatedUs.length) {
      const relatedUserCaseObj = {
        USID: relatedUs[0]._id,
        caseId: caseCreated._id,
        permission: UserCasePermission.RELATEDTO
      }
      await userCaseModel.create(relatedUserCaseObj)
    }

    const eventAction = EventAction.CASE_NEW
    const eventObj = {
      createdAt: ts,
      updatedAt: ts,
      caseId: caseCreated._id,
      USID,
      action: eventAction,
      data: null,
    }
    const event = await caseEventModel.create(eventObj)

    const caseObjs = await this.userCaseToCase([String(myuserCase.caseId)])
    return this.fetchFirstCaseObj(caseObjs, myuserCase.caseId)
  }

  async listMyCases(USID: string, positionType: UserSpacePosition): Promise<any> {
    let unassignedCaseIds
    const userSpace = await spaceSvc.findMyUserSpace({ _id: String(USID) })
    const spaceId = String(userSpace.spaceId)

    if (positionType === UserSpacePosition.MANAGER) {
      const allCases = await caseModel.find({ spaceId }, { _id: 1 }).lean()
      const allCaseIds = allCases.map(c => String(c._id))
      const ucAssigned = await userCaseModel.find({ caseId: { $in: allCaseIds }, permission: UserCasePermission.ASSIGNEDTO}, "caseId").lean()  
      const caseIdsAssigned = _.uniq(ucAssigned.map(uc => uc.caseId).map(String))
      unassignedCaseIds = _.difference(allCaseIds, caseIdsAssigned)
    } else {
      unassignedCaseIds = []
    }
    
    const query = {USID, permission: {$ne: UserCasePermission.RELATEDTO}}
    const myUserCases = await userCaseModel.find(query).lean()
    const myCaseIds = myUserCases.map(c => c.caseId).map(String) 
    const caseObjs = await this.userCaseToCase(_.uniq([...unassignedCaseIds, ...myCaseIds]))
    return caseObjs
  }

  async getMyCase(USID: string, caseId: string): Promise<any> {
    const myUserCase = await userCaseModel.findOne({ USID, caseId }).lean()
    if (!myUserCase) throw new cError.ResourceNotFoundException(`It seems you don't have the access to case ${caseId}`)
    const caseDb = await caseModel.findOne({_id: caseId})
    return [myUserCase, caseDb]
  }

  async getMyOpenCase(USID: string, caseId: string): Promise<any> {
    const [myUserCase, caseDb] = await this.getMyCase(USID, caseId)
    if (caseDb.status === CaseStatus.CLOSED) throw new cError.InvalidStateTransitException(`The case is already closed`)
    return [myUserCase, caseDb]
  }

  async eventToResponse(event: CaseEvent): Promise<any> {
    const userIdInit = await spaceSvc.findUserIdByUserSpace({_id: event.USID})
    const initiator = await userSvc.getUserById(userIdInit)
    const recipientIdInit = event.recipientId ? await spaceSvc.findUserIdByUserSpace({_id: event.recipientId}) : undefined
    const recipient = recipientIdInit ? await userSvc.getUserById(recipientIdInit) : undefined
    const allFiles = event.fileId ?
      await fileModel.find({ _id: { $in: [String(event.fileId)] } }, "versionId versions").lean() :
      [null]
    return this.eventFormat(event, initiator, recipient, allFiles[0], undefined)
  }

  // eventFormat(event, initiatorUser, recipientUser, file): any {
  //   const userFields = ['email', 'name', 'surname']
  //   const initiator = _.pick(initiatorUser, userFields)
  //   const recipient = recipientUser ? _.pick(recipientUser, userFields) : undefined

  //   let fileObj
  //   if (event.fileId) {
  //     const [name, extension] = extractFilename(event.filename)
  //     const casePrefix = `case/${event.caseId}`
  //     const latestVer = file.versions.find(v => String(v._id) === String(file.versionId))
  //     const uri = getDriveDownloadableLink(casePrefix, latestVer._id, name, extension)
  //     fileObj = {
  //       id: event.fileId,
  //       name,
  //       extension,
  //       size: file.size,
  //       uri,
  //     }
  //   }
  //   return {
  //     id: event._id,
  //     createdAt: event.createdAt,
  //     updatedAt: event.updatedAt,
  //     action: event.action,
  //     data: event.data,
  //     initiator,
  //     recipient,
  //     file: fileObj,
  //   }
  // }

  async comment(USID: string, caseId: string, comment: string, ts: number): Promise<any> {
    const caseDb = await caseModel.findOne({_id: caseId})
    if (caseDb.status === CaseStatus.CLOSED) throw new cError.InvalidStateTransitException(`The case is already closed`)
    const event = {
      createdAt: ts,
      updatedAt: ts,
      caseId,
      USID,
      recipientId: null,
      action: EventAction.COMMENT,
      valid: 0,
      data: comment,
    }

    const eventCreated = await caseEventModel.create(event)
    return await this.eventToResponse(eventCreated)
  }

  async deleteComment(USID: string, commentId: string, ts: number) {
    const event = await caseEventModel.findOne({_id: commentId})
    if (!event) throw new cError.ResourceNotFoundException(`Comment not found with Id: ${commentId}`)
    const caseId = event.caseId
    const caseDb = await caseModel.findOne({_id: caseId})
    if (caseDb.status === CaseStatus.CLOSED) throw new cError.InvalidStateTransitException(`The case is already closed`)

    const options = { new: true }
    const query = { _id: commentId, USID, action: EventAction.COMMENT, valid: 0 }
    const update = { valid: -1, updatedAt: ts }

    const eventDeleted = await caseEventModel.findOneAndUpdate(query, update, options)
    if (!eventDeleted) throw new cError.ResourceNotFoundException(`Comment with ID:${commentId} is not removable`)
    return await this.eventToResponse(eventDeleted)

  }

  async updateComment(USID: string, commentId: string, comment: string): Promise<any> {
    const query = {_id: commentId, USID, action: EventAction.COMMENT, valid: 0 }
    const eventUpdated = await caseEventModel.findOneAndUpdate(query, {data: comment}, { new: true })

    if (!eventUpdated) throw new cError.ResourceNotFoundException(`Comment with ID:${commentId} is not modifiable`)
    return await this.eventToResponse(eventUpdated)
  }

  validateUpdateOrCloseCase(caseBody: any) {
    const caseUpdate = _.pick(caseBody, ['resolutionPlan', 'formId', 'assignedTo', 'status'])

    if (!Object.keys(caseUpdate).length) {
      throw new cError.InvalidRequestPayloadException(`Either closing or updating case properties is allowed`)
    } else {
      return
    }
  }

  async updateCase(USID: string, caseId: string, caseBody: any, ts: number, spaceId: string, position: UserSpacePosition) {
    const caseDb = await caseModel.findOne({_id: caseId})
    console.log('caseDb', caseDb);

    if (!(caseDb.status === CaseStatus.NEW && position === UserSpacePosition.MANAGER)){
      const myUserCase = await userCaseModel.findOne({ USID, caseId }).lean()
      if (!myUserCase) {
        throw new cError.ResourceNotFoundException(`It seems you don't have the access to case ${caseId}`)
      }
    }

    const caseUpdate = _.pick(caseBody, ['resolutionPlan', 'formId', 'assignedTo', 'status'])
    console.log('caseUpdate', caseUpdate);

    const caseStatusToBe = caseBody.status

    if (Object.keys(caseUpdate).length === 1 && Object.keys(caseUpdate)[0] === 'status') {
      // close/reopen case
      if (caseDb.status == caseStatusToBe ||
        (caseStatusToBe === CaseStatus.CLOSED && caseDb.status === CaseStatus.NEW) ||
        (caseStatusToBe === CaseStatus.NEW && caseDb.status === CaseStatus.CLOSED)
        ) {
        throw new cError.InvalidStateTransitException(
          `No transition is performed from '${caseDb.status}' to '${caseStatusToBe}'`
        )
      }

      await caseModel.findOneAndUpdate({ _id: caseId }, { status: caseStatusToBe, updatedAt: ts }, { new: true })

      const actionData = caseStatusToBe === CaseStatus.CLOSED ? {
        action: EventAction.CASE_CLOSED,
        data: CaseStatus.INPROGRESS
      }: {
        action: EventAction.CASE_IN_PROGRESS,
        data: CaseStatus.CLOSED
      }

      const event = {
        _id: mongoose.Types.ObjectId(),
        createdAt: ts,
        updatedAt: ts,
        caseId,
        USID,
        ...actionData
      }
      await caseEventModel.create(event)
    } else if (Object.keys(caseUpdate).length) {
      // update case
      const formId = caseUpdate.formId
      if (formId) {
        const form = await formModel.findOne({ _id: formId }).populate('templateId')
        if (!form) throw new cError.ResourceNotFoundException(`Form not found with ID:${formId}`)
      }

      await caseModel.findOneAndUpdate({ _id: caseId }, { ...caseUpdate, updatedAt: ts }, { new: true })

      const queryAssigned = { caseId, permission: UserCasePermission.ASSIGNEDTO }
      if (caseUpdate.assignedTo) {
        const assignedUs = await spaceSvc.findUserSpaces({userId: caseUpdate.assignedTo, spaceId })
        if (assignedUs.length) {
          const assignedUserCaseObj = {
            USID: assignedUs[0]._id,
            caseId,
            permission: UserCasePermission.ASSIGNEDTO
          }
          const prevAssigned = await userCaseModel.findOneAndUpdate(queryAssigned, assignedUserCaseObj, { new: false })
          if (!prevAssigned || (prevAssigned && String(prevAssigned.USID) !== String(assignedUs[0]._id))) {
            const managerEventObj = {
              createdAt: ts,
              updatedAt: ts,
              caseId: caseId,
              USID,
              action: EventAction.MANAGER_ASSIGNED,
              managerId: assignedUs[0]
            }
            await caseEventModel.create(managerEventObj)
          }
          if (!prevAssigned) {
            await userCaseModel.create(assignedUserCaseObj)
            const statusEventObj = {
              createdAt: ts,
              updatedAt: ts,
              caseId: caseId,
              USID,
              action: EventAction.CASE_IN_PROGRESS,
              data: CaseStatus.NEW
            }
            await caseEventModel.create(statusEventObj)
          }
        }
      } else {
        const oldAssigned = await userCaseModel.findOneAndDelete(queryAssigned)
        const managerEventObj = {
          createdAt: ts,
          updatedAt: ts,
          caseId: caseId,
          USID,
          action: EventAction.MANAGER_REMOVED,
          managerId: oldAssigned ? oldAssigned.USID : null
        }
        await caseEventModel.create(managerEventObj)
        const statusEventObj = {
          createdAt: ts,
          updatedAt: ts,
          caseId: caseId,
          USID,
          action: EventAction.CASE_NEW,
          data: 'managerRemoved'
        }
        await caseEventModel.create(statusEventObj)
      }
    } else {
      throw new cError.InvalidRequestPayloadException(`Either closing or updating case properties is allowed`)
    }
    const caseObjs = await this.userCaseToCase([String(caseDb._id)])
    return this.fetchFirstCaseObj(caseObjs, caseDb._id)
  }

  async addUser(USID: string, caseId: string, remoteUSID: string, ts: number) {
    const us = await spaceSvc.findMyUserSpace({_id: USID, valid: true})
    const usRemote = await spaceSvc.findMyUserSpace({_id: remoteUSID, valid: true})
    if (String(us.spaceId) !== String(usRemote.spaceId)) {
      throw new cError.ResourceNotFoundException(`User '${remoteUSID}' not found in this space`)
    }

    const caseDb = await caseModel.findOne({_id: caseId})

    const user = await userSvc.getUserById(String(us.userId))
    const remoteUser = await userSvc.getUserById(String(usRemote.userId))

    const remoteUserCase = await userCaseModel.findOne({ USID: remoteUSID, caseId, permission: {$ne: UserCasePermission.RELATEDTO} }).lean()
    if (remoteUserCase)
      throw new cError.ResourceNotFoundException(`'${remoteUser.email}' is already in the Case`)

    const userCaseManager = {
      _id: mongoose.Types.ObjectId(),
      USID: remoteUSID,
      caseId,
      permission: UserCasePermission.MEMBER,
    }
    await userCaseModel.create(userCaseManager)

    const event = {
      _id: mongoose.Types.ObjectId(),
      createdAt: ts,
      updatedAt: ts,
      caseId,
      USID,
      recipientId: remoteUSID,
      action: EventAction.USER_JOIN,
      data: null,
    }

    const eventAddUser = await caseEventModel.create(event)
    const link = `${config.downloadDomain}/cases/${caseId}/feed?spaceId=${us.spaceId}`
    await emailSvc.sendCaseUserAddedEmail(remoteUser.email, remoteUser.name, user.name, caseDb.caseNumber, link)
    const respEventAddUser = await this.eventToResponse(await caseEventModel.create(eventAddUser))
    return {
      user: remoteUser,
      event: respEventAddUser
    }
  }

  async uploadFile(caseId: string, USID: string, versionFileId: string, filename: string,
    size: number, storage: string, shaHash: string, ts: number) {
    const fileId = mongoose.Types.ObjectId()
    const file = {
      _id: fileId,
      archived: false, // TODO: no archive flag
      isFolder: false,
      category: FileCategory.CASE,
      versionId: versionFileId,
      versions: [
        {
          _id: versionFileId,
          uploader: USID,
          uploaded: ts,
          size,
          storage,
          status: 0,
          hash: shaHash,
        },
      ],
    }

    const fileSaved = await fileModel.create(file)
    const uploadedFile = await fileModel.findOne({ _id: fileSaved._id }, { storage: 0 }).lean()
    if (uploadedFile) {
      const event = {
        _id: mongoose.Types.ObjectId(),
        createdAt: ts,
        updatedAt: ts,
        caseId,
        USID,
        recipientId: null,
        managerId: null,
        action: EventAction.FILE_UPLOAD,
        status: 0,
        data: null,
        fileId,
        filename,
      }
      const eventUploaded = await caseEventModel.create(event)
      return this.eventToResponse(eventUploaded)
    } else {
      throw new cError.InternalServerError(`File filed to be processed: ${uploadedFile}`)
    }
  }
}
