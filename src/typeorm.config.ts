import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

const rootDir = __dirname;

export default new DataSource({
  type: 'postgres',
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  logging: process.env.DB_LOGGING === 'true',
  entities: [
    join(rootDir, '**/*.entity.{ts,js}'),
    join(rootDir, '**/*Entity.{ts,js}'),
  ],
  migrations: [join(rootDir, 'migrations/*{.ts,.js}')],
  migrationsTableName: 'typeorm_migrations',
});
