
import mongoose, { Schema } from 'mongoose';
import { CaseEvent, EventAction } from '../types';
const { jsonStringifyNullable } = require('../helper/util')

const CaseEventSchema: Schema = new Schema({
  createdAt: { type: Number, required: true, default: Date.now },
  updatedAt: { type: Number },
  caseId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'CaseV2' },
  USID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'UserSpace' },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSpace' },
  action: { type: String, required: true, enum: Object.values(EventAction) },
  valid: { type: Number, default: 0, require: true }, // -1: deleted, 0 default
  data: { type: String },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  filename: { type: String },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSpace' },
  notified: { type: Boolean, default: false, required: true}
}, {
  versionKey: false
});

export default mongoose.model<CaseEvent>('CaseEvent', CaseEventSchema);