import _ from 'lodash'
import extAppModel from '../models/extAppModel';
import { ExtApp } from '../types';
import { CreateExtAppDto, CreateSpaceDto } from '../dto';
import { SpaceService } from './spaceSvc'
const spaceSvc = SpaceService.getInstance()
const cError = require('../helper/customError')

export class ExtAppService {

  static INSTANCE: ExtAppService;
  static getInstance(): ExtAppService {
    if (!ExtAppService.INSTANCE) {
      ExtAppService.INSTANCE = new ExtAppService();
    }
    return ExtAppService.INSTANCE;
  }

  async getExtAppByAppId(applicationId: string): Promise<ExtApp> {
    return await extAppModel.findOne({applicationId: String(applicationId).toLowerCase()})
  }

  async readAppPubKey(): Promise<ExtApp[]> {
    return extAppModel.find({})
  }

  async createExtApp(dto: CreateExtAppDto): Promise<ExtApp> {
    try{
      const extAppExisting = await extAppModel.findOne({applicationId: dto.applicationId})
      if (extAppExisting) throw new cError.InvalidRequestPayloadException(`${dto.applicationId} already exists`)
      const createSpaceReq = new CreateSpaceDto({
        name: dto.applicationId,
        description: `Space for App: ${dto.applicationId}`,
        icon: "mdi-home"
      })
      const space = await spaceSvc._createPureSpace(createSpaceReq)
      console.log('space???', space);

      if (space) {
        const extAppReq = {
          applicationId: dto.applicationId,
          pubKey: dto.pubKey,
          spaceId: space._id,
          notificationLink: dto.notificationLink
        }
        return await extAppModel.create(extAppReq);
      } else {
        throw new cError.InternalServerError(`Unable to create space`)
      }

    } catch (err) {
      throw new cError.InvalidRequestPayloadException(`${err}`)
    }
  }

}
