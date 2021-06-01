
import mongoose, { Schema } from 'mongoose';
import { Feedback } from '../types';
const { jsonStringifyNullable } = require('../helper/util')

const FeedbackSchema: Schema = new Schema({
  USID: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSpace', required: true },
  createdAt: { type: Number, required: true, default: Date.now },
  updatedAt: { type: Number, required: true, default: Date.now },
  spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
  articleId: { type: Schema.Types.ObjectId, ref: 'SupportArticle', required: false },
  isHelpful: { type: Boolean, required: true },
  improvementId: { type: Schema.Types.ObjectId, ref: 'Improvement', required: false },
  tellUsMore: { type: String, required: false},
}, {
  versionKey: false
});

export default mongoose.model<Feedback>('Feedback', FeedbackSchema);