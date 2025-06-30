// src/context/cliente/infrastructure/ClienteInfrastructureModule.ts
import { Module, Provider } from '@nestjs/common';
import {
  CATEGORIA_REPO,
  CLIENTE_REPO,
  IPUNTOS_SERVICE,
} from '../core/tokens/tokens';
import { ObtenerSaldo } from 'src/context/Puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
import { PuntosServiceInMemory } from './adapters/PuntosServiceInMemory/PuntosServiceInMemory';
import { ClienteGetProfile } from '../application/use-cases/ClienteGetProfile/ClienteGetProfile';
import { ClienteRepository } from '../core/repository/ClienteRepository';
import { IPuntosService } from '../application/ports/IPuntosService';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { ClientePersistenceModule } from './persistence/cliente.module';
import { TypeOrmClienteRepository } from './persistence/ClienteRepository/ClienteRepositoryImpl';
import { TypeOrmCategoriaRepository } from './persistence/CategoriaRepository/CategoriaRepository';

const providers: Provider[] = [
  // 1) Repo puro
  { provide: CLIENTE_REPO, useClass: TypeOrmClienteRepository },
  { provide: CATEGORIA_REPO, useClass: TypeOrmCategoriaRepository },

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
  exports: [ClienteGetProfile, DatabaseModule, ClientePersistenceModule],
})
export class ClienteInfrastructureModule {}
