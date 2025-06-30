// src/context/Puntos/infrastructure/persistence/persistence.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransaccionEntity } from '../entities/transaccion.entity';
import { TypeOrmTransaccionRepository } from './TransaccionRepository/TransaccionTypeOrmImpl';
import { LoteEntity } from '../entities/lote.entity';
import { TypeOrmLoteRepository } from './LoteRepository/LoteTypeOrmImpl';

@Module({
  imports: [TypeOrmModule.forFeature([TransaccionEntity, LoteEntity])],
  providers: [
    {
      provide: 'TransaccionRepository', // el token que usa tu capa de aplicación
      useClass: TypeOrmTransaccionRepository, // tu implementación concreta
    },
    {
      provide: 'LoteRepository', // el token que usa tu capa de aplicación
      useClass: TypeOrmLoteRepository, // tu implementación concreta
    },
  ],
  exports: ['TransaccionRepository', 'LoteRepository'], // exporta los repositorios para que puedan ser usados en otros módulos
})
export class PuntosPersistenceModule {}
