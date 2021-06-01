import { IsOptional, IsNotEmpty, IsString, IsMongoId, IsBoolean } from 'class-validator';

export class CreateFeedbackDto {
  constructor(input: CreateFeedbackDto) {
    this.isHelpful = input.isHelpful;
    this.improvementId = input.improvementId;
    this.tellUsMore = input.tellUsMore;
  }

  @IsNotEmpty()
  @IsBoolean()
  isHelpful!: boolean;

  @IsOptional()
  @IsMongoId()
  improvementId!: string;

  @IsOptional()
  @IsString()
  tellUsMore!: string;
}