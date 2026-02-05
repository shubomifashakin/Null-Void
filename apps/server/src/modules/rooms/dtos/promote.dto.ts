import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID } from 'class-validator';
import { Roles } from 'generated/prisma/enums';

export class PromoteDto {
  @ApiProperty({
    description: 'The id of the user',
  })
  @IsString()
  @IsUUID(4, { message: 'Invalid userId' })
  userId: string;

  @ApiProperty({
    description: 'The role of the user',
    enum: Roles,
  })
  @IsString()
  @IsEnum(Roles, { message: 'Invalid role' })
  role: Roles;
}
