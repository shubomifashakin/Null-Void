import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(20, { message: 'Name must be at most 20 characters long' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Description must be at least 5 characters long' })
  @MaxLength(100, {
    message: 'Description must be at most 100 characters long',
  })
  description: string;
}
