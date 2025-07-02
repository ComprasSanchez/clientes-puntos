import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteEntity } from '../entities/ClienteEntity';
import { CategoriaEntity } from '../entities/CategoriaEntity';
import { TypeOrmClienteRepository } from './ClienteRepository/ClienteRepositoryImpl';
import { TypeOrmCategoriaRepository } from './CategoriaRepository/CategoriaRepository';
import { CATEGORIA_REPO, CLIENTE_REPO } from '@cliente/core/tokens/tokens';

@Module({
  imports: [TypeOrmModule.forFeature([ClienteEntity, CategoriaEntity])],
  providers: [
    {
      provide: CLIENTE_REPO, // el token que usa tu capa de aplicación
      useClass: TypeOrmClienteRepository, // tu implementación concreta
    },
    {
      provide: CATEGORIA_REPO, // si tienes un repositorio de categorías
      useClass: TypeOrmCategoriaRepository, // o una implementación específica para categorías
    },
  ],
  exports: [CLIENTE_REPO, CATEGORIA_REPO, TypeOrmModule], // exporta los repositorios para que puedan ser usados en otros módulos
})
export class ClientePersistenceModule {
  // Aquí puedes definir tus repositorios, entidades, etc.
  // Por ejemplo, si tienes un Repositorio de Clientes:
  // providers: [TypeOrmClienteRepository],
  // exports: [TypeOrmClienteRepository],
}
