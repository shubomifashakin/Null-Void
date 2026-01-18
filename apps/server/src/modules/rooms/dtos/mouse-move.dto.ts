import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class MouseMoveDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsString()
  timestamp: string;

  @IsBoolean()
  isPenDown: boolean;
}
