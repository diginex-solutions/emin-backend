const USER_TYPE = {
  normal: 'normal',
  superUser: 'superUser',
  diginexAdmin: 'diginexAdmin',
}

const HISTORY_ACTION = {
  view: 'view',
  create: 'create',
  share: 'Share',
  unshare: 'unshare',
  renamed: 'renamed',
  archived: 'archived',
  restored: 'restored',
  actionCreated: 'action_created',
  actionAccepted: 'action_accepted',
  actionRejected: 'action_rejected',
  actionReceived: 'action_received',
  actionUpdated: 'action_updated',
  newVersion: 'new_version',
  categoryAdded: 'category_added',
  upload: 'Upload',
  verify: 'Verify',
}

const FORM_ACTION = {
  pending: { text: 'pending', historyAction: HISTORY_ACTION.actionCreated },
  received: { text: 'received', historyAction: HISTORY_ACTION.actionReceived },
  rejected: { text: 'rejected', historyAction: HISTORY_ACTION.actionRejected },
  accepted: { text: 'accepted', historyAction: HISTORY_ACTION.actionAccepted },
}

const LINK_TYPE = {
  actions: 'actions',
  shared: 'shared',
}

const SETTING_TYPE = {
  userConfig: 'user_config',
}

const LANGUAGES = {
  default: 'en',
  en: 'en',
  hi: 'hi',
  ur: 'ur',
}

const getSupportLang = (name) => {
  const _name = String(name).trim().toLowerCase()
  return LANGUAGES[_name] ? LANGUAGES[_name] : LANGUAGES.default
}

const ACCESS = {
  sharing: 'sharing',
  owner: 'owner',
}

const MODEL = {
  ACCESS,
}

const RIGHT_TYPE = {
  FORM: 'FORM',
  SHARE: 'SHARE',
  GROUP: 'GROUP',
}

const RIGHTS = {
  READ: 0b1,
}

const RESERVED_PATH = {
  SHARED: '/Shared',
  ARCHIVED: '/Archived',
  CHECKLIST: '/Checklist',
  DOCUMENT: '/Document',
}

const isReservedPath = (normalizedPath) => {
  const reservedArr = Object.values(RESERVED_PATH).map((i) => String(i).toLowerCase())
  return reservedArr.indexOf(String(normalizedPath).toLowerCase()) > -1 ? true : false
}

const INPUT_SCHEMA_TYPE = {
  TEXT: 'text',
  NUMBER: 'number',
  CHECKBOX: 'checkbox',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  DATE: 'date',
  TIME: 'time',
  COUNTRY: 'country',
}

const EVENT_TYPE = {
  COMMENT: 'comment',
  STATUS_OPENED: 'status_opened',
  STATUS_CLOSED: 'status_closed',
  USER_JOIN: 'user_join',
  FILE_UPLOAD: 'file',
}

const FILE_CATEGORY = {
  EMPTY: 'empty',
  CASE: 'case',
  FILE: 'file',
}

const DOCUMENT_TYPE = {
  EmploymentContract: 'EmploymentContract',
  Visa: 'Visa',
  Passport: 'Passport',
  Medical: 'Medical',
  CV_Resume: 'CV_Resume',
  Insurance: 'Insurance',
  Residential_Accommodation: 'Residential_Accommodation',
  ID: 'ID',
  DriversLicense: 'DriversLicense',
  Certificates: 'Certificates',
  Education: 'Education',
  Financial: 'Financial',
  Receipts: 'Receipts',
  Training: 'Training',
  Other: 'Other',
}

const DOCUMENT_TYPES = [
  'EmploymentContract',
  'Visa',
  'Passport',
  'Medical',
  'CV_Resume',
  'Insurance',
  'Residential_Accommodation',
  'ID',
  'DriversLicense',
  'Certificates',
  'Education',
  'Financial',
  'Receipts',
  'Training',
  'Other',
]

const FORM_TYPE = {
  FORM: 'form',
  VERIFICATION: 'verification',
}

const EXT_AUTH_PATH = {
  documents: '/ext/documents',
}

const CHECKLIST_ACTION = {
  upload: 'upload',
  delete: 'delete',
  share: 'share',
  approve: 'approve',
  reject: 'reject'
}

