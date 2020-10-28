import { IsOptional, IsNotEmpty, IsString, IsMongoId, IsBoolean } from 'class-validator';

export class CreateArticleDto {
  constructor(input: CreateArticleDto) {
    this.title = input.title;
    this.text = input.text;
    this.topicId = input.topicId;
    this.isPublished = input.isPublished
  }

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  text!: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  topicId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

}