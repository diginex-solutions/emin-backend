
import mongoose, { Schema } from 'mongoose';
import { Case, CaseStatus, IssueType } from '../types';
const { jsonStringifyNullable } = require('../helper/util')

const CaseSchema: Schema = new Schema({
  formId: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String, default: '' },
  resolutionPlan: { type: String, default: '' },
  caseType: { type: String, default: '' , require: true},
  status: { type: String, required: true, enum: Object.values(CaseStatus) },
  issueType: { type: String, require: true, enum: Object.values(IssueType) },
  createdAt: { type: Number, required: true, default: Date.now },
  updatedAt: { type: Number, default: Date.now },
  caseNumber: { type: String, required: true, default: '' },
  spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true } 
}, {
  versionKey: false
});

export default mongoose.model<Case>('CaseV2', CaseSchema);