import { Injectable } from '@nestjs/common';

import { DrawEvent, DrawEventList } from '../../core/protos/draw_event';

import { FnResult, makeError } from '../../../types/fnResult';

@Injectable()
export class BinaryEncodingService {
  encode(payload: DrawEvent[], timestamp: number): FnResult<Buffer> {
    try {
      const messages = DrawEventList.create({
        events: payload,
        timestamp: String(timestamp),
      });

      const encoded = DrawEventList.toBinary(messages);

      return { success: true, data: Buffer.from(encoded), error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  decode(payload: Buffer): FnResult<DrawEventList> {
    try {
      const decoded = DrawEventList.fromBinary(payload);

      return { success: true, data: decoded, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }
}
