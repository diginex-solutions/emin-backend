import mongoose, { Document } from 'mongoose';
type ObjectId = mongoose.Types.ObjectId
export interface SupportArticle extends Document {
  _id: ObjectId;
  USID: ObjectId;
  title: string;
  text: string;
  spaceId?: ObjectId;
  topicId: ObjectId;
  views: number
  isPublished?: boolean;
}

export interface Feedback extends Document {
  _id: ObjectId;
  USID: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  spaceId: ObjectId;
  aritcleId: ObjectId;
  isHelpful: boolean;
  improvementId: ObjectId;
  tellUsMore: string;
}