import _ from 'lodash'
import { validate } from 'class-validator';
import express from 'express';
import { ExtAppService } from '../services/extAppSvc';
import { CreateExtAppDto } from '../dto';
const cError = require('../helper/customError')
const resMapper = require('../helper/resMapper.js')

class ExtAppController {
  static INSTANCE: ExtAppController;
  private extAppService: ExtAppService;
  static getInstance(): ExtAppController {
    if (!ExtAppController.INSTANCE) {
      ExtAppController.INSTANCE = new ExtAppController();
    }
    return ExtAppController.INSTANCE;
  }

  constructor() {
    this.extAppService = ExtAppService.getInstance();
  }

  async createExtApp(req: express.Request, res: express.Response) {
    const createExtAppDto = new CreateExtAppDto(req.body)
    const errors = await validate(createExtAppDto);
    if (errors.length) {
      throw new cError.InvalidRequestPayloadException(errors.toString())
    }
    const extApp = await this.extAppService.createExtApp(createExtAppDto)
    res.json(resMapper.objReplaceKeyName(extApp, '_id', 'id'))
  }

}

export const extAppController = ExtAppController.getInstance();