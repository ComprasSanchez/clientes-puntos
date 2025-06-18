import { ClienteNotFoundError } from 'src/context/Cliente/core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from 'src/context/Cliente/core/repository/ClienteRepository';
import { ClienteId } from 'src/context/Cliente/core/value-objects/ClienteId';
import { PuntosOperacion } from 'src/context/Cliente/core/value-objects/PuntosOperacion';

export class SaldoAjustar {
  constructor(private readonly clienteRepo: ClienteRepository) {}

  async run(
    clienteId: string,
    puntos: number,
    tipo: 'COMPRA' | 'CANJE',
  ): Promise<void> {
    const cliente = await this.clienteRepo.findById(new ClienteId(clienteId));
    if (!cliente) throw new ClienteNotFoundError(clienteId);

    const ptsVo = new PuntosOperacion(puntos);
    if (tipo === 'COMPRA') {
      cliente.saldo.acumular(ptsVo);
    } else {
      cliente.saldo.gastar(ptsVo);
    }

    // Persiste el agregado completo (incluido Saldo interno)
    await this.clienteRepo.update(cliente);
  }
}
