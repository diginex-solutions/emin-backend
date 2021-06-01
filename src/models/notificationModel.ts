
import mongoose, { Schema } from 'mongoose';
import { Notification, NotificationType } from '../types';
import { SpaceService } from '../services/spaceSvc';
const spaceSvc = SpaceService.getInstance()

const NotificationSchema: Schema = new Schema({
    type: { type: String, required: true, enum: Object.values(NotificationType) },
    isRead: { type: Boolean, required: true, default: false },
    recipientId: { type: Schema.Types.ObjectId, ref: 'userSpace', required: true },
    initiatorId: { type: Schema.Types.ObjectId, ref: 'userSpace', required: true },
    formId: { type: Schema.Types.ObjectId, ref: 'Form', required: false },
    docId: { type: Schema.Types.ObjectId, ref: 'Access', required: false },
    createdAt: { type: Number, required: true, default: Date.now },
});

const validateUSID = value => spaceSvc.findMyUserSpace({_id: String(value), valid: true})

NotificationSchema.path('recipientId').validate(validateUSID, "Recipient non existent");
NotificationSchema.path('initiatorId').validate(validateUSID, "Recipient non existent");

export default mongoose.model<Notification>('notification', NotificationSchema);