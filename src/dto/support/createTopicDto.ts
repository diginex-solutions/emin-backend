import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTopicDto {
  constructor(input: CreateTopicDto) {
    this.name = input.name;
    this.icon = input.icon;
  }

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  icon!: string;
}