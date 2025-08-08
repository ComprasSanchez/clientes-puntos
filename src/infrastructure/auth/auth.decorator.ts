/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/infrastructure/auth/auth.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthContext {
  sub: string;
  roles: string[];
  azp: string;
  sucursalId: string;
  codigoExt: string;
}

export const Auth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext => {
    const req = ctx.switchToHttp().getRequest();
    return req.auth as AuthContext;
  },
);
