import { IsNotEmpty, IsString, IsIn, IsMongoId, IsOptional, IsBoolean } from 'class-validator';
import { NotificationType } from '../../types';

export class CreateSpaceDto {
  constructor(input: CreateSpaceDto) {
    this.name = input.name;
    this.description = input.description;
    this.icon = input.icon;
    this.isUserDirectory = input.isUserDirectory;
    this.allowInviteAll = input.allowInviteAll ? true : false;
  }

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  isUserDirectory?: boolean;

  @IsBoolean()
  @IsOptional()
  allowInviteAll?: boolean;
}