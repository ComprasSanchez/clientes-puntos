import { CategoriaId } from '@cliente/core/value-objects/CategoriaId';
import { ClienteNotFoundError } from '@cliente/core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { ClienteDni } from '@cliente/core/value-objects/ClienteDni';
import { ClienteFechaBaja } from '@cliente/core/value-objects/ClienteFechaBaja';
import { ClienteId } from '@cliente/core/value-objects/ClienteId';
import { ClienteStatus } from '@cliente/core/value-objects/ClienteStatus';
import { ClienteTarjetaFidely } from '@cliente/core/value-objects/ClienteTarjetaFidely';
import { CategoriaRepository } from '@cliente/core/repository/CategoriaRepository';
import { CategoriaNotFoundError } from '@cliente/core/exceptions/CategoriaNotFoundError';
import { Inject, Injectable } from '@nestjs/common';
import { CATEGORIA_REPO, CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { uniqueCardGenerator } from '@cliente/application/services/CardGenerator';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { Cliente } from '@cliente/core/entities/Cliente';
import { ClienteIdFidely } from '@cliente/core/value-objects/ClienteIdFidely';

interface ClienteUpdateInput {
  id?: string;
  dni?: string;
  status?: string;
  categoriaId?: string;
  idFidely: number;
  tarjetaFidely?: string;
  fechaBaja?: string | null;
}

@Injectable()
export class ClienteUpdate {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
    @Inject(CATEGORIA_REPO)
    private readonly categoriaRepo: CategoriaRepository,
    @Inject(uniqueCardGenerator)
    private readonly cardGen: uniqueCardGenerator,
  ) {}

  async run(
    input: ClienteUpdateInput,
    ctx?: TransactionContext,
  ): Promise<Cliente> {
    // 1) Recupero el Cliente existente
    let cliente: Cliente | null;
    if (input.id) {
      cliente = await this.repository.findById(new ClienteId(input.id));
      if (!cliente || cliente === null)
        throw new ClienteNotFoundError(input.id);
    } else {
      cliente = await this.repository.findByIdFidely(
        new ClienteIdFidely(input.idFidely),
      );
      if (!cliente || cliente === null)
        throw new ClienteNotFoundError(input.dni!);
    }

    // 2) Aplico sólo los campos que vienen
    if (input.dni !== undefined) cliente.editarDni(new ClienteDni(input.dni));
    if (input.status !== undefined)
      cliente.editarStatus(new ClienteStatus(input.status));

    if (input.categoriaId !== undefined) {
      const catIdVo = new CategoriaId(input.categoriaId);
      const categoria = await this.categoriaRepo.findById(catIdVo);
      if (!categoria) {
        throw new CategoriaNotFoundError(input.categoriaId);
      }

      cliente.cambiarCategoria(categoria);
    }
    if (input.tarjetaFidely !== undefined) {
      const newCard =
        input.tarjetaFidely.trim() || (await this.cardGen.generate());
      cliente.editarTarjetaFidely(new ClienteTarjetaFidely(newCard));
    }
    if (input.fechaBaja !== undefined && input.fechaBaja !== null)
      cliente.editarFechaBaja(new ClienteFechaBaja(new Date(input.fechaBaja)));

    cliente.touch();

    // 3) Persisto
    await this.repository.update(cliente, ctx);
    const result = await this.repository.findById(cliente.id);
    if (!result) {
      throw new Error('Cliente no encontrado después de crear');
    }
    return result;
  }
}
