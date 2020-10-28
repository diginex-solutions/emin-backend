import { IsNotEmpty, IsString, IsIn, IsMongoId, IsOptional, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { NotificationType } from '../../types';

export class SpaceUser {
  constructor(input: SpaceUser) {
    this.email = input.email;
    this.name = input.name;
    this.surname = input.surname;
  }

  @IsNotEmpty()
  @IsString()
  email!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  surname!: string;
}

export class UserSpaceRespDto {
  constructor(input: UserSpaceRespDto) {
    this.id = input.id;
    this.name = input.name;
    this.description = input.description;
    this.icon = input.icon;
    this.role = input.role;
    this.isUserDirectory = input.isUserDirectory;
    this.allowInviteAll = input.allowInviteAll;
    this.isPrivate = input.isPrivate;
    this.isCases = input.isCases;
    this.isDashboard = input.isDashboard;
    this.isForms = input.isForms;
    this.isOrganization = input.isOrganization;
    this.isChecklist = input.isChecklist;
    this.isSupport = input.isSupport;
    this.userLimit = input.userLimit;
    this.admins = input.admins;
  }

  @IsNotEmpty()
  @IsString()
  id!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsNotEmpty()
  @IsBoolean()
  isUserDirectory!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  allowInviteAll!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isPrivate!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isCases!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isDashboard!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isForms!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isOrganization!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isChecklist!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isSupport!: boolean;

  @IsNotEmpty()
  @IsNumber()
  userLimit!: number;

  @IsOptional()
  @ValidateNested({ each: true })
  admins?: SpaceUser
}