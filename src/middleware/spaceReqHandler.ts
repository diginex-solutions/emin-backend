import _ from 'lodash'
import express from 'express';
import { UserSpaceRole, UserSpacePosition } from '../types';
import { SpaceService } from '../services/spaceSvc';
const spaceSvc = SpaceService.getInstance()
const cError = require('../helper/customError');

class SpaceReqHandler {
  static INSTANCE: SpaceReqHandler;

  static getInstance(): SpaceReqHandler {
    if (!SpaceReqHandler.INSTANCE) {
      SpaceReqHandler.INSTANCE = new SpaceReqHandler();
    }
    return SpaceReqHandler.INSTANCE;
  }

  async query(req: express.Request, res: express.Response) {
    const { userId } = req.body.decoded
    const spaceId = req.params.spaceId || req.query.spaceId // params takes precendence
    try {
      const defaultSpace = await spaceSvc.findSpace({isPrivate: true})
      const useDefault = req.body.RESERVED_USE_DEFAULTSAPCE || !spaceId || String(spaceId).toLowerCase() === 'personal'
      const workingSpaceId = useDefault ? String(defaultSpace._id) : spaceId
      const userSpace = await spaceSvc.findMyUserSpace({userId,  spaceId: workingSpaceId, valid: true})
      req.body.RESERVED_USROLE = userSpace.role
      req.body.RESERVED_POSITION = userSpace.positionType
      req.body.RESERVED_SPACEID = userSpace.spaceId
      req.body.RESERVED_USID = String(userSpace._id)
      req.body.RESERVED_APPADMIN = String(defaultSpace._id) === String(userSpace.spaceId) && userSpace.role === UserSpaceRole.ADMIN
      const decoded = {decoded: {...req.body.decoded, RESERVED_USID: String(userSpace._id)}}
      _.assign(req, decoded)
    } catch (err) {
      throw new cError.ResourceNotFoundException(`${err}`)
    }
  }

  async loadAdmin(noReject: boolean ,req: express.Request, res: express.Response, next: express.NextFunction) {
    req.body.RESERVED_USE_DEFAULTSAPCE = true
    await this.query(req, res)
    if (req.body.RESERVED_APPADMIN === true || noReject) {
      next()
    } else {
      throw new cError.PermissionDeniedException(`Unauthorized access`)
    }
  }

  async load(req: express.Request, res: express.Response, next: express.NextFunction) {
    await this.query(req, res)
    next()
  }

  async matchRole(roles: UserSpaceRole[], req: express.Request, res: express.Response, next: express.NextFunction) {
    if (roles.includes(req.body.RESERVED_USROLE)){
      next()
    } else {
      throw new cError.PermissionDeniedException(`Required Role: ${roles}, User Role:${req.body.RESERVED_USROLE}`)
    }
  }

  async matchPosition(positions: UserSpacePosition[], req: express.Request, res: express.Response, next: express.NextFunction) {
    if (positions.includes(req.body.RESERVED_POSITION)){
      next()
    } else {
      throw new cError.PermissionDeniedException(`Required position: ${positions}, User position:${req.body.RESERVED_POSITION}`)
    }
  }

}

export const spaceReqHandler = SpaceReqHandler.getInstance();
