import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class MouseMoveDto {
  @ApiProperty({
    description: 'The x coordinate',
  })
  @IsNumber()
  x: number;

  @ApiProperty({
    description: 'The y coordinate',
  })
  @IsNumber()
  y: number;

  @ApiProperty({
    description: 'The timestamp of when the event occurred',
  })
  @IsString()
  timestamp: string;

  @ApiProperty({
    description: 'Indicates whether the user is drawing or not',
    example: true,
  })
  @IsBoolean()
  isPenDown: boolean;
}
