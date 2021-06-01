import _ from 'lodash';
import { CreateSpaceDto, SpaceSettingsDto, UserSpaceRespDto } from '../dto';
import spaceModel from '../models/spaceModel';
import userSpaceModel from '../models/userSpaceModel';
import { initSpace, Space, UserSpace, UserSpacePosition, UserSpaceRole } from '../types';
import { checklistSvc } from './checklistSvc';
const mongoose = require('mongoose')
const cError = require('../helper/customError');
const constants = require('../constants')

export class SpaceService {

  static INSTANCE: SpaceService;
  static getInstance(): SpaceService {
    if (!SpaceService.INSTANCE) {
      SpaceService.INSTANCE = new SpaceService();
    }
    return SpaceService.INSTANCE;
  }

  private static async getPersonalSpaceName(userId: string) {
    if (userId) {
      const user = await mongoose.model('User').getUserById(userId)
      const { name: firstname = '' } = user || {}
      return firstname ? `${firstname}'s Space` : ''
    }
    return ''
  }
  async _createPureSpace(input: CreateSpaceDto): Promise<Space> {
    const s = (await spaceModel.create(initSpace(input))).toObject()
    await checklistSvc.ensureDefaultDocumentTypes(s._id)
    return s
  }

  async createSpace(input: CreateSpaceDto, userId: string): Promise<UserSpaceRespDto> {
    const s = (await spaceModel.create(initSpace(input))).toObject()
    const us = await this.joinSpace(userId, s._id, UserSpaceRole.ADMIN)
    const newSpace = new UserSpaceRespDto({ ...s, id: s._id, role: us.role })
    await checklistSvc.ensureDefaultDocumentTypes(newSpace.id)
    return newSpace
  }

  async updateSpace(spaceId: string, input: CreateSpaceDto | SpaceSettingsDto, userId: string, validate = true): Promise<UserSpaceRespDto> {
    const us = await userSpaceModel.findOne({userId, spaceId, role: UserSpaceRole.ADMIN, valid: true})
    if ( !us && validate ) {
      throw new cError.ResourceNotFoundException(`You don't have access to modify space with Id:${spaceId}`)
    }
    const s = await this.doUpdateSpace(spaceId, input)
    return new UserSpaceRespDto({...s, id: String(s._id), role: us ? us.role : undefined})
  }

  async doUpdateSpace(spaceId: string, input: CreateSpaceDto | SpaceSettingsDto): Promise<Space> {
    const update = _.pickBy(input, v => v !== undefined)
    return await spaceModel.findOneAndUpdate({_id: spaceId}, { $set: update }, {new: true}).lean()
  }

  async findSpaceById(_id: string): Promise<Space> {
    const space = await spaceModel.findOne({_id}).lean()
    if (!space) {
      throw new cError.ResourceNotFoundException(`Space not found with Id: ${_id}`)
    } else {
      return space
    }
  }

  async fetchMySpaces(userId: string): Promise<UserSpaceRespDto[]>{
    const uss = await userSpaceModel.find({userId, valid: true})
    const spaceIds = uss.map(us => us.spaceId)
    const spaces = await spaceModel.find({ _id: spaceIds }).lean()
    const personalSpaceName = await SpaceService.getPersonalSpaceName(userId)

    return spaces.map(s => {
      const role = _.get(uss.find(us => String(us.spaceId) === String(s._id)), 'role')
      const name = s.isPrivate && personalSpaceName ? personalSpaceName : s.name
      return new UserSpaceRespDto({ ...s, id: s._id, role, name });
    })
  }

  async findUserSpaces(userSpace: Partial<UserSpace>): Promise<UserSpace[]> {
    const query = _.pickBy(userSpace, v => v !== undefined)
    const userSpaceResp = await userSpaceModel.find(query)
    if (!userSpaceResp) {
      throw new cError.ResourceNotFoundException(`UserSpace not found with ${JSON.stringify(query)}`)
    }
    return userSpaceResp
  }

  async findMyUserSpace(userSpace: Partial<UserSpace>): Promise<UserSpace> {
    const query = _.pickBy(userSpace, v => v !== undefined)
    const userSpaceResp = Object.keys(query).length !== 0 ? await userSpaceModel.findOne(query) : null
    if (!userSpaceResp) {
      throw new cError.ResourceNotFoundException(`UserSpace not found with ${JSON.stringify(query)}`)
    }
    return userSpaceResp
  }

  async findUserIdByUserSpace(userSpace: Partial<UserSpace>): Promise<string> {
    const userSpaceResp = await this.findMyUserSpace(userSpace)
    return String(userSpaceResp.userId)
  }

  async fetchUserSpacesByIds(USIDs: string[]): Promise<UserSpace[]> {
    return await userSpaceModel.find({_id: USIDs, valid: true})
  }

  async fetchUserSpacesByIds_(USIDs: string[], retRawObject = false ): Promise<UserSpace[]> {
    const docs = userSpaceModel.find({_id: USIDs})
    return await (retRawObject ? docs.lean() : docs)
  }

  async findSpace(query): Promise<Space> {
    const space = await spaceModel.findOne(query)
    if (!space) {
      throw new cError.ResourceNotFoundException(`Space not found with ${JSON.stringify(query)}`)
    }
    return space
  }

