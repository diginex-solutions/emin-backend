
import mongoose, { Schema } from 'mongoose';
import { ExtApp } from '../types';
const ExtAppSchema: Schema = new Schema({
  applicationId: { type: String, required: true, unique: true },
  spaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: false },
  pubKey: { type: String, required: true },
  notificationLink: { type: String, required: true },
}, {
  versionKey: false,
});

const validApplicationId = value => {
  return value ? String(value).length >= 4 && String(value).length <= 16: false
}

ExtAppSchema.path('applicationId').validate(validApplicationId, "ApplicationId validation error");
export default mongoose.model<ExtApp>('ExtApp', ExtAppSchema);