import express from 'express';
import { ChecklistService } from '../services/checklistSvc';
const cError = require('../helper/customError')

class ChecklistController {
  static INSTANCE: ChecklistController;
  private checklistService: ChecklistService;
  static getInstance(): ChecklistController {
    if (!ChecklistController.INSTANCE) {
      ChecklistController.INSTANCE = new ChecklistController();
    }
    return ChecklistController.INSTANCE;
  }

  constructor() {
    this.checklistService = ChecklistService.getInstance();
  }

  async addDocumentType(req: express.Request, res: express.Response) {
    const { spaceId } = req.params
    const { title, description } = req.body
    res.json(await this.checklistService.addDocumentType(spaceId, title, description))
  }

  async fetchDocumentTypes(req: express.Request, res: express.Response) {
    const { spaceId } = req.params
    res.json(await this.checklistService.fetchDocumentTypes(spaceId))
  }

  async removeDocumentType(req: express.Request, res: express.Response) {
    const { spaceId, documentTypeId } = req.params
    res.json(await this.checklistService.removeDocumentType(spaceId, documentTypeId))
  }


}

export const checklistController = ChecklistController.getInstance();