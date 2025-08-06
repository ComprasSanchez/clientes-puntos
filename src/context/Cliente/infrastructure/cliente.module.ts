// @cliente/infrastructure/ClienteInfrastructureModule.ts
import { forwardRef, Module, Provider } from '@nestjs/common';
import { CATEGORIA_REPO, CLIENTE_REPO } from '../core/tokens/tokens';
import { ClienteGetProfile } from '../application/use-cases/ClienteGetProfile/ClienteGetProfile';
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
import { ClienteCreate } from '@cliente/application/use-cases/ClienteCreate/ClienteCreate';
import { ClienteDelete } from '@cliente/application/use-cases/ClienteDelete/ClienteDelete';
import { ClienteUpdate } from '@cliente/application/use-cases/ClienteUpdate/ClienteUpdate';
import { ClienteFindAll } from '@cliente/application/use-cases/ClienteFindAll/ClienteFindAll';
import { ClienteFindByDni } from '@cliente/application/use-cases/ClienteFindByDni/ClienteFindByDni';
import { ClienteFindById } from '@cliente/application/use-cases/ClienteFindbyId/ClienteFindById';
import { ClienteController } from './controllers/ClienteController';
import { PuntosInfrastructureModule } from '@puntos/infrastructure/puntos.module';
import { ClienteFindByTarjeta } from '@cliente/application/use-cases/ClienteFindByTarjeta/ClienteFindByTarjeta';
import { uniqueCardGenerator } from '@cliente/application/services/CardGenerator';

const providers: Provider[] = [
  // 1) Repo puro
  ClienteCreate,
  ClienteDelete,
  ClienteUpdate,
  ClienteFindAll,
  ClienteFindByDni,
  ClienteFindById,
  ClienteGetProfile,
  ClienteFindByTarjeta,
  { provide: CLIENTE_REPO, useClass: TypeOrmClienteRepository },

  CategoriaCreate,
  CategoriaFindAll,
  CategoriaFindById,
  CategoriaUpdate,
  CategoriaDelete,
  { provide: CATEGORIA_REPO, useClass: TypeOrmCategoriaRepository },

  uniqueCardGenerator,
];

@Module({
  imports: [
    DatabaseModule, // ← Debe ir aquí
    ClientePersistenceModule, // ← y aquí si lo vas a exportar
    forwardRef(() => PuntosInfrastructureModule),
  ],
  controllers: [CategoriaController, ClienteController],
  providers,
  exports: [
    ClienteCreate,
    ClienteUpdate,
    ClienteGetProfile,
    ClienteFindByDni,
    ClienteFindByTarjeta,
    DatabaseModule,
    ClientePersistenceModule,
  ],
})
export class ClienteInfrastructureModule {}
