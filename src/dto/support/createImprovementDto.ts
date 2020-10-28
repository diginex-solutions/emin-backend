import { IsNotEmpty, IsString } from 'class-validator';

export class CreateImprovementDto {
  constructor(input: CreateImprovementDto) {
    this.text = input.text;
  }

  @IsNotEmpty()
  @IsString()
  text!: string;
}