import 'express-serve-static-core';
import type { AuthContext } from '../infrastructure/auth/auth.decorator';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext;
  }
}
