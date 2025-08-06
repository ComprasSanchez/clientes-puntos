import { Inject, Injectable } from '@nestjs/common';
import { Operacion } from '@puntos/core/entities/Operacion';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { ConversionRule } from '@regla/core/entities/ConversionRule';
import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';
import { ClienteMetrica } from 'src/context/Metricas/core/clientes/entities/ClienteMetrica';
import { ClienteMetricaRepository } from 'src/context/Metricas/core/clientes/repositories/ClienteMetrica.repository';
import { ClienteMetricsCalculator } from 'src/context/Metricas/core/clientes/services/ClienteMetricsClaculator';
import { METRICAS_REPO } from 'src/context/Metricas/core/clientes/tokens/tokens';
import { CLIENTE_CALCULATOR } from 'src/context/Metricas/core/reglas/tokens/tokens';

@Injectable()
export class CrearClienteMetricaService {
  constructor(
    @Inject(CLIENTE_CALCULATOR)
    private readonly calculator: typeof ClienteMetricsCalculator,
    @Inject(METRICAS_REPO)
    private readonly metricaRepo: ClienteMetricaRepository,
    @Inject(UUIDGenerator)
    private readonly idGen: UUIDGenerator,
  ) {}

  async run(
    operacion: Operacion,
    transacciones: Transaccion[],
    cotizacion: ConversionRule,
  ) {
    const resultado = this.calculator.calcularDesdeOperacion(
      operacion,
      transacciones,
      cotizacion,
    );

    const metrica: ClienteMetrica = {
      id: this.idGen.generate(),
      clienteId: operacion.clienteId,
      fecha: operacion.fecha.value,
      referenciaTransaccion: operacion.id.value,
      tipoOperacion: operacion.tipo,
      pesosAhorro: resultado.pesosAhorrados,
      puntosAdquiridos: resultado.puntosAdquiridos,
    };

    await this.metricaRepo.save(metrica);

    return resultado;
  }
}
