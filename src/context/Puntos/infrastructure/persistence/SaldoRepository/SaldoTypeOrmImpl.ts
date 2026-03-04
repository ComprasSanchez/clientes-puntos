import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HistorialSaldo } from '@puntos/core/entities/SaldoHistorial';
import { SaldoRepository } from '@puntos/core/repository/SaldoRepository';
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import { SaldoClienteDto } from '@puntos/core/interfaces/SaldoResponseDTO';
import { HistorialSaldoCliente } from '@puntos/infrastructure/entities/historial-saldo.entity';
import { SaldoCliente } from '@puntos/infrastructure/entities/saldo.entity';
import { OpTipo } from '@shared/core/enums/OpTipo';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { TypeOrmBaseRepository } from '@shared/infrastructure/transaction/TypeOrmBaseRepository';
import { Repository } from 'typeorm';

@Injectable()
export class TypeOrmSaldoRepository
  extends TypeOrmBaseRepository
  implements SaldoRepository
{
  constructor(
    @InjectRepository(SaldoCliente)
    private readonly saldoRepo: Repository<SaldoCliente>,
    @InjectRepository(HistorialSaldoCliente)
    private readonly historialRepo: Repository<HistorialSaldoCliente>,
  ) {
    super();
  }

  async findAll(): Promise<SaldoClienteDto[]> {
    const saldos = await this.saldoRepo.find();
    const result: SaldoClienteDto[] = saldos.map((s) => ({
      clienteId: s.cliente_id,
      puntos: new CantidadPuntos(s.saldo_total),
    }));

    return result;
  }

  async findByClienteId(clienteId: string): Promise<CantidadPuntos | null> {
    const result = await this.saldoRepo.findOneBy({ cliente_id: clienteId });

    return result !== null ? new CantidadPuntos(result?.saldo_total) : null;
  }

  async save(saldo: SaldoCliente): Promise<void> {
    await this.saldoRepo.save(saldo);
  }

  async updateSaldo(
    clienteId: string,
    nuevoSaldo: number,
    ctx?: TransactionContext,
  ): Promise<void> {
    const manager = this.extractManager(ctx);

    if (manager) {
      await manager.upsert(
        SaldoCliente,
        {
          cliente_id: clienteId,
          saldo_total: nuevoSaldo,
        },
        ['cliente_id'],
      );
      return;
    }

    await this.saldoRepo.upsert(
      {
        cliente_id: clienteId,
        saldo_total: nuevoSaldo,
      },
      ['cliente_id'],
    );
  }

  async delete(clienteId: string): Promise<void> {
    await this.saldoRepo.delete({ cliente_id: clienteId });
    // Podrías registrar la eliminación en el historial si lo necesitás
  }

  async saveHistorial(
    historial: HistorialSaldo,
    ctx?: TransactionContext,
  ): Promise<void> {
    const payload = {
      id: historial.id,
      cliente_id: historial.clienteId,
      saldo_anterior: historial.saldoAnterior.value,
      saldo_nuevo: historial.saldoNuevo.value,
      motivo: historial.motivo,
      referencia_operacion: historial.referenciaOperacion?.value,
      fecha_cambio: historial.fechaCambio,
    };

    const manager = this.extractManager(ctx);
    if (manager) {
      await manager.insert(HistorialSaldoCliente, payload);
      return;
    }

    await this.historialRepo.insert(payload);
  }

  async findHistorialByClienteId(clienteId: string): Promise<HistorialSaldo[]> {
    const rows = await this.historialRepo.find({
      where: { cliente_id: clienteId },
      order: { fecha_cambio: 'DESC' },
    });
    // Mapea los resultados a tu entidad de dominio:
    return rows.map(
      (row) =>
        new HistorialSaldo(
          row.id,
          row.cliente_id,
          new CantidadPuntos(row.saldo_anterior),
          new CantidadPuntos(row.saldo_nuevo),
          row.motivo as OpTipo,
          row.referencia_operacion !== undefined
            ? OperacionId.instance(row.referencia_operacion)
            : undefined,
          row.fecha_cambio,
        ),
    );
  }
}
