// infrastructure/keycloak/keycloak.module.ts
import { Global, Module } from '@nestjs/common';
import { KeycloakConnectModule } from 'nest-keycloak-connect';
import { JwtGuard } from './jwt.guard';

@Global()
@Module({
  imports: [
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEYCLOAK_URL, // ej: 'http://localhost:8080/auth'
      realm: process.env.KEYCLOAK_REALM, // ej: 'puntos'
      clientId: process.env.KEYCLOAK_CLIENT_ID, // ej: 'sistema-puntos-api'
      secret: process.env.KEYCLOAK_CLIENT_SECRET || '', // tu secret de cliente confidencial
    }),
  ],
  providers: [JwtGuard],
  exports: [KeycloakConnectModule, JwtGuard],
})
export class KeycloakModule {}
