// infrastructure/keycloak/keycloak.module.ts
import { Global, Module } from '@nestjs/common';
import { KeycloakConnectModule } from 'nest-keycloak-connect';
import { JwtGuard } from './jwt.guard';
import { ApiJwtGuard } from './api-jwt.guard';

@Global()
@Module({
  imports: [
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEYCLOAK_URL, // ej: 'http://localhost:8080/auth'
      realm: process.env.KEYCLOAK_REALM, // ej: 'puntos'
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      secret: process.env.KEYCLOAK_CLIENT_SECRET || '', // tu secret de cliente confidencial
    }),
  ],
  providers: [JwtGuard, ApiJwtGuard],
  exports: [KeycloakConnectModule, JwtGuard, ApiJwtGuard],
})
export class KeycloakModule {}
