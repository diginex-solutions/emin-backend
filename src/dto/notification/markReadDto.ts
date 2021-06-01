import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';


export class MarkReadDto {

    constructor(input: MarkReadDto) {
        this.id = input.id;
    }

    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    id!: string;

}