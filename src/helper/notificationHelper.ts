import { CreateNotificationDto } from '../dto';
import { notificationController } from '../controllers/all';
import { validate } from 'class-validator';


export class NotificationHelper {
    static async notifyUser(input: CreateNotificationDto): Promise<void> {
        const createNotificationDto = new CreateNotificationDto(input);
        const errors = await validate(createNotificationDto);
        if (errors.length > 0) {
            throw new Error(errors.toString());
        }
        await notificationController.createNotification(createNotificationDto);
    }
}