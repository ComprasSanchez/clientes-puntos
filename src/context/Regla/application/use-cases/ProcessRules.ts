import { OpTipo } from 'src/shared/core/enums/OpTipo';
import { ReglaEngineRequest } from '../../core/interfaces/IReglaEngine';
import { CantidadPuntos } from '../../core/value-objects/CantidadPuntos';
import { FechaOperacion } from '../../core/value-objects/FechaOperacion';
import { Moneda } from '../../core/value-objects/Moneda';
import { MontoMoneda } from '../../core/value-objects/MontoMoneda';
import { ExecuteRulesRequestDto } from '../dtos/RunRuleRequest.dto';
import { ExecuteRulesResponseDto } from '../dtos/RunRuleResponse.dto';
import { RulesOrchestrationService } from '../services/RuleOrchestationService';

/**
 * Caso de uso: mapea DTO, llama al servicio de orquestación y mapea resultado.
 */
export class ExecuteRulesUseCase {
  constructor(private readonly orchestration: RulesOrchestrationService) {}

  public async execute(
    dto: ExecuteRulesRequestDto,
  ): Promise<ExecuteRulesResponseDto> {
    // Mapear DTO → contexto dominio
    const context: ReglaEngineRequest = {
      clienteId: dto.clienteId,
      tipo: dto.tipo as OpTipo,
      fecha: new FechaOperacion(dto.fecha),
      puntosSolicitados: dto.puntosSolicitados
        ? new CantidadPuntos(dto.puntosSolicitados)
        : undefined,
      monto: dto.monto ? new MontoMoneda(dto.monto) : undefined,
      moneda: dto.moneda ? Moneda.create(dto.moneda) : undefined,
      saldoActual: new CantidadPuntos(dto.saldoActual),
    };

    // Llamar lógica de aplicación
    const result = await this.orchestration.execute(context);

    // Mapear resultado → DTO salida
    const response: ExecuteRulesResponseDto = {
      debitAmount: result.debitAmount,
      credito: result.credito
        ? {
            cantidad: result.credito.cantidad,
            expiraEn: result.credito.expiraEn,
          }
        : undefined,
    };
    return response;
  }
}