const CHECKLIST_STATUS = {
  notUploaded: 'not uploaded',
  notShared: 'not shared',
  notVerify: 'not verify',
  verified: 'verified',
  rejected: 'rejected',
}

const NOTIFICATION_TYPE = {
  share: 'share',
  approve: 'approve',
  reject: 'reject',
}

const APP_CONFIG = {
  notificationLink: "https://safestep.page.link/notifications",
  listDocumentTypes: ["verbal_contract","photo","passport","skill_training","language_training","education","work_visa","visa_authorisation_number","employment_agreement_contract","medical_test","temporary_visa", "smart_card","air_travel","work_and_residence_permit","proof_of_payment"]
}

const FEED_ACTION = {
  upload: 'has uploaded'
}

const MASTER_DATA = {
  checklistCategory: [
    {
      "id": "1",
      "name": "visa_checklist",
      "department": "Immigration Office",
      "address": "507 Soi Suanplu, Thungmahamek, Sathorn, Bangkok 10120",
      "description": null,
      "instruction": "If you have a valid Visa upload it here. Otherwise you may need to obtain the other documents listed below first and then apply for the Visa.",
      "documentPath": [
        "valid_ci_holder",
        "expired_pink_card"
      ],
      "requiredCriteria": "secondary",
      "order": 1
    },
    {
      "id": "2",
      "name": "work_permit_checklist",
      "department": "Obtained from the Department of Employment",
      "address": "Mitmaitri Road, Dindaeng Bangkok 10400, Thailand. ",
      "description": "",
      "instruction": "If you have a valid Work Permit upload it here. Otherwise you may need to obtain the other documents listed below first and then apply for the Work Permit.",
      "documentPath": [
        "valid_ci_holder",
        "expired_pink_card"
      ],
      "requiredCriteria": "secondary",
      "order": 2,
    },
    {
      "id": "3",
      "name": "pink_card_checklist",
      "department": "Ministry of Interior",
      "address": "Ashtanga Road Ashram Phra Nakhon Bangkok 10200",
      "description": "",
      "instruction": "If you have a valid Pink Card upload it here. Otherwise you may need to obtain the other documents listed below first and then apply for the Pink Card.",
      "documentPath": [
        "valid_ci_holder",
        "expired_pink_card"
      ],
      "requiredCriteria": "secondary",
      "order": 3,
    },
    {
      "id": "4",
      "name": "seabook_checklist",
      "department": "",
      "address": "",
      "description": "You need to satisfy the requirements of 3 sections before you can obtain the Seabook",
      "instruction": "",
      "documentPath": [
        "valid_ci_holder",
        "expired_pink_card"
      ],
      "requiredCriteria": "primary",
      "order": 4
    }
  ],

  checklistDocument: [
    {
      "id": "1",
      "docId": "visa1",
      "documentType": "visa",
      "description": "Official document that allows the bearer to legally enter a foreign country.",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "visa_checklist",
          "group": "visa",
          "requiredCriteria": "primary",
          "serialNo": 1
        },
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "pink_card_checklist",
          "group": "personal",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 3
        },
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "seabook_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 4
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "visa_checklist",
          "group": "visa",
          "requiredCriteria": "primary",
          "serialNo": 1
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "pink_card_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 4
        }
      ]
    },
    {
      "id": "2",
      "docId": "p1",
      "documentType": "certificate_of_id",
      "description": "Issued for a traveler who does not have a usable Thai passport.",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "visa_checklist",
          "group": "personal",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 2
        },
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "pink_card_checklist",
          "group": "personal",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 2
        },
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "seabook_checklist",
          "group": "personal",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 2
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "visa_checklist",
          "group": "personal",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 2
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "pink_card_checklist",
          "group": "personal",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 2
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "seabook_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "displayGroup": true,
          "serialNo": 2
        }
      ]
    },
    {
      "id": "3",
      "docId": "p2",
      "documentType": "passport",
      "description": "If you have a Passport upload a file containing all pages of the Passport.",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "visa_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 3
        },
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "seabook_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 3
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "visa_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 3
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "pink_card_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 3
        }
      ]
    },
    {
      "id": "4",
      "docId": "p3",
      "documentType": "medical_certificate",
      "description": "Written statement from a physician or another medically qualified health care provider",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "visa_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 4
        },
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "pink_card_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 5
        },
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "seabook_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 7
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "visa_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 4
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "pink_card_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 6
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "seabook_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 5
        }
      ]
    },
    {
      "id": "5",
      "docId": "p4",
      "documentType": "map_of_workplace",
      "description": "locations map image. It can be hand drawn",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "visa_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 5
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "visa_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 5
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "work_permit_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 7
        }
      ]
    },
    {
      "id": "6",
      "docId": "g1",
      "documentType": "immigration_office_form",
      "description": "Filled in Immigration Office form",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "visa_checklist",
          "group": "government_forms",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 6
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "visa_checklist",
          "group": "government_forms",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 6
        }
      ]
    },
    {
      "id": "7",
      "docId": "e1",
      "documentType": "employment_letter",
      "description": "Letter of employment issues by Employer",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "visa_checklist",
          "group": "employer_supplied",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 7
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "visa_checklist",
          "group": "employer_supplied",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 7
        }
      ]
    },
    {
      "id": "8",
      "docId": "e2",
      "documentType": "quota_letter",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "visa_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 8
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "visa_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 8
        }
      ]
    },
    {
      "id": "9",
      "docId": "e3",
      "documentType": "national_id_of_employer",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "visa_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 9
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "visa_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 9
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "work_permit_checklist",
          "group": "employer_supplied",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 4
        }
      ]
    },
    {
      "id": "10",
      "docId": "e4",
      "documentType": "house_registration_of_employer",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "visa_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 10
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "visa_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 10
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "work_permit_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 5
        }
      ]
    },
    {
      "id": "11",
      "docId": "w1",
      "documentType": "work_permit",
      "description": "Issued for a traveler who does not have a usable Thai passport.",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "work_permit_checklist",
          "group": "work_permit",
          "requiredCriteria": "primary",
          "serialNo": 1
        },
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "pink_card_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 4
        },
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "seabook_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 5
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "work_permit_checklist",
          "group": "work_permit",
          "requiredCriteria": "primary",
          "serialNo": 1
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "pink_card_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 5
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "seabook_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 3
        }
      ]
    },
    {
      "id": "12",
      "docId": "g2",
      "documentType": "work_permit_application_form",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "work_permit_checklist",
          "group": "government_forms",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 2
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "work_permit_checklist",
          "group": "government_forms",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 2
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "seabook_checklist",
          "group": "government_forms",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 7
        }
      ]
    },
    {
      "id": "13",
      "docId": "g3",
      "documentType": "employment_contract_form_for_fisher",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "work_permit_checklist",
          "group": "government_forms",
          "requiredCriteria": "secondary",
          "serialNo": 3
        },
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "seabook_checklist",
          "group": "government_forms",
          "requiredCriteria": "secondary",
          "serialNo": 10
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "work_permit_checklist",
          "group": "government_forms",
          "requiredCriteria": "secondary",
          "serialNo": 3
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "seabook_checklist",
          "group": "government_forms",
          "requiredCriteria": "secondary",
          "serialNo": 8
        }
      ]
    },
    {
      "id": "14",
      "docId": "e5",
      "documentType": "employment_certification_form",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "work_permit_checklist",
          "group": "employer_supplied",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 4
        }
      ]
    },
    {
      "id": "15",
      "docId": "e6",
      "documentType": "employment_contract",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "work_permit_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 5
        },
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "seabook_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 12
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "seabook_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 10
        }
      ]
    },
    {
      "id": "16",
      "docId": "e7",
      "documentType": "employer_identity_document",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "work_permit_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 6
        }
      ]
    },
    {
      "id": "17",
      "docId": "e8",
      "documentType": "employer_passport",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "checklistCategoryId": "2",
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "work_permit_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 7
        }
      ]
    },
    {
      "id": "18",
      "docId": "e9",
      "documentType": "employer_certificate_of_residence",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "checklistCategoryId": "2",
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "work_permit_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 8
        }
      ]
    },
    {
      "id": "19",
      "docId": "e10",
      "documentType": "business_license_certificate",
      "description": "Certificate issued by a government agency certifying that the employer’s business is registered, or authorized to establish, or legally approved. The document must also show category of the business (if any)",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "checklistCategoryId": "2",
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "work_permit_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 9
        }
      ]
    },
    {
      "id": "20",
      "docId": "pink1",
      "documentType": "pink_card",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "pink_card_checklist",
          "group": "pink_card",
          "requiredCriteria": "primary",
          "serialNo": 1
        },
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "seabook_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 6
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "pink_card_checklist",
          "group": "pink_card",
          "requiredCriteria": "primary",
          "serialNo": 1
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "seabook_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 4
        }
      ]
    },
    {
      "id": "21",
      "docId": "sea1",
      "documentType": "seabook",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "seabook_checklist",
          "group": "seabook",
          "requiredCriteria": "primary",
          "serialNo": 1
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "seabook_checklist",
          "group": "seabook",
          "requiredCriteria": "primary",
          "serialNo": 1
        }
      ]
    },
    {
      "id": "22",
      "docId": "p5",
      "documentType": "photo",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "seabook_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 8
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "seabook_checklist",
          "group": "personal",
          "requiredCriteria": "secondary",
          "serialNo": 6
        }
      ]
    },
    {
      "id": "23",
      "docId": "g4",
      "documentType": "seabook_request_form",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "seabook_checklist",
          "group": "government_forms",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 9
        }
      ]
    },
    {
      "id": "24",
      "docId": "e11",
      "documentType": "vessel_registration",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "seabook_checklist",
          "group": "employer_supplied",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 11
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "seabook_checklist",
          "group": "employer_supplied",
          "displayGroup": true,
          "requiredCriteria": "secondary",
          "serialNo": 9
        }
      ]
    },
    {
      "id": "24",
      "docId": "e12",
      "documentType": "fishing_crew_list",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "seabook_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 13
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "seabook_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 11
        }
      ]
    },
    {
      "id": "25",
      "docId": "e13",
      "documentType": "fishing_authorization_permission_document",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "valid_ci_holder",
          "checklistCategory": "seabook_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 14
        },
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "seabook_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 12
        }
      ]
    },
    {
      "id": "26",
      "docId": "e14",
      "documentType": "commercial_trade_registration",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "work_permit_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 6
        }
      ]
    },
    {
      "id": "27",
      "docId": "e15",
      "documentType": "image_of_work_condition",
      "status": "not_uploaded",
      "files": [],
      "expiredAt": null,
      "locations": [
        {
          "documentPath": "expired_pink_card",
          "checklistCategory": "work_permit_checklist",
          "group": "employer_supplied",
          "requiredCriteria": "secondary",
          "serialNo": 8
        }
      ]
    }
  ],
  documentPath: [
    {
        "name": "expired_pink_card",
        "order": 1,
    },
    {
        "name": "valid_ci_holder",
        "order": 2,
    },
    {
        "name": "unknown_doc_path",
        "order": 3,
    }
  ],
}

const DOCUMENT_STATUS = {
  notShared: 'Not Shared',
  shared: 'Shared',
  verified: 'Verified',
  rejected: 'Rejected',
}

const TEZOS_HASH = "Waiting for upload to blockchain..."
const TEZOS_MESSAGE = "Display blockchain hash address"

module.exports = {
  HISTORY_ACTION,
  FORM_ACTION,
  LINK_TYPE,
  SETTING_TYPE,
  LANGUAGES,
  getSupportLang,
  MODEL,
  RIGHTS,
  RIGHT_TYPE,
  RESERVED_PATH,
  isReservedPath,
  INPUT_SCHEMA_TYPE,
  USER_TYPE,
  EVENT_TYPE,
  FILE_CATEGORY,
  FORM_TYPE,
  DOCUMENT_TYPE,
  DOCUMENT_TYPES,
  EXT_AUTH_PATH,
  CHECKLIST_ACTION,
  CHECKLIST_STATUS,
  NOTIFICATION_TYPE,
  APP_CONFIG,
  FEED_ACTION,
  MASTER_DATA,
  DOCUMENT_STATUS,
  TEZOS_HASH,
  TEZOS_MESSAGE
}
