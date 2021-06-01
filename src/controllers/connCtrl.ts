import { UserSpaceRole } from '../types';
import { ConnService } from '../services/connSvc';
import express from 'express';
const cError = require('../helper/customError')
const resMapper = require('../helper/resMapper.js')
const userSvc = require('../services/userSvc')

class ConnController {
  static INSTANCE: ConnController;
  private connService: ConnService;
  static getInstance(): ConnController {
    if (!ConnController.INSTANCE) {
      ConnController.INSTANCE = new ConnController();
    }
    return ConnController.INSTANCE;
  }

  constructor() {
    this.connService = ConnService.getInstance();
  }

  async addConn(req: express.Request, res: express.Response) {
    const USID = req.body.RESERVED_USID
    const spaceId = req.body.RESERVED_SPACEID
    const spaceRole = req.body.RESERVED_USROLE
    const email = String(req.body.email).toLowerCase().trim()
    const ownerEmail = String(req.body.decoded.email).toLowerCase().trim()
    if (email === ownerEmail) {throw new cError.InvalidRequestPayloadException(`Invitee has the same email of the invitor`)}
    const userRemote = await this.connService.addConn(USID, email, spaceId, spaceRole)
    //update profile strength
    await userSvc.updateProfileStrength(req.body.decoded.userId)
    res.json(resMapper.objReplaceKeyName(userRemote, '_id', 'id'))
  }

  async getConn(req: express.Request, res: express.Response) {
    const USID = req.body.RESERVED_USID
    const conns = await this.connService.getConn(USID)
    const userIds = conns.map(c => c.userId)
    const users = await userSvc.getUserByIds(userIds)
    res.json(resMapper.objReplaceKeyName(users, '_id', 'id'))
  }

  async removeConn(req: express.Request, res: express.Response) {
    const USID = req.body.RESERVED_USID
    const userIdRemote = req.params.userId
    const conn = await this.connService.deleteConn(USID, userIdRemote)
    if (conn) {
      const user = await userSvc.getUserById(conn.userId)
      //update profile strength
      await userSvc.updateProfileStrength(req.body.decoded.userId)
      res.json(resMapper.objReplaceKeyName(user, '_id', 'id'))
    } else {
      throw new cError.ResourceNotFoundException(`${userIdRemote} not found in your connection list`)
    }
  }

}

export const connController = ConnController.getInstance();