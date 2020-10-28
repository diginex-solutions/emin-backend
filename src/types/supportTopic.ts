import mongoose, { Document } from 'mongoose';
type ObjectId = mongoose.Types.ObjectId
export interface SupportTopic extends Document {
  _id: ObjectId;
  name: string;
  icon: string;
  spaceId?: ObjectId;
}