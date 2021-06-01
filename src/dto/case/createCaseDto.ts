import { IsIn, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CaseStatus, IssueType } from '../../types';

export class CreateCaseDto {
  constructor(input: CreateCaseDto) {
    this.caseType = input.caseType;
    this.relatedTo = input.relatedTo;
    this.description = input.description;
    this.resolutionPlan = input.resolutionPlan;
    this.status = input.status;
    this.issueType = input.issueType;
    this.formId = input.formId
  }

  @IsNotEmpty()
  @IsString()
  caseType!: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  relatedTo?: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsString()
  resolutionPlan!: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(Object.values(CaseStatus))
  status!: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(Object.values(IssueType))
  issueType!: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  formId?: string;
}