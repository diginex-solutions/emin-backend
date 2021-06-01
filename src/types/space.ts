import mongoose, { Document } from 'mongoose';
import { CreateSpaceDto } from '../dto';
type ObjectId = mongoose.Types.ObjectId
export interface Space extends Document {
  _id: ObjectId;
  name: string;
  description?: string;
  icon?: string;
  isUserDirectory: boolean;
  allowInviteAll: boolean;
  isPrivate: boolean;
  isCases: boolean;
  isDashboard: boolean;
  isForms: boolean;
  isOrganization: boolean;
  isChecklist: boolean;
  isSupport: boolean;
  userLimit: number;
}

export interface UserSpace extends Document {
  _id: ObjectId | string;
  userId: ObjectId | string;
  spaceId: ObjectId | string;
  role: UserSpaceRole;
  valid: boolean;
  positionType: UserSpacePosition;
}

export enum UserSpaceRole {
    ADMIN = 'admin',
    // MANAGER = 'manager',
    // RECRUITER = 'recruiter',
    EMPLOYEE = 'employee',
}

export const initSpace = (input: CreateSpaceDto): Partial<Space> => {
  return {
    _id: mongoose.Types.ObjectId(),
    name: input.name,
    description: input.description,
    icon: input.icon,
    isUserDirectory: input.isUserDirectory,
    allowInviteAll: input.allowInviteAll,
  }
}

export const initUserSpace = (userId: ObjectId, spaceId: ObjectId, role: UserSpaceRole): Partial<UserSpace> => {
  return {
    _id: mongoose.Types.ObjectId(),
    userId,
    spaceId,
    role
  }
}

export enum UserSpacePosition {
  MANAGER = 'manager',
  OTHERS = 'others'
}
