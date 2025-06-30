// src/infrastructure/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { configValidationSchema } from './validation';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true, // importa el módulo una sola vez
      envFilePath: [
        // orden de prioridad
        `.env.${process.env.NODE_ENV}`,
        '.env',
      ],
      load: [configuration], // carga tu función configuradora
      validationSchema: configValidationSchema, // valida con Joi
      cache: true,
    }),
  ],
})
export class ConfigModule {}
