import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ExceptionFilter, Catch } from '@nestjs/common';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

@Catch(PrismaClientKnownRequestError)
export class PrismaKnownErrorFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError): void {
    if (exception.code === 'P2025') {
      throw new NotFoundException('Record does not exist');
    }

    throw new InternalServerErrorException('Internal server error');
  }
}
