import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { UpdateRoomDto } from '../dtos/update-room.dto';

@Injectable()
export class RoomInfoPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!value) {
      throw new Error('Room info must not be empty');
    }

    const dtoClass = UpdateRoomDto;

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
