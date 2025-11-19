// @puntos/infrastructure/http/dtos/ClienteBasicDataDto.ts
import { ClienteBasicData } from '@puntos/core/interfaces/ClienteQuery';

export class ClienteBasicDataDto {
  id: string;
  nombre: string;
  apellido?: string;
  documento?: string;
  email?: string;

  static fromPort(c: ClienteBasicData | null): ClienteBasicDataDto | null {
    if (!c) return null;
    const dto = new ClienteBasicDataDto();
    dto.id = c.id;
    dto.nombre = c.nombre;
    dto.apellido = c.apellido;
    dto.documento = c.documento;
    return dto;
  }
}
