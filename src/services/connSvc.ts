import _ from 'lodash';
import mongoose from 'mongoose';
import connModel from '../models/connModel';
import { SpaceService } from '../services/spaceSvc';
import { Conn, UserSpaceRole } from '../types';
import userSpaceModel from '../models/userSpaceModel';
const spaceSvc = SpaceService.getInstance()
const userSvc = require('./userSvc')
const cError = require('../helper/customError');
const constants = require('../constants')
type ObjectId = mongoose.Types.ObjectId
const emailSvc = require('../services/emailSvc')

export class ConnService {

  static INSTANCE: ConnService;
  static getInstance(): ConnService {
    if (!ConnService.INSTANCE) {
      ConnService.INSTANCE = new ConnService();
    }
    return ConnService.INSTANCE;
  }

  async saveConn(ownerUSID: string, userId: string): Promise<Conn> {
    const options = { upsert: true, new: true }
    const conn = await connModel.findOneAndUpdate({ownerUSID, userId}, {ownerUSID, userId, valid: true}, options)
    return conn
  }

  async isUserInSpace(spaceId: string, userId?: string): Promise<boolean> {
    try{
      if (!userId || !spaceId) return false
      const usRemote = await spaceSvc.findMyUserSpace({userId, spaceId})
    } catch (err) {
      return false
    }
    return true
  }

  async addConn(ownerUSID: string, email: string, spaceId: string, role: UserSpaceRole) {
    let userRemote = await userSvc.getUserByEmail(email)
    const userIdRemote = userRemote?._id
    const isAlreadyInSpace = await this.isUserInSpace(spaceId, userIdRemote)
    if (isAlreadyInSpace) {
      const conn = await this.saveConn(ownerUSID, userIdRemote)
    } else {
      const space = await spaceSvc.findSpaceById(spaceId)
      // if (!space.allowInviteAll && role !== UserSpaceRole.ADMIN) {
      //   const userSpace = await spaceSvc.findMyUserSpace({ _id: ownerUSID })
      //   const user = await userSvc.getUserById(userSpace.userId)
      //   const spaceName = space.isPrivate && user?.name ? `${user.name}'s Space` : space.name
      //   throw new cError.ResourceNotFoundException(`${email} is not in \'${spaceName}\'`)
      // }
      const name = null, surname = null, lang = 'en'
      userRemote = await userSvc.inviteUser(ownerUSID, email, name, surname, lang, constants.USER_TYPE.normal, UserSpaceRole.EMPLOYEE)
      const conn = await this.saveConn(ownerUSID, userRemote._id)
    }
    //SS-246
    const userRemoteSpace = await spaceSvc.joinSpace(userRemote._id, spaceId)
    const ownerUserSpace =  await userSpaceModel.findOne({_id: ownerUSID})
    const conn2 = await this.saveConn(userRemoteSpace._id, ownerUserSpace.userId)

    return _.pick(userRemote, ['email', 'name', 'surname', '_id', 'photo', 'profileStrength'])
  }

  async getConn(ownerUSID: string): Promise<Conn[]> {
    return await connModel.find({ownerUSID, valid: true})
  }

  async getAllConn(ownerUSID: string): Promise<Conn[]> {
    return await connModel.find({ownerUSID})
  }

  async deleteConn(ownerUSID: string, userId: string): Promise<Conn> {
    return await connModel.findOneAndUpdate({ownerUSID, userId, valid: true}, {valid: false},  {new: true})
  }
}
