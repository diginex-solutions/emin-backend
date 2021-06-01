import { validate } from 'class-validator';
import express from 'express';
import { CreateCaseDto } from '../dto';
import { CaseService } from '../services/caseSvcV2';
import { SpaceService } from '../services/spaceSvc';
const spaceSvc = SpaceService.getInstance()
const cError = require('../helper/customError')
const resMapper = require('../helper/resMapper.js')

interface CustomExpressRequest extends express.Request {
  decoded: {
      userId: string
      RESERVED_USID: string
  }
  trustVersionFileId: string
  trustVersionFileIds: {
    [key: string]: Array<{ 
      originalname: string; 
      id: string 
    }> 
  }
  time: number
}

class CaseController {
  static INSTANCE: CaseController;
  private caseService: CaseService;
  static getInstance(): CaseController {
    if (!CaseController.INSTANCE) {
      CaseController.INSTANCE = new CaseController();
    }
    return CaseController.INSTANCE;
  }

  constructor() {
    this.caseService = CaseService.getInstance();
  }

  async createCase(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID } = req.body
    const { RESERVED_USID } = req.body
    const createCaseDto = new CreateCaseDto(req.body)
    const errors = await validate(createCaseDto);
    if (errors.length) {
      throw new cError.InvalidRequestPayloadException(errors.toString())
    }

    const caseResp = await this.caseService.newCase(RESERVED_USID, RESERVED_SPACEID, createCaseDto, req.body.RESERVED_TIME)
    res.json(resMapper.objReplaceKeyName(caseResp, '_id', 'id'))
  }

  async getMyCases(req: express.Request, res: express.Response) {
    const cases = await this.caseService.listMyCases(req.body.RESERVED_USID, req.body.RESERVED_POSITION)
    res.json(cases.map(c => resMapper.objReplaceKeyName(c, '_id', 'id')))
  }

  async _addCaseType(req: express.Request, res: express.Response) {
    const caseTypes = req.body
    const spaceId = req.query.spaceId || req.body.RESERVED_SPACEID
    const space = await spaceSvc.findSpaceById(spaceId)
    if (space) {
      const caseTypesRes = await this.caseService.addCaseType(spaceId, caseTypes)
      res.json(resMapper.objReplaceKeyName(caseTypesRes, '_id', 'id'))
    } else {
      throw new cError.InvalidRequestPayloadException(`Invalid space with Id: ${spaceId}`)
    }
  }

  async getCaseTypes(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID } = req.body
    const caseTypes = await this.caseService.fetchAllTypes(RESERVED_SPACEID)
    const caseTypeList = caseTypes.map(ct => ct.value)
    res.json(caseTypeList)
  }

  commentValidate(comment) {
    if (!(typeof comment === 'string' && comment.length >= 2 && comment.length <= 1000)) {
      throw new cError.InvalidRequestPayloadException(`Comment must have number of characters between 2 to 1000.`)
    } else {
      return comment
    }
  }

  async comment(req: express.Request, res: express.Response) {
    const { RESERVED_USID } = req.body
    const { caseId } = req.params
    const comment = this.commentValidate(req.body.comment)
    const event = await this.caseService.comment(RESERVED_USID, caseId, comment, req.body.RESERVED_TIME)
    res.json(event)
  }

  async deleteComment(req: express.Request, res: express.Response) {
    const { RESERVED_USID } = req.body
    const { commentId } = req.params
    const event = await this.caseService.deleteComment(RESERVED_USID, commentId, req.body.RESERVED_TIME)
    res.json(event)
  }

  async updateComment(req: express.Request, res: express.Response) {
    const { RESERVED_USID } = req.body
    const { commentId } = req.params
    const comment = this.commentValidate(req.body.comment)
    const event = await this.caseService.updateComment(RESERVED_USID, commentId, comment)
    res.json(event)
  }

  async updateCase(req: express.Request, res: express.Response) {
    this.caseService.validateUpdateOrCloseCase(req.body)
    const { RESERVED_USID, RESERVED_SPACEID: spaceId, RESERVED_POSITION } = req.body
    const { caseId } = req.params
    const caseObj = await this.caseService.updateCase(RESERVED_USID, caseId, req.body, req.body.RESERVED_TIME, spaceId, RESERVED_POSITION)
    res.json(resMapper.cases(caseObj))
  }

  async addUser(req: express.Request, res: express.Response) {
    const { userId, RESERVED_SPACEID: spaceId, RESERVED_USID } = req.body
    const { caseId } = req.params
    const remoteUs = await spaceSvc.findMyUserSpace({userId, spaceId, valid: true})
    const remoteUSID = remoteUs._id
    const { user, event  }= await this.caseService.addUser(RESERVED_USID, caseId, String(remoteUSID), req.body.RESERVED_TIME)
    res.json({ 
      user: resMapper.users(user), 
      event }
    )
  }

  async uploadCaseFile(req: CustomExpressRequest, res: express.Response) {
    const caseId = req.params.caseId
    const USID = req.decoded.RESERVED_USID

    const { trustVersionFileId, time } = req
    const { shaHash = '', blobSize = 0, url = '', originalname = '' } = req.file as Express.Multer.File & {
      url: string;
      blobSize: number;
      shaHash: string;
    }

    const storage = url.split('?')[0]

    const eventUploaded = await this.caseService.uploadFile(
      caseId,
      USID,
      trustVersionFileId,
      originalname,
      blobSize,
      storage,
      shaHash,
      time,
    )

    res.json(eventUploaded)
  }

  async uploadCaseFiles(req: CustomExpressRequest, res: express.Response) {
    const caseId = req.params.caseId
    const { RESERVED_USID } = req.decoded
    const { files, trustVersionFileIds = {}, time } =  req || {}

    const eventUploadPromises = (files as Express.Multer.File[]).map(async firstFile => {
      const { shaHash = '', blobSize = 0, url = '', originalname = '' } = firstFile as Express.Multer.File & {
        url: string;
        blobSize: number;
        shaHash: string;
      }

      const storage = url.split('?')[0];
      const trustVersionFileArray = trustVersionFileIds[firstFile.fieldname]
      const trustVersionFile = (trustVersionFileArray || []).find(item => item.originalname === firstFile.originalname)
      const trustVersionFileId = trustVersionFile ? trustVersionFile.id : ''
      return await this.caseService.uploadFile(
        caseId,
        RESERVED_USID,
        trustVersionFileId,
        originalname,
        blobSize,
        storage,
        shaHash,
        time,
      )
    })
    res.json(await Promise.all(eventUploadPromises))
  }
}

export const caseController = CaseController.getInstance();