import { Response } from 'express';
import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

@Catch(PrismaClientKnownRequestError)
export class PrismaKnownErrorFilter implements ExceptionFilter {
  logger = new Logger(PrismaKnownErrorFilter.name);

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const hostType = host.getType();

    if (hostType === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();

      if (exception.code === 'P2025') {
        const modelName =
          typeof exception?.meta?.modelName === 'string'
            ? exception.meta.modelName
            : 'Record';

        return response.status(404).json({
          statusCode: 404,
          message: `${modelName} does not exist`,
        });
      }

      if (exception.code === 'P2002') {
        const modelName =
          typeof exception?.meta?.modelName === 'string'
            ? exception.meta.modelName
            : 'Record';

        return response.status(409).json({
          statusCode: 409,
          message: `${modelName} already exists`,
        });
      }

      this.logger.error(exception.message, exception.stack);

      return response.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
      });
    }
  }
}
