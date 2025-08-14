// src/context/Producto/infrastructure/producto.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductoEntity } from './entities/Producto.entity';
import { ProductoClasificadorEntity } from './entities/ProductoClasificador.entity';

import { PRODUCTO_REPO } from '../core/tokens/tokens';
import { ProductoTypeOrmRepository } from './repositories/ProductoRepositoryTypeOrmImpl';
import { UpsertProductos } from '../application/use-cases/UpsertProductos';
import { GetProductoById } from '../application/use-cases/GetProductoById';
import { ListarProductos } from '../application/use-cases/ListarProductos';
import { ProductoController } from './controllers/producto.controller';
import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';
import { UUIDv4Generator } from '@shared/infrastructure/uuid/UuidV4Generator';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductoEntity, ProductoClasificadorEntity]),
  ],
  controllers: [ProductoController],
  providers: [
    UpsertProductos,
    GetProductoById,
    ListarProductos,
    { provide: PRODUCTO_REPO, useClass: ProductoTypeOrmRepository },
    { provide: UUIDGenerator, useClass: UUIDv4Generator },
  ],
  exports: [
    // exporto casos de uso y el token del repo por si otro módulo los necesita
    UpsertProductos,
    GetProductoById,
    ListarProductos,
    PRODUCTO_REPO,
    TypeOrmModule, // útil si otro módulo compone repos con estas entities
  ],
})
export class ProductoModule {}
