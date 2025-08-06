import { Inject, Injectable } from '@nestjs/common';
import { Operacion } from '@puntos/core/entities/Operacion';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { RuleCotizacionFinder } from 'src/context/Metricas/core/reglas/interfaces/ReglaCotizacionFinder';
import {
  CREAR_METRICA_CLIENTE_SERVICE,
  RULE_COTIZACION_FINDER,
} from 'src/context/Metricas/core/reglas/tokens/tokens';
import { CrearClienteMetricaService } from '../services/CrearMetricaClienteService';

@Injectable()
export class CrearMetricaClienteuseCase {
  constructor(
    @Inject(RULE_COTIZACION_FINDER)
    private readonly ruleCotizacionFinder: RuleCotizacionFinder,
    @Inject(CREAR_METRICA_CLIENTE_SERVICE)
    private readonly metricaService: CrearClienteMetricaService,
  ) {}

  async run(op: Operacion, tx: Transaccion[]) {
    const cotizacion = await this.ruleCotizacionFinder.findCotizacion();

    return this.metricaService.run(op, tx, cotizacion);
  }
}
