const USER_TYPE = {
  normal: 'normal',
  superUser: 'superUser',
  diginexAdmin: 'diginexAdmin',
}

const HISTORY_ACTION = {
  view: 'view',
  create: 'create',
  share: 'share',
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
  th: 'th'
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
}
