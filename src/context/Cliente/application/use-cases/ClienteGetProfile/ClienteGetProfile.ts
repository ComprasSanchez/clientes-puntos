import { ClienteNotFoundError } from '@cliente/core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { ClienteId } from '@cliente/core/value-objects/ClienteId';
import { ClienteProfileDto } from '@cliente/application/dtos/ClienteProfileDto';
import { IPuntosService } from '@cliente/application/ports/IPuntosService';
import { Inject, Injectable } from '@nestjs/common';
import { CLIENTE_REPO, IPUNTOS_SERVICE } from '@cliente/core/tokens/tokens';
import { ClienteCanonicalHydrator } from '@cliente/application/services/ClienteCanonicalHydrator';

@Injectable()
export class ClienteGetProfile {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
    @Inject(IPUNTOS_SERVICE)
    private readonly puntosService: IPuntosService,
    private readonly canonicalHydrator: ClienteCanonicalHydrator,
  ) {}

  /**
   * Devuelve el perfil completo de un cliente, incluyendo su saldo de puntos.
   */
  async run(id: string): Promise<ClienteProfileDto> {
    const cliente = await this.repository.findById(new ClienteId(id));
    if (!cliente) {
      throw new ClienteNotFoundError(id);
    }

    // Llamada al contexto Puntos para obtener el saldo actual
    const saldoActual = await this.puntosService.obtenerSaldoActual(id);

    const enriched = await this.canonicalHydrator.enrichOne({
      id: cliente.id.value,
      dni: cliente.dni.value,
      nombre: null,
      apellido: null,
      sexo: null,
      fechaNacimiento: null,
      status: cliente.status.value,
      categoria: cliente.categoria.codExt!,
      email: null,
      telefono: null,
      direccion: null,
      codPostal: null,
      localidad: null,
      provincia: null,
      idFidely: cliente.fidelyStatus.idFidely.value,
      tarjetaFidely: cliente.fidelyStatus.tarjetaFidely.value,
      fechaBaja: cliente.fidelyStatus.fechaBaja.value?.toISOString() ?? null,
    });

    return {
      ...enriched,
      categoria: cliente.categoria.nombre.value,
      fechaAlta: cliente.fidelyStatus.fechaAlta.value?.toISOString() ?? null,
      createdAt: cliente.timestamp.createdAt.toISOString(),
      updatedAt: cliente.timestamp.updatedAt.toISOString(),
      saldoActual,
    } as ClienteProfileDto;
  }
}
