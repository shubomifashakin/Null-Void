import { IsEmail, IsString } from 'class-validator';

import { Roles } from '../../../../generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';

export class InviteUserDto {
  @ApiProperty({
    description: 'The email of the user to invite',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email is not valid' })
  email: string;

  @ApiProperty({
    description: 'The role of the user to invite',
    enum: Roles,
    example: Roles.EDITOR,
  })
  @IsString({ message: 'Role is not valid' })
  role: Roles;
}
