/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
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

const isFiniteNum = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n);

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
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        trimValues: true,
      });
      const parsedObj = parser.parse(xml) as unknown;

      const dto = PlexFidelizarProductoRequestMapper.fromXml(parsedObj);

      switch (dto.codAccion.toString() as codFidelizarProducto) {
        case codFidelizarProducto.NUEVO:
        case codFidelizarProducto.EDICION: {
          const items: UpsertProductoPlano[] = dto.productos.map((p) => ({
            idProducto: p.idProducto,
            producto: p.producto ?? '',
            presentacion: p.presentacion ?? '',
            costo: isFiniteNum(p.costo) ? p.costo : 0,
            precio: isFiniteNum(p.precio) ? p.precio : 0,
            activa: p.activa ?? true,
            clasificadores: (p.clasificadores ?? []).map((c) => ({
              idTipoClasificador: c.idTipoClasificador,
              idClasificador: c.idClasificador,
              nombre: c.nombre ?? '',
            })),
          }));
          await this.upsertProductos.run(items);
          break;
        }

        case codFidelizarProducto.BAJA: {
          for (const p of dto.productos) {
            await this.desactivarProducto.run(p.idProducto);
          }
          break;
        }

        case codFidelizarProducto.REACTIVACION: {
          for (const p of dto.productos) {
            await this.reactivarProducto.run(p.idProducto);
          }
          break;
        }

        case codFidelizarProducto.PRECIOS: {
          for (const p of dto.productos) {
            await this.actualizarPrecio.run({
              codExt: p.idProducto,
              nuevoPrecio: isFiniteNum(p.precio) ? p.precio : undefined,
              nuevoCosto: isFiniteNum(p.costo) ? p.costo : undefined,
            });
          }
          break;
        }

        default:
          return this.fail(`CodAccion desconocido: ${dto.codAccion}`);
      }

      return this.ok('OK');
    } catch (err: any) {
      return this.fail(err?.message ?? 'Error inesperado');
    }
  }

  private ok(msg: string): UseCaseResponse {
    const respDto = { respCode: '0', respMsg: msg };
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    const xmlResponseObj = PlexFidelizarProductoResponseMapper.toXml(respDto);
    const xmlString = builder.build(xmlResponseObj);
    return {
      response: `<?xml version="1.0" encoding="utf-8"?>\n${xmlString}`,
      dto: respDto,
    };
  }

  private fail(msg: string): UseCaseResponse {
    const respDto = { respCode: '1', respMsg: msg };
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    const xmlResponseObj = PlexFidelizarProductoResponseMapper.toXml(respDto);
    const xmlString = builder.build(xmlResponseObj);
    return {
      response: `<?xml version="1.0" encoding="utf-8"?>\n${xmlString}`,
      dto: respDto,
    };
  }
}
