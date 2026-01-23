import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateAccountDto {
  @IsString({ message: 'Invalid name' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(30, { message: 'Name must be at most 30 characters long' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  name: string;
}
