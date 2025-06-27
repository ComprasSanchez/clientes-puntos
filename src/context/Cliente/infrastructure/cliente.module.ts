// src/context/cliente/infrastructure/ClienteInfrastructureModule.ts
import { Module, Provider } from '@nestjs/common';
import { ClienteRepositoryImpl } from './persistence/ClienteRepositoryImpl';
import { CLIENTE_REPO, IPUNTOS_SERVICE } from '../core/tokens/tokens';
import { ObtenerSaldo } from 'src/context/Puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
import { PuntosServiceInMemory } from './adapters/PuntosServiceInMemory/PuntosServiceInMemory';
import { ClienteGetProfile } from '../application/use-cases/ClienteGetProfile/ClienteGetProfile';
import { ClienteRepository } from '../core/repository/ClienteRepository';
import { IPuntosService } from '../application/ports/IPuntosService';

const providers: Provider[] = [
  // 1) Repo puro
  { provide: CLIENTE_REPO, useClass: ClienteRepositoryImpl },

  // 2) Caso de uso de Puntos (ya viene de PuntosApplicationModule o lo provees aquí)
  ObtenerSaldo,

  // 3) Adapter in-memory de IPuntosService
  {
    provide: IPUNTOS_SERVICE,
    useFactory: (saldoUc: ObtenerSaldo) => new PuntosServiceInMemory(saldoUc),
    inject: [ObtenerSaldo],
  },

  // 4) Tu caso de uso puro, instanciado por factory
  {
    provide: ClienteGetProfile,
    useFactory: (repo: ClienteRepository, puntosSvc: IPuntosService) =>
      new ClienteGetProfile(repo, puntosSvc),
    inject: [CLIENTE_REPO, IPUNTOS_SERVICE],
  },
];

@Module({
  providers,
  exports: [ClienteGetProfile],
})
export class ClienteInfrastructureModule {}
