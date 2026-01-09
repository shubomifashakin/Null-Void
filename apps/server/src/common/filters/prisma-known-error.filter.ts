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
      const modelName =
        typeof exception?.meta?.modelName === 'string'
          ? exception.meta.modelName
          : 'Record';

      throw new NotFoundException(`${modelName} does not exist`);
    }

    throw new InternalServerErrorException('Internal server error');
  }
}
