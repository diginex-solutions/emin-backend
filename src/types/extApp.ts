import mongoose, { Document } from 'mongoose';
import { CreateSpaceDto } from '../dto';
type ObjectId = mongoose.Types.ObjectId
export interface ExtApp extends Document {
  _id: ObjectId;
  applicationId: string;
  spaceId?: ObjectId;
  pubKey: string;
  notificationLink: string;
}