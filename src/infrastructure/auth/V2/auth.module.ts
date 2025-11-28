import { CLIENTES_HTTP } from '@infrastructure/integrations/CLIENTES/tokens/tokens';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  AuthModule,
  AuthzCoreConfig,
  AuthzKcRuntimeModule,
  AuthzRuntimeConfig,
  KcTokenModule,
} from '@sistemas-fsa/authz/nest';

function parseIssuer(issuer: string): {
  baseUrl: string;
  realm: string;
  realmUrl: string;
} {
  const m = issuer.match(/^(https?:\/\/[^]+)\/realms\/([^/]+)\/?$/);
  if (!m) throw new Error(`KC_ISSUER_URL inválido: ${issuer}`);
  const baseUrl = m[1];
  const realm = m[2];
  const realmUrl = `${baseUrl}/realms/${realm}`;
  return { baseUrl, realm, realmUrl };
}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ ApiJwtGuard queda global desde AuthModule
    AuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const issuer = cfg.get<string>('KC_ISSUER_URL');
        const audience = cfg.get<string>('KC_AUDIENCE'); // debe ser el clientId de tu API
        if (!issuer) throw new Error('KC_ISSUER_URL no definido');
        if (!audience) throw new Error('KC_AUDIENCE no definido');

        return {
          issuer,
          audience,
          jwksUri: cfg.get<string>('KC_JWKS_URI'), // opcional
          allowedAzpDefault: (cfg.get<string>('ALLOWED_AZP') ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          requireSucursalDataDefault: false,
          claimNames: { sucursalId: 'sucursalId', codigoExt: 'codigoExt' },
          clockTolerance: 10,
        };
      },
    }),

    KcTokenModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const { baseUrl, realm } = parseIssuer(
          cfg.get<string>('KC_ISSUER_URL')!,
        );
        return {
          baseUrl,
          realm,
          clientId: cfg.get<string>('KC_CLIENT_ID')!,
          clientSecret: cfg.get<string>('KC_CLIENT_SECRET')!,
          timeoutMs: 8000,
        };
      },
    }),

    AuthzKcRuntimeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        cfg: ConfigService,
      ): { core: AuthzCoreConfig; runtime: AuthzRuntimeConfig } => {
        const issuer = cfg.getOrThrow<string>('KC_ISSUER_URL');
        const { realmUrl } = parseIssuer(issuer);

        const core: AuthzCoreConfig = {
          realmUrl,
          clientId: cfg.getOrThrow<string>('KC_CLIENT_ID'),
          clientSecret: cfg.getOrThrow<string>('KC_CLIENT_SECRET'),
          clockSkewSeconds: 8,
        };
        const runtime: AuthzRuntimeConfig = {
          downstreams: [
            {
              name: CLIENTES_HTTP,
              audience: 'clientes-fsa',
              baseURL: String(cfg.get<string>('CLIENTES_API_URL') ?? ''),
              fallbackClientCredentials: true,
            },
          ],
        };

        return { core, runtime };
      },
      namesFactory: () => [CLIENTES_HTTP],
    }),
  ],

  // ⛔️ Quitamos el APP_GUARD manual: lo maneja AuthModule
  providers: [],
  exports: [AuthzKcRuntimeModule],
})
export class AuthzModule {}
