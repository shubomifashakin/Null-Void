import { IsEnum } from 'class-validator';
import { InviteStatus } from '../../../../generated/prisma/enums';

export class UpdateInviteDto {
  @IsEnum(InviteStatus, { message: 'Invalid status' })
  status: InviteStatus;
}
