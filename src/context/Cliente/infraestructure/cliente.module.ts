// src/context/cliente/infrastructure/cliente.module.ts
import { Module } from '@nestjs/common';
import { ClienteRepositoryImpl } from './persistence/ClienteRepositoryImpl';
import { PuntosServiceInMemory } from './adapters/PuntosServiceInMemory';
import { ClienteGetProfile } from '../application/use-cases/ClienteGetProfile/ClienteGetProfile';
import { SaldoService } from 'src/context/Puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';

@Module({
  providers: [
    // Tu use-case sin decoradores internos
    ClienteGetProfile,

    // Repo de Cliente
    { provide: 'ClienteRepository', useClass: ClienteRepositoryImpl },

    // Servicio de puntos
    SaldoService,
    {
      provide: 'IPuntosService',
      useFactory: (saldoSvc: SaldoService) =>
        new PuntosServiceInMemory(saldoSvc),
      inject: [SaldoService],
    },
  ],
  exports: [ClienteGetProfile],
})
export class ClienteModule {}
