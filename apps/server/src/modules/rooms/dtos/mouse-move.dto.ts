import { IsNumber } from 'class-validator';

export class MouseMoveDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  timestamp: number;
}
