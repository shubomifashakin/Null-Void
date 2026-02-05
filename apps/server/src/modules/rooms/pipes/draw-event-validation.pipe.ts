import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import {
  CircleEventDto,
  LineEventDto,
  PolygonEventDto,
} from '../dtos/draw-event.dto';

@Injectable()
export class DrawEventValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!value || !value.type) {
      throw new Error('Draw event must have a type');
    }
    let dtoClass;
    switch (value.type) {
      case 'line':
        dtoClass = LineEventDto;
        break;
      case 'circle':
        dtoClass = CircleEventDto;
        break;
      case 'polygon':
        dtoClass = PolygonEventDto;
        break;
      default:
        throw new Error(`Invalid draw event type: ${value.type}`);
    }
    const dto = plainToInstance(dtoClass, value);
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new Error(
        `Validation failed: ${errors.map((e) => Object.values(e.constraints || {}).join(', ')).join(', ')}`,
      );
    }
    return dto;
  }
}
