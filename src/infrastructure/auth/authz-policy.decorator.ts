import { SetMetadata } from '@nestjs/common';

export type AuthzPolicy = {
  allowedAzp?: string[]; // qué clientes emisores acepto (opcional)
  requiredRealmRoles?: string[]; // realm roles requeridos (opcional)
  requiredClientRoles?: Record<string, string[]>; // clientId -> roles requeridos (opcional)
  requireSucursalData?: boolean; // exigir sucursalId/codigoExt (default true)
};

export const AUTHZ_KEY = 'authz_policy';
export const Authz = (policy: AuthzPolicy) => SetMetadata(AUTHZ_KEY, policy);
