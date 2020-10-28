
import mongoose, { Schema } from 'mongoose';
import { CaseType } from '../types';
const CaseTypeSchema: Schema = new Schema({
  spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
  value: { type: String, required: true }
}, {
  versionKey: false,
});

export default mongoose.model<CaseType>('CaseType', CaseTypeSchema);