import { IsEnum } from 'class-validator';
import { InviteStatus } from '../../../../generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInviteDto {
  @ApiProperty({
    description: 'The status of the invite',
    example: InviteStatus.ACCEPTED,
    enum: InviteStatus,
  })
  @IsEnum(InviteStatus, { message: 'Invalid status' })
  status: InviteStatus;
}
