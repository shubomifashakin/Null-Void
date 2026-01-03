import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateAccountDto {
  @IsString({ message: 'Invalid name' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  name: string;
}
