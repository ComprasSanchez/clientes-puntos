/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jose from 'jose';
import { AUTHZ_KEY, AuthzPolicy } from './authz-policy.decorator';
import type { AuthContext } from './auth.decorator';

type RealmAccess = { roles?: string[] };
type ResourceAccess = { [clientId: string]: { roles?: string[] } };
type JwtPayload = {
  sub?: string;
  azp?: string;
  iss?: string;
  aud?: string | string[];
  realm_access?: RealmAccess;
  resource_access?: ResourceAccess;
  sucursalId?: string;
  codigoExt?: string;
  [k: string]: unknown;
};

type ReqWithAuth = Request & { auth?: AuthContext };

@Injectable()
export class ApiJwtGuard implements CanActivate {
  private url = process.env.KEYCLOAK_URL!;
  private realm = process.env.KEYCLOAK_REALM!;
  private issuer = `${this.url}/realms/${this.realm}`;

  // 👇 Audiencia fija de tu API (de la Opción 1 que configuraste en KC)
  private apiAudience =
    process.env.KEYCLOAK_API_AUDIENCE || 'sistema-puntos-api';

  // (Opcional) lista global por defecto de azp permitidos si el endpoint no define @Authz
  private defaultAllowedAzp: string[] = (
    process.env.KEYCLOAK_ALLOWED_AZP || 'puntos-fsa,plex-integration'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  private jwks = jose.createRemoteJWKSet(
    new URL(`${this.issuer}/protocol/openid-connect/certs`),
  );

  constructor(private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<ReqWithAuth>();
    const raw = req.headers['authorization'];
    const hdr = Array.isArray(raw) ? raw[0] : raw;
    const token =
      typeof hdr === 'string' && hdr.startsWith('Bearer ')
        ? hdr.slice(7)
        : undefined;

    if (!token) throw new UnauthorizedException('Missing bearer token');

    let payload: JwtPayload;
    try {
      const verified = await jose.jwtVerify<JwtPayload>(token, this.jwks, {
        issuer: this.issuer,
        clockTolerance: 10,
      });
      payload = verified.payload;
    } catch (err) {
      throw new UnauthorizedException(err);
    }

    // 1) Audiencia: el token debe estar destinado a tu API
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(this.apiAudience)) {
      throw new ForbiddenException('Invalid audience for API');
    }

    // 2) Política por endpoint (o por controlador)
    const policy = this.reflector.get<AuthzPolicy>(
      AUTHZ_KEY,
      ctx.getHandler(),
    ) ??
      this.reflector.get<AuthzPolicy>(AUTHZ_KEY, ctx.getClass()) ?? {
        // default si no hay @Authz:
        allowedAzp: this.defaultAllowedAzp,
        requireSucursalData: true,
      };

    // 2a) allowedAzp
    if (policy.allowedAzp && policy.allowedAzp.length) {
      if (!payload.azp || !policy.allowedAzp.includes(payload.azp)) {
        throw new ForbiddenException('AZP not allowed for this route');
      }
    }

    // 2b) roles de realm
    const realmRoles = payload.realm_access?.roles ?? [];
    if (policy.requiredRealmRoles?.length) {
      const ok = policy.requiredRealmRoles.every((r) => realmRoles.includes(r));
      if (!ok) throw new ForbiddenException('Missing required realm role(s)');
    }

    // 2c) roles de cliente (resource_access)
    if (policy.requiredClientRoles) {
      for (const [clientId, roles] of Object.entries(
        policy.requiredClientRoles,
      )) {
        const clientRoles = payload.resource_access?.[clientId]?.roles ?? [];
        const ok = roles.every((r) => clientRoles.includes(r));
        if (!ok)
          throw new ForbiddenException(`Missing client role(s) on ${clientId}`);
      }
    }

    // 2d) sucursal (por defecto exigida; podés apagarla por ruta)
    const mustSucursal = policy.requireSucursalData ?? true;
    if (mustSucursal && (!payload.sucursalId || !payload.codigoExt)) {
      throw new ForbiddenException('Missing sucursal codes');
    }

    const resourceAccess = payload.resource_access ?? {};
    req.auth = {
      sub: String(payload.sub ?? ''),
      roles: realmRoles,
      azp: String(payload.azp ?? ''),
      sucursalId: payload.sucursalId ? String(payload.sucursalId) : undefined,
      codigoExt: payload.codigoExt ? String(payload.codigoExt) : undefined,
      clientRoles: Object.fromEntries(
        Object.entries(resourceAccess).map(([cid, v]) => [cid, v?.roles ?? []]),
      ),
    };

    return true;
  }
}
