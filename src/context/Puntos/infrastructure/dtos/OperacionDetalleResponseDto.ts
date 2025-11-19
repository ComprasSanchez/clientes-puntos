// @puntos/infrastructure/http/dtos/OperacionDetalleResponseDto.ts
import { OperacionDetalleView } from '@puntos/application/use-cases/OperacionDetalleView/OperacionDetalleView';
import { OperacionResponseDto } from './OperacionResponseDto';
import { TransaccionDetalleDto } from './TransaccionDetalleDto';
import { ClienteBasicDataDto } from './ClienteBasicDataDto';

export class OperacionDetalleResponseDto {
  operacion: OperacionResponseDto;
  puntosCredito: number;
  puntosDebito: number;
  puntosDelta: number;
  reglasAplicadas: Record<string, Array<{ id: string; nombre: string }>>;
  transacciones: TransaccionDetalleDto[];
  cliente: ClienteBasicDataDto | null;

  static fromView(view: OperacionDetalleView): OperacionDetalleResponseDto {
    const dto = new OperacionDetalleResponseDto();

    dto.operacion = OperacionResponseDto.fromDomain(view.operacion);

    dto.puntosCredito = view.valor.puntosCredito;
    dto.puntosDebito = view.valor.puntosDebito;
    dto.puntosDelta = view.valor.puntosDelta;
    dto.reglasAplicadas = view.valor.reglasAplicadas;

    dto.transacciones = view.transacciones.map((t) =>
      TransaccionDetalleDto.fromDomain(t),
    );
    dto.cliente = ClienteBasicDataDto.fromPort(view.cliente);

    return dto;
  }
}
