import { IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { NotificationType } from '../../types';

export class SpaceSettingsDto {
  constructor(input: SpaceSettingsDto) {
    this.isCases = input.isCases;
    this.isDashboard = input.isDashboard
    this.isForms = input.isForms;
    this.isOrganization = input.isOrganization;
    this.isChecklist = input.isChecklist;
    this.isSupport = input.isSupport;
    this.userLimit = input.userLimit;
  }

  @IsBoolean()
  @IsOptional()
  isCases?: boolean;

  @IsBoolean()
  @IsOptional()
  isDashboard?: boolean;

  @IsBoolean()
  @IsOptional()
  isForms?: boolean;

  @IsBoolean()
  @IsOptional()
  isOrganization?: boolean;

  @IsBoolean()
  @IsOptional()
  isChecklist?: boolean;

  @IsBoolean()
  @IsOptional()
  isSupport?: boolean;

  @IsNumber()
  @IsOptional()
  userLimit?: number;
}