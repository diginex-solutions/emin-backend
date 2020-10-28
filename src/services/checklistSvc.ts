import documentTypeModel from '../models/documentTypeModel';
import { DocumentType } from '../types';
const cError = require('../helper/customError');
const constants = require('../constants')

export class ChecklistService {

  static INSTANCE: ChecklistService;
  static getInstance(): ChecklistService {
    if (!ChecklistService.INSTANCE) {
      ChecklistService.INSTANCE = new ChecklistService();
    }
    return ChecklistService.INSTANCE;
  }

  async addDocumentType(spaceId: string, title: string, description: string): Promise<DocumentType> {
    const options = { upsert: true, new: true }
    return await documentTypeModel.findOneAndUpdate({ title }, { spaceId, title, description }, options)
  }

  async ensureDefaultDocumentTypes(spaceId: string) {
    const defaultDocumentTypes =
      ["EmploymentContract", "Visa", "Passport",
        "Medical", "CV_Resume", "Insurance",
        "Residential_Accommodation", "ID",
        "DriversLicense", "Certificates", "Education",
        "Financial", "Receipts", "Training"]
    defaultDocumentTypes.forEach(async (title: string) => {
      const options = { upsert: true, new: true }
      await documentTypeModel.findOneAndUpdate({ title }, { spaceId, title }, options)
    })
    return true;
  }

  async fetchDocumentTypes(spaceId: string): Promise<DocumentType[]> {
    return await documentTypeModel.find({ spaceId })
  }

  async removeDocumentType(spaceId: string, id: string): Promise<DocumentType> {
    return await documentTypeModel.findByIdAndDelete({ spaceId, _id: id })
  }

  async fetchDocumentType(spaceId: string, title: string): Promise<DocumentType> {
    return await documentTypeModel.findOne({ spaceId, title })
  }
}

export const checklistSvc = new ChecklistService();


