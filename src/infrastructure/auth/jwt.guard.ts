/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/infrastructure/auth/jwt.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jose from 'jose';
import { AuthContext } from './auth.decorator';

type AuthenticatedRequest = Request & { auth?: AuthContext };
type RealmAccess = { roles?: string[] };
type JwtPayload = {
  sub?: string;
  azp?: string;
  iss?: string;
  realm_access?: RealmAccess;
  sucursalId?: string;
  codigoExt?: string;
  [k: string]: unknown;
};

@Injectable()
export class JwtGuard implements CanActivate {
  private url = process.env.KEYCLOAK_URL!;
  private realm = process.env.KEYCLOAK_REALM!;
  private issuer = `${this.url}/realms/${this.realm}`;
  private expectedAzp = process.env.KEYCLOAK_EXPECTED_AZP || 'plex-integration';
  private requiredRole =
    process.env.KEYCLOAK_REQUIRED_ROLE || 'integration:plex';

  private jwks = jose.createRemoteJWKSet(
    new URL(`${this.issuer}/protocol/openid-connect/certs`),
  );

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const rawAuth = req.headers['authorization'];
    const authHeader = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : undefined;

    if (!token) throw new UnauthorizedException('Missing bearer token');

    let payload: JwtPayload;
    try {
      const verified = await jose.jwtVerify<JwtPayload>(token, this.jwks, {
        issuer: this.issuer,
        clockTolerance: 10,
      });
      payload = verified.payload;
    } catch (error) {
      throw new UnauthorizedException(error);
    }

    if (payload.azp !== this.expectedAzp) {
      throw new UnauthorizedException('Invalid authorized party');
    }

    const roles = payload.realm_access?.roles ?? [];
    if (!roles.includes(this.requiredRole)) {
      throw new UnauthorizedException('Missing required role');
    }

    if (!payload.sucursalId || !payload.codigoExt) {
      throw new UnauthorizedException('Missing sucursal codes');
    }

    req.auth = {
      sub: String(payload.sub ?? ''),
      roles,
      azp: String(payload.azp ?? ''),
      sucursalId: payload.sucursalId,
      codigoExt: payload.codigoExt,
    };
    return true;
  }
}
