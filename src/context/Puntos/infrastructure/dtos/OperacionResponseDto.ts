import { OpTipo } from '@shared/core/enums/OpTipo';
import { TipoMoneda } from '@shared/core/enums/TipoMoneda';
import { Operacion } from '../../core/entities/Operacion';

export class OperacionResponseDto {
  id: number;
  clienteId: string;
  tipo: OpTipo;
  fecha: Date;
  origenTipo: string;
  puntos?: number;
  monto?: number;
  moneda?: TipoMoneda;
  refOperacion?: string | null;
  refAnulacion?: number | null;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(this: void, operacion: Operacion): OperacionResponseDto {
    const dto = new OperacionResponseDto();
    dto.id = operacion.id.value;
    dto.clienteId = operacion.clienteId;
    dto.tipo = operacion.tipo;
    dto.fecha = operacion.fecha.value;
    dto.origenTipo = operacion.origenTipo.value;
    dto.puntos = operacion.puntos?.value;
    dto.monto = operacion.monto?.value;
    dto.moneda = operacion.moneda?.value;
    dto.refOperacion = operacion.refOperacion?.value ?? null;
    dto.refAnulacion = operacion.refAnulacion?.value ?? null;
    return dto;
  }
}
