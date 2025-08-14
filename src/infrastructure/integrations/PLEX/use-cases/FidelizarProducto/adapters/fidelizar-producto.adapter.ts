/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// infrastructure/integrations/PLEX/adapters/FidelizarProductoPlexAdapter.ts
import { Inject, Injectable } from '@nestjs/common';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { UseCaseResponse } from '@infrastructure/integrations/PLEX/dto/usecase-response.dto';
import { UpsertProductos } from 'src/context/Producto/application/use-cases/UpsertProductos';
import { DesactivarProducto } from 'src/context/Producto/application/use-cases/DesactivarProducto';
import { ReactivarProducto } from 'src/context/Producto/application/use-cases/ReactivarProducto';
import { PlexFidelizarProductoRequestMapper } from '../dto/fidelizar-producto.request.dto';
import { codFidelizarProducto } from '@infrastructure/integrations/PLEX/enums/fidelizar-producto.enum';
import { UpsertProductoPlano } from 'src/context/Producto/core/dtos/UpsertProductoPlano';
import { PlexFidelizarProductoResponseMapper } from '../dto/fideliza-producto-response.dto';
import { ActualizarPrecioProducto } from 'src/context/Producto/application/use-cases/ActualizarPreciosProducto';

@Injectable()
export class FidelizarProductoPlexAdapter {
  constructor(
    @Inject(UpsertProductos) private readonly upsertProductos: UpsertProductos,
    @Inject(DesactivarProducto)
    private readonly desactivarProducto: DesactivarProducto,
    @Inject(ReactivarProducto)
    private readonly reactivarProducto: ReactivarProducto,
    @Inject(ActualizarPrecioProducto)
    private readonly actualizarPrecio: ActualizarPrecioProducto,
  ) {}

  async handle(xml: string): Promise<UseCaseResponse> {
    // 1) Parse XML
    const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
    const parsedObj = parser.parse(xml) as unknown;

    // 2) Map a DTO PLEX
    const dto = PlexFidelizarProductoRequestMapper.fromXml(parsedObj);

    // 3) Ejecutar caso de uso según acción
    switch (dto.codAccion as codFidelizarProducto) {
      case codFidelizarProducto.NUEVO:
      case codFidelizarProducto.EDICION: {
        // Armamos el input esperado por UpsertProductos
        const item: UpsertProductoPlano = {
          idProducto: dto.idProducto,
          producto: dto.producto ?? '',
          presentacion: dto.presentacion ?? '',
          costo: dto.costo ?? 0,
          precio: dto.precio ?? 0,
          activa: dto.activa ?? true,
          clasificadores: (dto.clasificadores ?? []).map((c) => ({
            ...c,
            nombre: c.nombre ?? '',
          })),
        };
        await this.upsertProductos.run([item]);
        break;
      }

      case codFidelizarProducto.BAJA: {
        await this.desactivarProducto.run(dto.idProducto);
        break;
      }

      case codFidelizarProducto.REACTIVACION: {
        await this.reactivarProducto.run(dto.idProducto);
        break;
      }

      case codFidelizarProducto.PRECIOS: {
        await this.actualizarPrecio.run({
          codExt: dto.idProducto,
          nuevoPrecio: dto.precio,
          nuevoCosto: dto.costo,
        });
        break;
      }

      default:
        throw new Error(`CodAccion desconocido: ${dto.codAccion}`);
    }

    // 4) Construir response DTO y XML
    const respDto = {
      respCode: '0',
      respMsg: 'OK',
    };

    const xmlResponseObj = PlexFidelizarProductoResponseMapper.toXml(respDto);
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    const xmlString = builder.build(xmlResponseObj);

    return {
      response: `<?xml version="1.0" encoding="utf-8"?>\n${xmlString}`,
      dto: respDto,
    };
  }
}
