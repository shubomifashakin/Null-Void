import { ApiProperty } from '@nestjs/swagger';

import { InviteStatus, Roles } from '../../../../generated/prisma/enums';

export class CreateRoomResponseDto {
  @ApiProperty({ description: 'Room ID', example: '123' })
  id: string;
}

export class RoomDto {
  @ApiProperty({ description: 'Role', example: 'ADMIN', enum: Roles })
  role: Roles;

  @ApiProperty({ description: 'Room ID', example: '123' })
  id: string;

  @ApiProperty({ description: 'Room name', example: 'Room name' })
  name: string;

  @ApiProperty({
    description: 'Joined at',
    example: '2022-01-01T00:00:00.000Z',
  })
  joinedAt: Date;
  @ApiProperty({
    description: 'Created at',
    example: '2022-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({ description: 'Description', example: 'Room description' })
  description: string;
}

export class GetRoomsResponseDto {
  @ApiProperty({ description: 'List of rooms', type: [RoomDto] })
  data: RoomDto[];

  @ApiProperty({ description: 'Next cursor', required: false, example: '123' })
  next?: string;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNextPage: boolean;
}

export class InvitesDto {
  @ApiProperty({ description: 'Invite ID', example: '123' })
  id: string;

  @ApiProperty({ description: 'Role of the invited user' })
  role: Roles;

  @ApiProperty({
    description: 'Email address of the invited user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({ description: 'Status of the invitation', enum: InviteStatus })
  status: InviteStatus;

  @ApiProperty({ description: 'Expiration date of the invitation', type: Date })
  expiresAt: Date;

  @ApiProperty({
    description: 'Name of the user who sent the invitation',
    example: 'John Doe',
  })
  invitersName: string;

  @ApiProperty({
    description: 'ID of the user who sent the invitation',
    example: '456',
  })
  invitersId: string;

  @ApiProperty({
    description: 'Date when the invitation was created',
    type: Date,
  })
  createdAt: Date;
}

export class GetInvitesResponseDto {
  @ApiProperty({ description: 'List of invites', type: [InvitesDto] })
  data: InvitesDto[];

  @ApiProperty({ description: 'Next cursor', required: false, example: '123' })
  next?: string;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNextPage: boolean;
}
