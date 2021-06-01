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
    // const defaultDocumentTypes =
    //   ["EmploymentContract", "Visa", "Passport",
    //     "Medical", "CV_Resume", "Insurance",
    //     "Residential_Accommodation", "ID",
    //     "DriversLicense", "Certificates", "Education",
    //     "Financial", "Receipts", "Training"]
    const defaultDocumentTypes = [
      {
        title: "verbal_contract",
        description:"voice_recording_outlining_the_terms_of_the_contract"
      },
      {
        title: "photo",
        description:"selfie_or_photo_id_in_passport_format"
      },
      {
        title: "passport",
        description:"official_travel_document_issued_by_a_government"
      },
      {
        title: "skill_training",
        description:"evidence_of_training_undertaken"
      },
      {
        title: "language_training",
        description:"evidence_of_language_training_undertaken"
      },
      {
        title: "education",
        description:"academic_certificates"
      },
      {
        title: "work_visa",
        description:"authorisation_to_take_a_job_in_another_country"
      },
      {
        title: "visa_authorisation_number",
        description:"details_of_visa_authorisation_number"
      },
      {
        title: "employment_agreement_contract",
        description:"defines_terms_and_conditions_of_employment"
      },
      {
        title: "medical_test",
        description:"test_results_from_medical_examinations"
      },
      {
        title: "temporary_visa",
        description:"confirmation_of_flights"
      },
      {
        title: "work_and_residence_permit",
        description:"permit_that_allows_for_working_and_residing_in_host_country"
      },
      {
        title: "smart_card",
        description:"national_identity_card"
      },
      {
        title: "air_travel",
        description:"test_results_from_medical_examinations"
      },
      {
        title: "proof_of_payment",
        description:"copies_of_receipts_from_payments_you_have_made"
      },
    ]
    //remove wrong types
    const wrongData = await documentTypeModel.find({ spaceId })
    wrongData.forEach(async (item) =>{
      if (!defaultDocumentTypes.map(x=>x.title).includes(item.title)){
        await documentTypeModel.deleteOne({_id: item.id})
      }
    }
    )

    defaultDocumentTypes.forEach(async (item) => {
      const options = { upsert: true, new: true }
      await documentTypeModel.findOneAndUpdate({ title: item.title }, { spaceId, title: item.title, description: item.description }, options)
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


