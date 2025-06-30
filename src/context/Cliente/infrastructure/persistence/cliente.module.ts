import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteEntity } from './entities/ClienteEntity';
import { CategoriaEntity } from './entities/CategoriaEntity';
import { ClienteRepositoryImpl } from './ClienteRepository/ClienteRepositoryImpl';

@Module({
  imports: [TypeOrmModule.forFeature([ClienteEntity, CategoriaEntity])],
  providers: [
    {
      provide: 'ClienteRepository', // el token que usa tu capa de aplicación
      useClass: ClienteRepositoryImpl, // tu implementación concreta
    },
  ],
  exports: ['ClienteRepository'], // exporta los repositorios para que puedan ser usados en otros módulos
})
export class ClientePersistenceModule {
  // Aquí puedes definir tus repositorios, entidades, etc.
  // Por ejemplo, si tienes un Repositorio de Clientes:
  // providers: [TypeOrmClienteRepository],
  // exports: [TypeOrmClienteRepository],
}
