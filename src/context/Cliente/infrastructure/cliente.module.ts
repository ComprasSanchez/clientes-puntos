// src/context/cliente/infrastructure/cliente.module.ts
import { Module } from '@nestjs/common';
import { ClienteRepositoryImpl } from './persistence/ClienteRepositoryImpl';
import { PuntosServiceInMemory } from './adapters/PuntosServiceInMemory/PuntosServiceInMemory';
import { ClienteGetProfile } from '../application/use-cases/ClienteGetProfile/ClienteGetProfile';
import { ObtenerSaldo } from 'src/context/Puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';

@Module({
  providers: [
    // Tu use-case sin decoradores internos
    ClienteGetProfile,

    // Repo de Cliente
    { provide: 'ClienteRepository', useClass: ClienteRepositoryImpl },

    // Servicio de puntos
    ObtenerSaldo,
    {
      provide: 'IPuntosService',
      useFactory: (saldoSvc: ObtenerSaldo) =>
        new PuntosServiceInMemory(saldoSvc),
      inject: [ObtenerSaldo],
    },
  ],
  exports: [ClienteGetProfile],
})
export class ClienteModule {}
