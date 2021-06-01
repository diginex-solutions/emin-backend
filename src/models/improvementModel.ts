import mongoose, { Schema } from 'mongoose';
import { Improvement } from '../types';
const improvementSchema: Schema = new Schema({
  spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
  text: { type: String, required: true },
  valid: { type: Boolean, required: true, default: true }
}, {
  versionKey: false
});

export default mongoose.model<Improvement>('Improvement', improvementSchema);