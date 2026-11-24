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
  findByDNICandidates(candidates: string[]): Promise<Cliente | null>;
  findByNroTarjeta(nroTarjeta: ClienteTarjetaFidely): Promise<Cliente | null>;
  findByIdFidely(idFidely: ClienteIdFidely): Promise<Cliente | null>;
  existsByTarjetaFidely(numero: string): Promise<boolean>;
  create(cliente: Cliente, ctx?: TransactionContext): Promise<void>;
  update(cliente: Cliente, ctx?: TransactionContext): Promise<void>;
  /** Deja al cliente pendiente de informar a Plex (sin cambiar sus datos). */
  touchByDni(dni: string): Promise<void>;

  findPagedByIdAsc(params: {
    lastId?: ClienteId | null;
    limit: number;
  }): Promise<Cliente[]>;

  /**
   * Clientes publicados como novedad para Plex en el rango (novedad_plex_at),
   * a partir de lo último entregado a ese consumidor, de a `limite`, los más
   * viejos primero. `ultimoClienteId` es el último de la tanda (para marcarla
   * como entregada); `hayMas` indica que quedaron clientes fuera por el tope.
   */
  findNovedadesPlexParaEntregar(params: {
    consumidor: string;
    from: Date;
    to: Date;
    limite: number;
  }): Promise<{
    clientes: Cliente[];
    ultimoClienteId: string | null;
    hayMas: boolean;
  }>;

  /**
   * Avanza la marca de entrega del consumidor hasta ese cliente (solo hacia
   * adelante). Se llama cuando la respuesta a Plex salió completa.
   */
  marcarNovedadesPlexEntregadas(
    consumidor: string,
    ultimoClienteId: string,
  ): Promise<void>;

  /**
   * Publica como novedad para Plex hasta `limite` clientes pendientes, los más
   * viejos primero. Devuelve cuántos publicó.
   */
  liberarNovedadesPlex(limite: number): Promise<number>;
}
