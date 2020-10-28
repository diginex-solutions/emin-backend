
import mongoose, { Schema } from 'mongoose';
import { UserCase, UserCasePermission } from '../types';

const UserCaseSchema: Schema = new Schema({
  USID: { type: mongoose.Schema.Types.ObjectId, required: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, required: true },
  permission: { type: String, required: true, enum: Object.values(UserCasePermission) },
}, {
  versionKey: false
});

export default mongoose.model<UserCase>('UserCaseV2', UserCaseSchema);