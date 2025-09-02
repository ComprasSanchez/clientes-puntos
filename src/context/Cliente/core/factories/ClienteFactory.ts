// @cliente/core/factories/ClienteFactory.ts
import { Cliente } from '../entities/Cliente';
import { Categoria } from '../entities/Categoria';
import { ClienteId } from '../value-objects/ClienteId';
import { ClienteDni } from '../value-objects/ClienteDni';
import { ClienteNombre } from '../value-objects/ClienteNombre';
import { ClienteApellido } from '../value-objects/ClienteApellido';
import { ClienteSexo } from '../value-objects/ClienteSexo';
import { ClienteStatus } from '../value-objects/ClienteStatus';
import {
  safeFechaNacimiento,
  safeEmail,
  safeTelefono,
  safeDireccion,
  safeCodigoPostal,
  safeLocalidad,
  safeProvincia,
  safeIdFidely,
  safeTarjetaFidely,
} from './vo-safe';
import { ClienteFechaNacimiento } from '../value-objects/ClienteFechaNacimiento';

type ClientePlano = {
  id: string;
  dni: string | number;
  nombre: string;
  apellido: string;
  sexo: string;
  fechaNacimiento?: string | Date | null;
  status: string | number;
  categoria: Categoria;

  idFidely?: string | number | null;
  tarjetaFidely?: string | number | null;

  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  codPostal?: string | number | null;
  localidad?: string | null;
  provincia?: string | null;
};

// @cliente/core/factories/ClienteFactory.ts
export class ClienteFactory {
  static crear(dto: ClientePlano): Cliente {
    return new Cliente(
      // muchos VOs tuyos esperan string → normalizamos
      new ClienteId(String(dto.id)),
      new ClienteDni(String(dto.dni)),
      new ClienteNombre(String(dto.nombre)),
      new ClienteApellido(String(dto.apellido)),
      new ClienteSexo(String(dto.sexo)),

      // si tu entidad AÚN NO acepta null en el ctor, usa el fallback:
      safeFechaNacimiento(dto.fechaNacimiento) ??
        new ClienteFechaNacimiento(null),

      // si ClienteStatus espera string, normalizá también:
      new ClienteStatus(String(dto.status)),

      dto.categoria,

      // Tarjeta & Fidely (tus safe ya admiten string|number|null)
      safeTarjetaFidely(dto.tarjetaFidely),
      safeIdFidely(dto.idFidely),

      // opcionales
      safeEmail(dto.email),
      safeTelefono(dto.telefono),
      safeDireccion(dto.direccion),
      safeCodigoPostal(dto.codPostal),
      safeLocalidad(dto.localidad),
      safeProvincia(dto.provincia),
    );
  }
}
