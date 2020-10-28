import { IsNotEmpty, IsString, IsIn, IsMongoId, IsOptional } from 'class-validator';
import { NotificationType } from '../../types';


export class CreateNotificationDto {

    constructor(input: CreateNotificationDto) {
        this.type = input.type;
        this.recipientId = String(input.recipientId);
        this.initiatorId = String(input.initiatorId);

        if (input.formId) {
            this.formId = String(input.formId);
        }
        if (input.docId) {
            this.docId = String(input.docId);
        }
    }

    @IsNotEmpty()
    @IsString()
    @IsIn(Object.values(NotificationType))
    type!: string;


    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    recipientId!: string;

    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    initiatorId!: string;

    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    @IsOptional()
    formId?: string

    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    @IsOptional()
    docId?: string
}