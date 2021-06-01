
import mongoose, { Schema } from 'mongoose';
import { Space } from '../types';
const SpaceSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  icon: { type: String, required: false },
  isUserDirectory: { type: Boolean, required: true, default: true},
  isPrivate: { type: Boolean, required: true, default: false}, // reserved
  allowInviteAll: { type: Boolean, required: true, default: true},
  isCases: { type: Boolean, required: true, default: false },
  isDashboard: { type: Boolean, required: true, default: false },
  isForms: { type: Boolean, required: true, default: false },
  isOrganization: { type: Boolean, required: true, default: false },
  userLimit: { type: Number, required: true, default: 10 },
  isChecklist: { type: Boolean, required: true, default: false },
  isSupport: { type: Boolean, required: true, default: false },
}, {
  versionKey: false,
});

export default mongoose.model<Space>('space', SpaceSchema);