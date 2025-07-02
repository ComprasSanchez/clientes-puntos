// @cliente/infrastructure/ClienteInfrastructureModule.ts
import { Module, Provider } from '@nestjs/common';
import {
  CATEGORIA_REPO,
  CLIENTE_REPO,
  IPUNTOS_SERVICE,
} from '../core/tokens/tokens';
import { ObtenerSaldo } from '../../Puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
import { PuntosServiceInMemory } from './adapters/PuntosServiceInMemory/PuntosServiceInMemory';
import { ClienteGetProfile } from '../application/use-cases/ClienteGetProfile/ClienteGetProfile';
import { ClienteRepository } from '../core/repository/ClienteRepository';
import { IPuntosService } from '../application/ports/IPuntosService';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { ClientePersistenceModule } from './persistence/cliente.module';
import { TypeOrmClienteRepository } from './persistence/ClienteRepository/ClienteRepositoryImpl';
import { TypeOrmCategoriaRepository } from './persistence/CategoriaRepository/CategoriaRepository';
import { CategoriaController } from './controllers/CategoriaController';
import { CategoriaCreate } from '@cliente/application/use-cases/CategoriaCreate/CategoriaCreate';
import { CategoriaFindAll } from '@cliente/application/use-cases/CategoriaFindAll/CategoriaFindAll';
import { CategoriaFindById } from '@cliente/application/use-cases/CategoriaFindById/CategoriaFindById';
import { CategoriaUpdate } from '@cliente/application/use-cases/CategoriaUpdate/CategoriaUpdate';
import { CategoriaDelete } from '@cliente/application/use-cases/CategoriaDelete/CategoriaDelete';

const providers: Provider[] = [
  // 1) Repo puro
  { provide: CLIENTE_REPO, useClass: TypeOrmClienteRepository },

  CategoriaCreate,
  CategoriaFindAll,
  CategoriaFindById,
  CategoriaUpdate,
  CategoriaDelete,
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
  imports: [
    DatabaseModule, // ← Debe ir aquí
    ClientePersistenceModule, // ← y aquí si lo vas a exportar
  ],
  controllers: [CategoriaController],
  providers,
  exports: [ClienteGetProfile, DatabaseModule, ClientePersistenceModule],
})
export class ClienteInfrastructureModule {}
