import { Lote } from '@puntos/core/entities/Lote';
import { Saldo } from '@puntos/core/entities/Saldo';

export function obtenerLotesActualizados(
  saldo: Saldo,
  nuevoLote?: Lote,
): Lote[] {
  return saldo
    .getLotes()
    .filter((lote) => !nuevoLote || lote.id.value !== nuevoLote.id.value)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}
