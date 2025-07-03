import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { AppException } from './AppException'; // asegúrate de que este import está bien

@Catch(AppException)
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: AppException, host: ArgumentsHost): void {
    // <<< ¡TIPADO AQUÍ!
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Obtén el status y la respuesta usando métodos de HttpException
    const status =
      typeof exception.getStatus === 'function' ? exception.getStatus() : 500; // fallback
    const body =
      typeof exception.getResponse === 'function'
        ? exception.getResponse()
        : { message: 'Internal server error' };

    response.status(status).json(body);
  }
}
