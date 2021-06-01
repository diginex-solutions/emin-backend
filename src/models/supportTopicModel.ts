
import mongoose, { Schema } from 'mongoose';
import { SupportTopic } from '../types';
const SupportTopicSchema: Schema = new Schema({
  spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
  name: { type: String, required: true },
  icon: { type: String },
  valid: { type: Boolean, required: true, default: true }
}, {
  versionKey: false,
});

export default mongoose.model<SupportTopic>('supportTopic', SupportTopicSchema);