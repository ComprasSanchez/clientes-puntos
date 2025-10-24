/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jose from 'jose';
import type { Request } from 'express';
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

function toArray<T>(v: T | T[] | undefined | null): T[] {
  if (Array.isArray(v)) return v.filter(Boolean);
  return v != null ? [v] : [];
}

function safeTokenPreview(hdr?: string): string {
  if (!hdr?.startsWith('Bearer ')) return 'none';
  const t = hdr.slice(7);
  if (t.length <= 16) return `${t} (len=${t.length})`;
  return `${t.slice(0, 12)}...${t.slice(-6)} (len=${t.length})`;
}

function isDebug(): boolean {
  const v = String(process.env.AUTHZ_DEBUG ?? '')
    .toLowerCase()
    .trim();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

@Injectable()
export class ApiJwtGuard implements CanActivate {
  private readonly log = new Logger(ApiJwtGuard.name);

  private url = process.env.KEYCLOAK_URL!;
  private realm = process.env.KEYCLOAK_REALM!;
  private issuer = `${this.url}/realms/${this.realm}`;

  // Soporta CSV: KEYCLOAK_API_AUDIENCE=plex-integration,puntos-fsa
  private apiAudiences: string[] = (
    process.env.KEYCLOAK_API_AUDIENCE || 'puntos-fsa'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // allowedAzp por defecto si la ruta no define @Authz
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

    // ==== request context logging (seguro) ====
    if (isDebug()) {
      const authHdr = req.headers['authorization'];
      const reqId = req.headers['x-request-id'];
      const xAuthMode = req.headers['x-auth-mode'];
      this.log.debug(
        `REQ ${req.method} ${req.originalUrl} ` +
          `rid=${String(reqId ?? '-')} ` +
          `auth=${safeTokenPreview(authHdr)} ` +
          `x-auth-mode=${String(xAuthMode ?? '-')}`,
      );
    }

    console.log('hola');

    // ==== token raw ====
    const raw = req.headers['authorization'];
    const hdr = Array.isArray(raw) ? raw[0] : raw;
    const token =
      typeof hdr === 'string' && hdr.startsWith('Bearer ')
        ? hdr.slice(7)
        : undefined;

    if (!token) {
      if (isDebug()) this.log.warn('Missing bearer token');
      throw new UnauthorizedException('Missing bearer token');
    }

    // ==== verify ====
    let payload: JwtPayload;
    try {
      const verified = await jose.jwtVerify<JwtPayload>(token, this.jwks, {
        issuer: this.issuer,
        clockTolerance: 10,
      });
      payload = verified.payload;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isDebug())
        this.log.error(`JWT verify failed: ${msg} (iss=${this.issuer})`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    // ==== audience check ====
    const audList = toArray(payload.aud).map((a) => String(a));
    const matchesAud = this.apiAudiences.some((a) => audList.includes(a));

    if (isDebug()) {
      this.log.debug(
        `AUD check -> expected=[${this.apiAudiences.join(
          ',',
        )}] got=[${audList.join(',')}] iss=${String(
          payload.iss ?? '-',
        )} azp=${String(payload.azp ?? '-')}`,
      );
    }

    if (!matchesAud) {
      // Evita restrict-template-expressions con tipos unión
      const expectedStr = this.apiAudiences.join(',');
      const gotStr = audList.join(',');
      const azpStr = String(payload.azp ?? '-');
      throw new ForbiddenException(
        `Invalid audience for API: expected one of [${expectedStr}], got [${gotStr}] (azp=${azpStr})`,
      );
    }

    // ==== resolve policy (@Authz on handler or controller, else defaults) ====
    const policy: AuthzPolicy = this.reflector.get<AuthzPolicy>(
      AUTHZ_KEY,
      ctx.getHandler(),
    ) ??
      this.reflector.get<AuthzPolicy>(AUTHZ_KEY, ctx.getClass()) ?? {
        allowedAzp: this.defaultAllowedAzp,
        requireSucursalData: true,
      };

    if (isDebug()) {
      const allowedAzpStr = (policy.allowedAzp ?? []).join(',');
      const requiredRealmStr = (policy.requiredRealmRoles ?? []).join(',');
      const hasClientRoles = Boolean(policy.requiredClientRoles);
      const requireSuc = String(policy.requireSucursalData ?? true);
      this.log.debug(
        `Policy -> allowedAzp=[${allowedAzpStr}] requiredRealmRoles=[${requiredRealmStr}] ` +
          `requiredClientRoles=${hasClientRoles ? 'yes' : 'no'} requireSucursalData=${requireSuc}`,
      );
    }

    // ==== azp ====
    if (policy.allowedAzp && policy.allowedAzp.length) {
      const azp = payload.azp;
      if (!azp || !policy.allowedAzp.includes(azp)) {
        const expectedAzpStr = policy.allowedAzp.join(',');
        throw new ForbiddenException(
          `AZP not allowed for this route: expected one of [${expectedAzpStr}], got ${String(
            azp ?? '-',
          )}`,
        );
      }
    }

    // ==== realm roles ====
    const realmRoles = payload.realm_access?.roles ?? [];
    if (isDebug()) {
      this.log.debug(`realm_roles=[${realmRoles.join(',')}]`);
    }
    if (policy.requiredRealmRoles?.length) {
      const missing = policy.requiredRealmRoles.filter(
        (r) => !realmRoles.includes(r),
      );
      if (missing.length) {
        throw new ForbiddenException(
          `Missing required realm role(s): [${missing.join(',')}]`,
        );
      }
    }

    // ==== client roles ====
    if (policy.requiredClientRoles) {
      const missingByClient: string[] = [];
      for (const [clientId, roles] of Object.entries(
        policy.requiredClientRoles,
      )) {
        const clientRoles = payload.resource_access?.[clientId]?.roles ?? [];
        const miss = roles.filter((r) => !clientRoles.includes(r));
        if (miss.length) {
          missingByClient.push(`${clientId}:{${miss.join(',')}}`);
        }
        if (isDebug()) {
          this.log.debug(
            `client_roles[${clientId}]=[${clientRoles.join(
              ',',
            )}] required=[${roles.join(',')}]`,
          );
        }
      }
      if (missingByClient.length) {
        throw new ForbiddenException(
          `Missing client role(s): ${missingByClient.join(' ; ')}`,
        );
      }
    }

    // ==== sucursal data ====
    const mustSucursal = policy.requireSucursalData ?? true;
    if (isDebug()) {
      this.log.debug(
        `sucursalId=${String(payload.sucursalId ?? '-')} codigoExt=${String(
          payload.codigoExt ?? '-',
        )} (required=${String(mustSucursal)})`,
      );
    }
    if (mustSucursal && (!payload.sucursalId || !payload.codigoExt)) {
      throw new ForbiddenException('Missing sucursal codes');
    }

    // ==== enrich req ====
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

    if (isDebug()) {
      this.log.debug(
        `AUTH OK sub=${req.auth.sub} azp=${req.auth.azp} aud=[${audList.join(
          ',',
        )}]`,
      );
    }

    return true;
  }
}
