import _ from 'lodash'
import express from 'express';
import { UserSpaceRole, UserSpacePosition } from '../types';
import { SpaceService } from '../services/spaceSvc';
import { ExtAppService } from '../services/extAppSvc';
const spaceSvc = SpaceService.getInstance()
const extAppSvc = ExtAppService.getInstance()

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
    const { userId } = req.body.authed
    const { applicationId } = req.body.authed
    let extSpace
    if (applicationId) {
      extSpace = await extAppSvc.getExtAppByAppId(applicationId)
    }
    const spaceId =  req.params.spaceId || req.query.spaceId // params takes precendence
    try {
      const defaultSpace = await spaceSvc.findSpace({isPrivate: true})
      const useDefault = req.body.RESERVED_USE_DEFAULTSAPCE || !spaceId || String(spaceId).toLowerCase() === 'personal'
      const workingSpaceId = useDefault ? (extSpace ? String(extSpace.spaceId) : String(defaultSpace._id)) : String(spaceId)
      const userSpace = await spaceSvc.findMyUserSpace({userId,  spaceId: workingSpaceId, valid: true})
      req.body.authed.RESERVED_USROLE = userSpace.role
      req.body.authed.RESERVED_POSITION = userSpace.positionType
      req.body.authed.RESERVED_SPACEID = userSpace.spaceId
      req.body.authed.RESERVED_USID = String(userSpace._id)
      req.body.authed.RESERVED_APPADMIN = String(defaultSpace._id) === String(userSpace.spaceId) && userSpace.role === UserSpaceRole.ADMIN
      const multerHeader = {multerCustomHeader: {...req.body.authed, RESERVED_USID: String(userSpace._id)}}
      _.assign(req, multerHeader)
    } catch (err) {
      throw new cError.ResourceNotFoundException(`${err}`)
    }
  }

  async loadAdmin(noReject: boolean ,req: express.Request, res: express.Response, next: express.NextFunction) {
    req.body.RESERVED_USE_DEFAULTSAPCE = true
    await this.query(req, res)
    if (req.body.authed.RESERVED_APPADMIN === true || noReject) {
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
    if (roles.includes(req.body.authed.RESERVED_USROLE)){
      next()
    } else {
      throw new cError.PermissionDeniedException(`Required Role: ${roles}, User Role:${req.body.authed.RESERVED_USROLE}`)
    }
  }

  async matchPosition(positions: UserSpacePosition[], req: express.Request, res: express.Response, next: express.NextFunction) {
    if (positions.includes(req.body.authed.RESERVED_POSITION)){
      next()
    } else {
      throw new cError.PermissionDeniedException(`Required position: ${positions}, User position:${req.body.authed.RESERVED_POSITION}`)
    }
  }

}

export const spaceReqHandler = SpaceReqHandler.getInstance();
