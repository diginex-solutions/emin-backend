import { Notification, initNotification, NotificationType } from '../types';
import notificationModel from '../models/notificationModel';
import { CreateNotificationDto, MarkReadDto } from '../dto';
import { SpaceService } from '../services/spaceSvc';
const spaceSvc = SpaceService.getInstance()
import _ from 'lodash'

export class NotificationService {

    static INSTANCE: NotificationService;
    static getInstance(): NotificationService {
        if (!NotificationService.INSTANCE) {
            NotificationService.INSTANCE = new NotificationService();
        }
        return NotificationService.INSTANCE;
    }


    async all(recipientIds: string[], skip: number, limit: number): Promise<Notification[]> {
        console.log('NotificationType', NotificationType);
        
        const notifications = await notificationModel.find({ recipientId: recipientIds }, { recipientId: false })
            .sort({createdAt: -1}).limit(limit).skip(skip)
        const allUSIDs = _.uniq(notifications.map((noti) => String(noti.initiatorId)))
        const userSpaces = await spaceSvc.fetchUserSpacesByIds_(allUSIDs)
        return _.sortBy(notifications, ['dateCreated']).reverse().map(noti => {
            const us = userSpaces.find(us => String(us._id) === String(noti.initiatorId))
            return {
                ...noti.toObject(),
                spaceId: us.spaceId
            }
        })
    }

    async countUnRead(recipientIds: string[]): Promise<number> {
        const notifications = await notificationModel.count({ recipientId: recipientIds, isRead: false })
        return notifications
    }


    async markRead(markReadDto: MarkReadDto, userId: string): Promise<Notification> {
        const { id: _id } = markReadDto;
        const notification = await notificationModel.findOne({ _id });
        if (!notification) {
            throw new Error(`Notification with Id ${_id} not found`);
        }

        try {
            const us = await spaceSvc.findMyUserSpace({_id: notification.recipientId, userId})
        } catch (err) {
            throw new Error(`you are not the notification's recipient`);
        }

        const result: { nModified: number } = await notificationModel.update({ _id }, { isRead: true });
        if (result.nModified === 0) {
            throw new Error(`Notification ${_id} already seen`);
        }
        notification.isRead = true;
        return notification;
    }

    async createNotification(input: CreateNotificationDto): Promise<Notification> {
        return await notificationModel.create(initNotification(input));
    }
}

