
import mongoose, { Schema } from 'mongoose';
import { DocumentType } from '../types';
const DocumentTypeSchema: Schema = new Schema({
  spaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true,  default: '' }
}, {
  versionKey: false,
});

export default mongoose.model<DocumentType>('documentType', DocumentTypeSchema);