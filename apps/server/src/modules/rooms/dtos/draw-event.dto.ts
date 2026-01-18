import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export interface Points {
  x: number;
  y: number;
}

export interface FillStyle {
  color: string;
  opacity: number;
}

interface DrawEventBase {
  type: 'line' | 'circle' | 'polygon';
  strokeColor: string;
  strokeWidth: number;
  timestamp: string;
  id: string;
}

export interface LineEvent extends DrawEventBase {
  type: 'line';
  from: Points;
  to: Points;
}

export interface CircleEvent extends DrawEventBase {
  type: 'circle';
  radius: number;
  center: Points;
  fillStyle?: FillStyle;
}

export interface PolygonEvent extends DrawEventBase {
  type: 'polygon';
  points: Points[];
  fillStyle?: FillStyle;
}

export type DrawEvent = LineEvent | CircleEvent | PolygonEvent;

export class PointsDto implements Points {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

export class FillStyleDto implements FillStyle {
  @IsString()
  color: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  opacity: number;
}

export class DrawEventBaseDto implements DrawEventBase {
  @IsString()
  @IsIn(['line', 'circle', 'polygon'], { message: 'Invalid draw event type' })
  type: 'line' | 'circle' | 'polygon';

  @IsString()
  @IsUUID(4)
  id: string;

  @IsString()
  strokeColor: string;

  @IsNumber()
  @Min(1)
  @Max(50)
  strokeWidth: number;

  @IsString()
  @Matches(/^[1-9]\d*$/, {
    message: 'Timestamp must be a string representing a positive number',
  })
  timestamp: string;
}

export class LineEventDto extends DrawEventBaseDto implements LineEvent {
  constructor() {
    super();
    this.type = 'line';
  }

  @IsString()
  @IsIn(['line'], { message: 'Invalid draw event type' })
  type: 'line';

  @IsObject()
  @Type(() => PointsDto)
  from: PointsDto;

  @IsObject()
  @Type(() => PointsDto)
  to: PointsDto;
}

export class CircleEventDto extends DrawEventBaseDto implements CircleEvent {
  constructor() {
    super();
    this.type = 'circle';
  }

  @IsString()
  @IsIn(['circle'], { message: 'Invalid draw event type' })
  type: 'circle';

  @IsNumber()
  @IsPositive()
  radius: number;

  @IsObject()
  @Type(() => PointsDto)
  center: PointsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FillStyleDto)
  fillStyle?: FillStyle;
}

export class PolygonEventDto extends DrawEventBaseDto implements PolygonEvent {
  constructor() {
    super();
    this.type = 'polygon';
  }

  @IsString()
  @IsIn(['polygon'], { message: 'Invalid draw event type' })
  type: 'polygon';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PointsDto)
  points: PointsDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => FillStyleDto)
  fillStyle?: FillStyle;
}

export type DrawEventPayload = LineEventDto | CircleEventDto | PolygonEventDto;
