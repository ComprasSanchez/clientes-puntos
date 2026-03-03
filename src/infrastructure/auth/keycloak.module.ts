// infrastructure/keycloak/keycloak.module.ts
import { Global, Module } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';
import { ApiJwtGuard } from './api-jwt.guard';

@Global()
@Module({
  imports: [],
  providers: [JwtGuard, ApiJwtGuard],
  exports: [JwtGuard, ApiJwtGuard],
})
export class KeycloakModule {}
