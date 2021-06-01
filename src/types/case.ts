import mongoose, { Document } from 'mongoose';
type ObjectId = mongoose.Types.ObjectId
export interface Case extends Document {
  createdAt: number;
  updatedAt: number;
  formId?: ObjectId;
  description: string;
  resolutionPlan: string;
  caseType: string;
  status: CaseStatus;
  issueType: IssueType;
  caseNumber: String;
}

export enum CaseStatus {
  NEW = 'new',
  INPROGRESS = 'inProgress',
  CLOSED = "closed"
}

export enum IssueType {
  OTHERS = 'others',
  GRIEVANCE = 'grievance'
}

// usercase col
export interface UserCase extends Document {
  USID: ObjectId;
  caseId: ObjectId;
  permission: UserCasePermission;
}

export enum UserCasePermission {
  OWNER = 'owner',
  ASSIGNEDTO = 'assignedTo',
  RELATEDTO = 'relatedTo',
  MEMBER = 'member'
}

// case type col
export interface CaseType extends Document {
  value: string;
  spaceId?: ObjectId;
}

// case event col
export interface CaseEvent extends Document {
  createdAt: number;
  updatedAt: number;
  caseId: ObjectId;
  USID: ObjectId;
  recipientId: ObjectId;
  action: EventAction;
  valid: number;
  data: string;
  fileId: ObjectId;
  filename: string;
  managerId: string
}

export enum EventAction {
  COMMENT = "comment",
  USER_JOIN = "userJoin",
  FILE_UPLOAD = "file",
  CASE_NEW = "caseNew",
  CASE_IN_PROGRESS = "caseInProgress",
  CASE_CLOSED = "caseClosed",
  MANAGER_ASSIGNED = "managerAssigned",
  MANAGER_REMOVED = "managerRemoved",
}

export enum FileCategory {
  EMPTY = 'empty',
  CASE = 'case',
  FILE = 'file',
}
