
import mongoose, { Schema } from 'mongoose';
import { UserSpace, UserSpacePosition, UserSpaceRole } from '../types';

const UserSpaceSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  spaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
  role: { type: String, required: true, enum: Object.values(UserSpaceRole), default: UserSpaceRole.EMPLOYEE },
  valid: { type: Boolean, required: true, default: true},
  positionType: { type: String, required: false, enum: Object.values(UserSpacePosition), default: UserSpacePosition.OTHERS }
}, {
  versionKey: false,
});

export default mongoose.model<UserSpace>('userSpace', UserSpaceSchema);