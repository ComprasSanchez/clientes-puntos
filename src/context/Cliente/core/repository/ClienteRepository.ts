import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { Cliente } from '../entities/Cliente';
import { ClienteDni } from '../value-objects/ClienteDni';
import { ClienteId } from '../value-objects/ClienteId';
import { ClienteTarjetaFidely } from '../value-objects/ClienteTarjetaFidely';
import { ClienteIdFidely } from '../value-objects/ClienteIdFidely';

export interface ClienteRepository {
  findAll(): Promise<Cliente[]>;
  countAll(): Promise<number>;
  findById(id: ClienteId): Promise<Cliente | null>;
  findByDni(dni: ClienteDni): Promise<Cliente | null>;
  findByNroTarjeta(nroTarjeta: ClienteTarjetaFidely): Promise<Cliente | null>;
  findByIdFidely(idFidely: ClienteIdFidely): Promise<Cliente | null>;
  existsByTarjetaFidely(numero: string): Promise<boolean>;
  create(cliente: Cliente, ctx?: TransactionContext): Promise<void>;
  update(cliente: Cliente, ctx?: TransactionContext): Promise<void>;
}
