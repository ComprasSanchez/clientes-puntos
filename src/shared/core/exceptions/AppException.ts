import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  public readonly code?: string;
  public readonly meta?: any;

  constructor(
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    code?: string,
    meta?: unknown,
  ) {
    super(
      {
        statusCode: status,
        message,
        error: code,
        meta,
      },
      status,
    );
    this.code = code;
    this.meta = meta;
    this.name = AppException.name;
    Object.setPrototypeOf(this, AppException.prototype);
  }
}
