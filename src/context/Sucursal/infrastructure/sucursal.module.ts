// src/context/Sucursal/infrastructure/SucursalInfrastructureModule.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SucursalEntity } from './persistence/entites/SucursalEntity';
import { SUCURSAL_REPO } from '../core/tokens/tokens';
import { SucursalTypeOrmRepository } from './persistence/repositories/SucursalTypeOrmRepositoryImpl';
@Module({
  imports: [TypeOrmModule.forFeature([SucursalEntity])],
  providers: [{ provide: SUCURSAL_REPO, useClass: SucursalTypeOrmRepository }],
  exports: [SUCURSAL_REPO, TypeOrmModule],
})
export class SucursalInfrastructureModule {}
