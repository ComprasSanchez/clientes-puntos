import { Cliente } from '../entities/Cliente';
import { Categoria } from '../entities/Categoria';
import { ClienteDni } from '../value-objects/ClienteDni';
import { ClienteId } from '../value-objects/ClienteId';
import { ClienteIdFidely } from '../value-objects/ClienteIdFidely';
import { ClienteStatus } from '../value-objects/ClienteStatus';
import { ClienteTarjetaFidely } from '../value-objects/ClienteTarjetaFidely';

type ClientePlano = {
  id: string;
  dni: string | number;
  status: string | number;
  categoria: Categoria;
  idFidely?: string | number | null;
  tarjetaFidely?: string | number | null;
};

export class ClienteFactory {
  static crear(dto: ClientePlano): Cliente {
    return new Cliente({
      id: new ClienteId(String(dto.id)),
      dni: new ClienteDni(String(dto.dni)),
      status: new ClienteStatus(String(dto.status)),
      categoria: dto.categoria,
      tarjetaFidely: new ClienteTarjetaFidely(
        String(dto.tarjetaFidely ?? dto.dni),
      ),
      idFidely:
        dto.idFidely === null || dto.idFidely === undefined
          ? new ClienteIdFidely(undefined)
          : new ClienteIdFidely(Number(dto.idFidely)),
    });
  }
}
