import { IsEnum, IsString, IsUUID } from 'class-validator';
import { Roles } from 'generated/prisma/enums';

export class PromoteDto {
  @IsString()
  @IsUUID(4, { message: 'Invalid userId' })
  userId: string;

  @IsString()
  @IsEnum(Roles, { message: 'Invalid role' })
  role: Roles;
}
