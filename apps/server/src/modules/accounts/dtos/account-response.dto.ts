import { ApiProperty } from '@nestjs/swagger';
import { InviteStatus, Roles } from '../../../../generated/prisma/enums';

export class GetAccountResponseDto {
  @ApiProperty({ example: '123', description: 'User ID' })
  id: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({ description: 'Name of the user', example: 'John Doe' })
  name: string;

  @ApiProperty({
    description: 'Profile picture URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  picture: string | null;

  @ApiProperty({
    description: 'Account creation date',
    type: Date,
    example: '2022-01-01T00:00:00.000Z',
  })
  created_at: Date;
}

class Invites {
  @ApiProperty({ example: '123', description: 'Invite ID' })
  id: string;

  @ApiProperty({
    description: 'Role assigned to the invited user',
    enum: Roles,
  })
  role: Roles;

  @ApiProperty({
    description: 'Current status of the invitation',
    enum: InviteStatus,
  })
  status: InviteStatus;

  @ApiProperty({
    description: 'Expiration date of the invitation',
    type: Date,
    example: '2022-01-01T00:00:00.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Date when the invitation was created',
    type: Date,
    example: '2022-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Name of the room the user is invited to',
    example: 'Meeting Room',
  })
  roomName: string;

  @ApiProperty({
    description: 'Name of the user who sent the invitation',
    example: 'John Doe',
  })
  invitersName: string;

  @ApiProperty({
    description: 'Profile picture of the user who sent the invitation',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  invitersPicture: string | null;
}

export class GetInvitesResponseDto {
  @ApiProperty({ type: [Invites] })
  data: Invites[];

  @ApiProperty({ description: 'Cursor', required: false, example: '123' })
  cursor: string | null;

  @ApiProperty({ description: 'Has next page', required: false })
  hasNextPage: boolean;
}