  async fetchAllSpaces(currentUserId?: string): Promise<UserSpaceRespDto[]> {
    const spaces = await spaceModel.find({}).lean()
    const spaceIds = spaces.map(s => s._id)
    const uss = await userSpaceModel.find({spaceId: spaceIds, role: UserSpaceRole.ADMIN, valid: true}).lean()
    const userIds = uss.map(us => us.userId)
    const users = await mongoose.model('User').listUserByIds(userIds)
    const personalSpaceName = await SpaceService.getPersonalSpaceName(currentUserId)

    return spaces.map(s => {
      const ussF = uss.filter(us => String(us.spaceId) === String(s._id))
      const usersFromUss = ussF.map(us => {
        const user = users.find(user => String(user._id) === String(us.userId))
        return {name: user.name, surname: user.surname, email: user.email}
      })
      const name = s.isPrivate && personalSpaceName ? personalSpaceName : s.name
      return new UserSpaceRespDto({...s, id: String(s._id), admins: usersFromUss, name})
    })
  }

  async joinSpace(userId: string, spaceId: string, role = UserSpaceRole.EMPLOYEE, positionType = UserSpacePosition.OTHERS): Promise<UserSpace | null> {
    const fileSvc = require('./fileSvc')
    const options = { upsert: true, new: true }
    const userSpace = await userSpaceModel.findOneAndUpdate({userId, spaceId}, {userId, spaceId, role, positionType, valid: true}, options)
    const [sharedFolder, errMsgS] = await fileSvc.createFolder(String(userSpace._id), constants.RESERVED_PATH.SHARED)
    if (errMsgS)
      console.log('Failed to initialize user directory ${errMsgA}', errMsgS);
    const [archivedFolder, errMsgA] = await fileSvc.createFolder(String(userSpace._id), constants.RESERVED_PATH.ARCHIVED)
    if (errMsgA)
      console.log('Failed to initialize user directory ${errMsgA}', errMsgA);
    return userSpace
  }

  async leaveSpace(userId: string, spaceId: string): Promise<UserSpace | null> {
    const space = await this.findSpace({_id: spaceId})
    if (!space.isPrivate) {
      const usLeft = await userSpaceModel.findOneAndUpdate({userId, spaceId, valid: true}, {valid: false}, {new: true})
      if (!usLeft) {
        throw new cError.ResourceNotFoundException(`UserSpace not found with ${JSON.stringify({ userId, spaceId })}`)
      } else {
        return usLeft
      }
    } else {
      throw new cError.PermissionDeniedException(`Reserved space '${space.name}' cannot be deleted`)
    }
  }

  async updateRole(userId: string, spaceId: string, role: UserSpaceRole): Promise<UserSpace | null> {
    const options = { new: true }
    const userSpace = await userSpaceModel.findOneAndUpdate({userId, spaceId, valid: true}, {role}, options)
    return userSpace
  }

  async getRegisteredUsers(strSpaceId: string) {
    const spaceId = String(strSpaceId)
    const userSpaces = await userSpaceModel.find({ spaceId }, { userId: 1 })
    const userIds = userSpaces.map(us => us.userId )
    const selections = { name: 1, surname: 1, email: 1, isRegistered: 1 }
    return mongoose.model('User').find({ isRegistered: true, _id: { $in: userIds }}, selections)
  }

  async getManagers(strSpaceId: string) {
    const spaceId = String(strSpaceId)
    const userSpaces = await userSpaceModel.find({ spaceId, positionType: UserSpacePosition.MANAGER }, { userId: 1 })
    const userIds = userSpaces.map(us => us.userId )
    const selections = { name: 1, surname: 1, email: 1, isRegistered: 1 }
    return mongoose.model('User').find({ isRegistered: true, _id: { $in: userIds }}, selections)
  }

  async addManager(strSpaceId: string, managerId: string) {
    const spaceId = String(strSpaceId)
    const userId = String(managerId)
    const userSpace = await userSpaceModel.findOneAndUpdate({ spaceId, userId }, { positionType: UserSpacePosition.MANAGER }, { new: true })
    if (!userSpace) {
      throw new cError.ResourceNotFoundException(`UserSpace not found with ${JSON.stringify({ userId, spaceId })}`)
    }

    const selections = { name: 1, surname: 1, email: 1, isRegistered: 1 }
    const user = await mongoose.model('User').findOne({ _id: userId }, selections)
    if (!user) {
      throw new cError.ResourceNotFoundException(`User not found with ${JSON.stringify({ userId })}`)
    }

    return user
  }

  async deleteManager(strSpaceId: string, managerId: string) {
    const spaceId = String(strSpaceId)
    const userId = String(managerId)
    const userSpace = await userSpaceModel.findOneAndUpdate({ spaceId, userId }, { positionType: UserSpacePosition.OTHERS }, { new: true })
    if (!userSpace) {
      throw new cError.ResourceNotFoundException(`UserSpace not found with ${JSON.stringify({ userId, spaceId })}`)
    }

    const selections = { name: 1, surname: 1, email: 1, isRegistered: 1 }
    const user = await mongoose.model('User').findOne({ _id: userId }, selections)
    if (!user) {
      throw new cError.ResourceNotFoundException(`User not found with ${JSON.stringify({ userId })}`)
    }

    return user
  }

  async findUserSpace(userId: string){
    return await userSpaceModel.findOne({userId})
  }
}

