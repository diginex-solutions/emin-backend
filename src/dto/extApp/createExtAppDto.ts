import { IsNotEmpty, IsString } from 'class-validator';


export class CreateExtAppDto {
    constructor(input: CreateExtAppDto) {
        this.applicationId = input.applicationId ? String(input.applicationId).toLowerCase() : input.applicationId;
        this.pubKey = input.pubKey;
        this.notificationLink = input.notificationLink;
    }

    @IsNotEmpty()
    @IsString()
    applicationId!: string;

    @IsNotEmpty()
    @IsString()
    pubKey!: string;

    @IsNotEmpty()
    @IsString()
    notificationLink!: string;
}