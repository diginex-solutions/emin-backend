import { validate } from 'class-validator';
import express from 'express';
import { CreateSpaceDto, SpaceSettingsDto, UserSpaceRespDto } from '../dto';
import { SpaceService } from '../services/spaceSvc';
const cError = require('../helper/customError')
const resMapper = require('../helper/resMapper.js')

class SpaceController {
  static INSTANCE: SpaceController;
  private spaceService: SpaceService;
  static getInstance(): SpaceController {
    if (!SpaceController.INSTANCE) {
      SpaceController.INSTANCE = new SpaceController();
    }
    return SpaceController.INSTANCE;
  }

  constructor() {
    this.spaceService = SpaceService.getInstance();
  }

  async createSpace(req: express.Request, res: express.Response) {
    const { userId } = req.body.authed;
    const createSpaceDto = new CreateSpaceDto(req.body);
    const errors = await validate(createSpaceDto);
    if (errors.length) {
      throw new cError.InvalidRequestPayloadException(errors.toString())
    }
    res.json(await this.spaceService.createSpace(createSpaceDto, userId));
  }

  async fetchMySpaces(req: express.Request, res: express.Response) {
    const { userId } = req.body.authed;
    res.json(await this.spaceService.fetchMySpaces(userId))
  }

  async fetchMySpaceById(req: express.Request, res: express.Response) {
    const { userId } = req.body.authed;
    const { spaceId } = req.params;
    const isAppAdmin = req.body.authed.RESERVED_APPADMIN
    const mySpaces = await this.spaceService.fetchMySpaces(userId)
    let s = mySpaces.find(s => String(s.id) === String(spaceId))
    if (!s && isAppAdmin) { // fetching space as App Admin
      const space = await this.spaceService.findSpaceById(spaceId)
      s = new UserSpaceRespDto({...space, id: String(space._id)})
    }

    if (s) {
      res.json(s)
    } else {
      throw new cError.ResourceNotFoundException(`Space not found with Id: ${spaceId}`)
    }
  }

  async updateSpaces(req: express.Request, res: express.Response) {
    const { userId } = req.body.authed;
    const { spaceId } = req.params
    const updateSpaceDto = new CreateSpaceDto(req.body);
    res.json(await this.spaceService.updateSpace(spaceId, updateSpaceDto, userId));
  }

  async adminUpdateSpace(req: express.Request, res: express.Response) {
    const { userId } = req.body.authed;
    const { spaceId } = req.params
    const updateSpaceDto = new SpaceSettingsDto(req.body);
    const validate = false
    const space = await this.spaceService.updateSpace(spaceId, updateSpaceDto, userId, validate)
    res.json(resMapper.objReplaceKeyName(space, '_id', 'id'))
  }

  async getAllSpaces(req: express.Request, res: express.Response) {
    const spaces = await this.spaceService.fetchAllSpaces(req.body.authed)
    res.json(spaces)
  }

  async getRegisteredUsers(req: express.Request, res: express.Response) {
    const { spaceId } = req.params
    const users = await this.spaceService.getRegisteredUsers(spaceId)

    const registeredUsers = (users || []).map(user => resMapper.objReplaceKeyName(user, '_id', 'id'))
    res.json(registeredUsers)
  }

  async getManagers(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID: spaceId } = req.body.authed
    const users = await this.spaceService.getManagers(spaceId)
    const managers = (users || []).map(user => resMapper.objReplaceKeyName(user, '_id', 'id'))    
    res.json(managers)
  }

  async addManager(req: express.Request, res: express.Response) {
    const { spaceId, managerId } = req.params
    const userSpace = await this.spaceService.addManager(spaceId, managerId)
    res.json(resMapper.objReplaceKeyName(userSpace, '_id', 'id'))    
  }

  async deleteManager(req: express.Request, res: express.Response) {
    const { spaceId, managerId } = req.params
    const userSpace = await this.spaceService.deleteManager(spaceId, managerId)
    res.json(resMapper.objReplaceKeyName(userSpace, '_id', 'id'))    
  }

}

export const spaceController = SpaceController.getInstance();