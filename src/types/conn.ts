import mongoose, { Document } from 'mongoose';
import { CreateSpaceDto } from '../dto';
type ObjectId = mongoose.Types.ObjectId
export interface Conn extends Document {
  _id: ObjectId;
  ownerUSID: ObjectId;
  userId: ObjectId;
  valid: boolean;
}