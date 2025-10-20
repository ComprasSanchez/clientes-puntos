// src/context/Producto/infrastructure/controllers/Producto.controller.ts
import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UpsertProductos } from '../../application/use-cases/UpsertProductos';
import { GetProductoById } from '../../application/use-cases/GetProductoById';
import { ListarProductos } from '../../application/use-cases/ListarProductos';
import { TipoClasificador } from '../../core/enums/TipoClasificador.enum';
import { Producto } from '../../core/entities/Producto';
import { UpsertProductoPlano } from '../../core/dtos/UpsertProductoPlano';
import { ApiJwtGuard } from '@infrastructure/auth/api-jwt.guard';
import { Authz } from '@infrastructure/auth/authz-policy.decorator';

type ProductoHttpDto = {
  idProducto: string;
  producto: string;
  presentacion: string;
  costo: number;
  precio: number;
  clasificadores: Array<{
    idTipoClasificador: number;
    idClasificador: number;
    nombre: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

@UseGuards(ApiJwtGuard)
@Authz({
  allowedAzp: ['puntos-fsa', 'bff'],
  requireSucursalData: false,
})
@Controller('productos')
export class ProductoController {
  constructor(
    private readonly upsert: UpsertProductos,
    private readonly getById: GetProductoById,
    private readonly listar: ListarProductos,
  ) {}

  /**
   * Upsert masivo/individual vía JSON.
   * POST /productos/upsert
   * (Sólo administrator)
   */
  @Authz({
    allowedAzp: ['puntos-fsa'],
    requiredClientRoles: { 'puntos-fsa': ['administrator'] },
    requireSucursalData: false,
  })
  @Post('upsert')
  async upsertJson(
    @Body() body: UpsertProductoPlano[] | UpsertProductoPlano,
  ): Promise<{ upserted: number }> {
    if (!body || (Array.isArray(body) && body.length === 0)) {
      throw new BadRequestException('Body vacío o inválido.');
    }
    const items: UpsertProductoPlano[] = Array.isArray(body) ? body : [body];
    await this.upsert.run(items);
    return { upserted: items.length };
  }

  /**
   * GET /productos/:id
   * (Lectura: consultant | administrator)
   */
  @Get(':id')
  async get(@Param('id') id: string): Promise<ProductoHttpDto> {
    const p = await this.getById.run(id);
    if (!p) throw new NotFoundException('Producto no encontrado');
    return toHttpDto(p);
  }

  /**
   * GET /productos
   * (Lectura: consultant | administrator)
   */
  @Get()
  async list(
    @Query('q') q?: string,
    @Query('tipo') tipo?: string,
    @Query('idClasificador') idClasificador?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ): Promise<{ total: number; items: ProductoHttpDto[] }> {
    const limit = parsePositiveInt(limitStr, 20);
    const offset = parseNonNegativeInt(offsetStr, 0);

    const filter =
      tipo && idClasificador
        ? { tipo: Number(tipo) as TipoClasificador, idClasificador }
        : undefined;

    const res = await this.listar.run({
      search: q,
      clasificador: filter,
      limit,
      offset,
    });

    return {
      total: res.total,
      items: res.items.map(toHttpDto),
    };
  }
}

/* ------------------------- Helpers ------------------------- */

function toHttpDto(p: Producto): ProductoHttpDto {
  return {
    idProducto: p.id.value,
    producto: p.nombre.value,
    presentacion: p.presentacion.value,
    costo: p.costo.value,
    precio: p.precio.value,
    clasificadores: p.clasificadores.map((c) => ({
      idTipoClasificador: Number(c.tipo),
      idClasificador: Number(c.idClasificador),
      nombre: c.nombre,
    })),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function parsePositiveInt(v: string | undefined, def: number): number {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

function parseNonNegativeInt(v: string | undefined, def: number): number {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : def;
}
