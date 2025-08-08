import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: {
      sub: string;
      roles: string[];
      azp: string;
      sucursalId: string;
      groups: string[];
    };
  }
}
