import { Document } from 'mongoose';
import { CreateNotificationDto } from '../dto';

export interface Notification extends Document {
    id?: string;
    type: NotificationType;
    isRead: boolean;
    recipientId: string;
    initiatorId: string;
    formId?: string
    docId?: string
    createdAt: Date,
    spaceId?: string
}

export enum NotificationType {
    VERIFICATION = 'verification',
    VERIFICATION_FILLED = 'verification_filled',
    SHARED = 'shared',
    FORM = 'form',
    FORM_FILLED = 'form_filled',
    VERSION = 'version',
}

export const initNotification = (input: CreateNotificationDto): Partial<Notification> => {
    return {
        isRead: false,
        type: input.type as NotificationType,
        docId: input.docId,
        formId: input.formId,
        initiatorId: input.initiatorId,
        recipientId: input.recipientId
    }
}