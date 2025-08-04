import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_PUBLIC_URL: Joi.string().uri().required(),
  PGHOST: Joi.string().default('localhost').required(),
  PGPORT: Joi.number().default(5432).required(),
  PGUSER: Joi.string().default('postgres').required(),
  PGPASSWORD: Joi.string().default('secret').required(),
  PGDATABASE: Joi.string().default('clientes_puntos').required(),
  KEYCLOAK_URL: Joi.string().default('').required(),
  KEYCLOAK_REALM: Joi.string().default('FSA').required(),
  KEYCLOAK_CLIENT_ID: Joi.string().default('puntos-fsa').required(),
  KEYCLOAK_CLIENT_SECRET: Joi.string().default('').required(),
  CAMPANIA_ID: Joi.number().required(),
  REDIS_PASSWORD: Joi.string().required(),
  REDISHOST: Joi.string().required(),
  REDISPORT: Joi.number().required(),
  REDISUSER: Joi.string().required(),
  REDIS_URL: Joi.string().optional(),
});
