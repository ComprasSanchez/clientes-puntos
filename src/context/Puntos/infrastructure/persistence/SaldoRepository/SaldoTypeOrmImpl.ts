import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HistorialSaldo } from '@puntos/core/entities/SaldoHistorial';
import { SaldoRepository } from '@puntos/core/repository/SaldoRepository';
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import { HistorialSaldoCliente } from '@puntos/infrastructure/entities/historial-saldo.entity';
import { SaldoCliente } from '@puntos/infrastructure/entities/saldo.entity';
import { OpTipo } from '@shared/core/enums/OpTipo';
import { Repository } from 'typeorm';

@Injectable()
export class TypeOrmSaldoRepository implements SaldoRepository {
  constructor(
    @InjectRepository(SaldoCliente)
    private readonly saldoRepo: Repository<SaldoCliente>,
    @InjectRepository(HistorialSaldoCliente)
    private readonly historialRepo: Repository<HistorialSaldoCliente>,
  ) {}

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
    motivo?: string,
    referenciaOperacion?: number,
  ): Promise<void> {
    // Busca el saldo anterior
    const saldoActual = await this.saldoRepo.findOneBy({
      cliente_id: clienteId,
    });
    const saldoAnterior = saldoActual?.saldo_total ?? 0;

    // Actualiza o crea saldo
    if (saldoActual) {
      saldoActual.saldo_total = nuevoSaldo;
      await this.saldoRepo.save(saldoActual);
    } else {
      await this.saldoRepo.insert({
        cliente_id: clienteId,
        saldo_total: nuevoSaldo,
      });
    }

    // Registra en historial (referencia_operacion ahora es bigint)
    await this.historialRepo.insert({
      cliente_id: clienteId,
      saldo_anterior: saldoAnterior,
      saldo_nuevo: nuevoSaldo,
      motivo: motivo ?? undefined,
      referencia_operacion: referenciaOperacion ?? undefined,
    });
  }

  async delete(clienteId: string): Promise<void> {
    await this.saldoRepo.delete({ cliente_id: clienteId });
    // Podrías registrar la eliminación en el historial si lo necesitás
  }

  async saveHistorial(historial: HistorialSaldo): Promise<void> {
    await this.historialRepo.insert({
      id: historial.id, // o deja que TypeORM genere el UUID si null
      cliente_id: historial.clienteId,
      saldo_anterior: historial.saldoAnterior.value,
      saldo_nuevo: historial.saldoNuevo.value,
      motivo: historial.motivo,
      referencia_operacion: historial.referenciaOperacion?.value,
      fecha_cambio: historial.fechaCambio,
    });
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
