
import mongoose, { Schema } from 'mongoose';
import { Conn } from '../types';
const ConnSchema: Schema = new Schema({
  ownerUSID: { type: Schema.Types.ObjectId, ref: 'userSpace', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  valid: { type: Boolean, required: true, default: true }
}, {
  versionKey: false,
});

export default mongoose.model<Conn>('connection', ConnSchema);