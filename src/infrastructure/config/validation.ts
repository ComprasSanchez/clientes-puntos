import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  DB_HOST: Joi.string().default('localhost').required(),
  DB_PORT: Joi.number().default(5432).required(),
  DB_USER: Joi.string().default('postgres').required(),
  DB_PASS: Joi.string().default('secret').required(),
  DB_NAME: Joi.string().default('clientes_puntos').required(),
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
