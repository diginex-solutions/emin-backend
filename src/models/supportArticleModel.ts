
import mongoose, { Schema } from 'mongoose';
import { SupportArticle } from '../types';
const { jsonStringifyNullable } = require('../helper/util')

const SupportArticleSchema: Schema = new Schema({
  USID: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSpace', required: true },
  createdAt: { type: Number, required: true, default: Date.now },
  updatedAt: { type: Number, required: true, default: Date.now },
  title: { type: String, required: true },
  text: { type: String, set: jsonStringifyNullable, default: null, required: true },
  htmlInText: { type: String, set: jsonStringifyNullable, default: null, required: true },
  spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
  topicId: { type: Schema.Types.ObjectId, ref: 'SupportTopic', required: false },
  views: {type: Number, default: 0, required: true },
  isPublished: { type: Boolean, default: false, required: true },
  valid: { type: Number, default: 1, required: true}
}, {
  versionKey: false
});

SupportArticleSchema.index({ title: "text", htmlInText: "text" })

export default mongoose.model<SupportArticle>('SupportArticle', SupportArticleSchema);