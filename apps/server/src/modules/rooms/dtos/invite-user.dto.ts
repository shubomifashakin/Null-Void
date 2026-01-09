import { IsEmail, IsString } from 'class-validator';

import { Roles } from '../../../../generated/prisma/enums';

export class InviteUserDto {
  @IsEmail({}, { message: 'Email is not valid' })
  email: string;

  @IsString({ message: 'Role is not valid' })
  role: Roles;
}
