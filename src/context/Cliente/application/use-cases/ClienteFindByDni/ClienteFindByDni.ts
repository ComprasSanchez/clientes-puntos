// @cliente/application/use-cases/ClienteFindByDni.ts

import { ClienteResponseDto } from '@cliente/application/dtos/ClienteResponseDto';
import { ClienteNotFoundError } from '@cliente/core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteDni } from '@cliente/core/value-objects/ClienteDni';
import { Inject, Injectable } from '@nestjs/common';
import { ClienteCanonicalHydrator } from '@cliente/application/services/ClienteCanonicalHydrator';

@Injectable()
export class ClienteFindByDni {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
    private readonly canonicalHydrator: ClienteCanonicalHydrator,
  ) {}

/**
    * Busca un Cliente por su DNI.
    * Soporta búsqueda con candidatos (handlea padding como 0040772342 vs 40772342).
    * Lanza ClienteNotFoundError si no existe.
    */
  async run(dni: string): Promise<ClienteResponseDto> {
    // Generar candidatos: input tal cual, sin leading zeros, padded a 10 dígitos
    const candidates = this.resolveDniCandidates(dni);

    // Intentar búsqueda exacta primero
    const dniVo = new ClienteDni(dni);
    let cliente = await this.repository.findByDni(dniVo);

    // Si no found, usar método de candidatos
    if (!cliente && candidates.length > 0) {
      cliente = await this.repository.findByDNICandidates(candidates);
    }

    if (!cliente) {
      throw new ClienteNotFoundError(dni);
    }

    return this.mapToDto(cliente);
  }

  /**
   * Genera candidatos de DNI para handlear variaciones de padding.
   * Ej: 40772342 -> [40772342, 0040772342]
   */
  private resolveDniCandidates(input: string): string[] {
    const onlyDigits = String(input ?? '').replace(/\D/g, '');
    if (!onlyDigits) return [];

    const candidates = new Set<string>();

    // Tal cual sin ceros
    if (this.isValidDniLength(onlyDigits)) {
      candidates.add(onlyDigits);
    }

    // Sin leading zeros
    const withoutLeadingZeros = onlyDigits.replace(/^0+/, '');
    if (this.isValidDniLength(withoutLeadingZeros)) {
      candidates.add(withoutLeadingZeros);

      // Con padding a 10 dígitos (algunos DNIs en DB están así)
      const paddedTo10 = withoutLeadingZeros.padStart(10, '0');
      if (this.isValidDniLength(paddedTo10)) {
        candidates.add(paddedTo10);
      }
    }

    return Array.from(candidates);
  }

  private isValidDniLength(dni: string): boolean {
    return dni.length >= 6 && dni.length <= 10;
  }

private async mapToDto(cliente: import('@cliente/core/entities/Cliente').Cliente): Promise<ClienteResponseDto> {
    const mapped: ClienteResponseDto = {
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
    };

    return this.canonicalHydrator.enrichOne(mapped);
  }
}
