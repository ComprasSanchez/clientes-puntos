/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  toDec,
  toInt,
} from '@infrastructure/integrations/PLEX/utils/num-parse';
import {
  PlexClasificadorDto,
  PlexFidelizarProductoRequestDto,
  PlexProductoDto,
} from '../interfaces/fidelizar-producto.request';

const asArray = <T>(x: T | T[] | undefined | null): T[] =>
  Array.isArray(x) ? x : x != null ? [x] : [];

export class PlexFidelizarProductoRequestMapper {
  static fromXml(parsed: any): PlexFidelizarProductoRequestDto {
    const root = parsed?.MensajeFidelyGB ?? parsed;

    const codAccion = toInt(root?.CodAccion);
    const idRed = toInt(root?.IdRed);
    const motivo = typeof root?.Motivo === 'string' ? root.Motivo : undefined;

    if (!Number.isFinite(codAccion as number)) {
      const e = new Error('CodAccion inválido');
      (e as any).status = 400;
      throw e;
    }

    // Esperamos 1..N nodos <Productos> (sin <Item> adentro)
    const productosNodes = asArray(root?.Productos);
    if (productosNodes.length === 0) {
      const e = new Error('No se encontró el nodo <Productos>');
      (e as any).status = 400;
      throw e;
    }

    // Rechazar formato incorrecto con <Item>
    const hasItem = productosNodes.some((n: any) => n?.Item !== undefined);
    if (hasItem) {
      const e = new Error(
        'Formato inválido: <Productos> no debe contener <Item>.',
      );
      (e as any).status = 400;
      throw e;
    }

    const productos: PlexProductoDto[] = productosNodes.map(
      (p: any, idx: number) => {
        const idProducto = toInt(p?.IdProducto);
        if (idProducto === undefined) {
          // podés tirar o filtrar; acá prefiero tirar para que el proveedor lo corrija
          const e = new Error(`Item[${idx}] IdProducto inválido`);
          (e as any).status = 400;
          throw e;
        }

        const rawClasifs = asArray(p?.Clasificadores);
        const clasificadores: PlexClasificadorDto[] = rawClasifs
          .map((c: any) => {
            const tipo = toInt(c?.IdTipoClasificador);
            const idc = toInt(c?.IdClasificador);
            if (tipo === undefined || idc === undefined) return undefined;
            return {
              idTipoClasificador: tipo,
              idClasificador: idc,
              nombre: typeof c?.Nombre === 'string' ? c.Nombre : undefined,
            } as PlexClasificadorDto;
          })
          .filter(Boolean) as PlexClasificadorDto[];

        return {
          idProducto,
          producto: typeof p?.Producto === 'string' ? p.Producto : undefined,
          presentacion:
            typeof p?.Presentacion === 'string' ? p.Presentacion : undefined,
          costo: toDec(p?.Costo),
          precio: toDec(p?.Precio),
          activa: p?.Activa === undefined ? true : !!p?.Activa,
          clasificadores,
        } as PlexProductoDto;
      },
    );

    return {
      codAccion: codAccion!,
      idRed: idRed,
      motivo,
      productos,
    };
  }
}
