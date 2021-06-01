import mongoose, { Document } from 'mongoose';
import { CreateSpaceDto } from '../dto';
type ObjectId = mongoose.Types.ObjectId

export interface DocumentType extends Document {
  _id: ObjectId;
  spaceId: ObjectId | string;
  title: string;
}