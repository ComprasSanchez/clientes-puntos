import { ReglaEngineRequest } from '../../core/interfaces/IReglaEngine';
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
      tipo: dto.tipo,
      fecha: new Date(dto.fecha),
      puntosSolicitados: dto.puntosSolicitados,
      monto: dto.monto,
      moneda: dto.moneda,
      saldoActual: dto.saldoActual,
    };

    // Llamar lógica de aplicación
    const result = await this.orchestration.execute(context);

    // Mapear resultado → DTO salida
    const response: ExecuteRulesResponseDto = {
      debitAmount: result.debitAmount,
      credito: result.credito
        ? {
            cantidad: result.credito.cantidad,
            expiraEn: result.credito.expiraEn!.toISOString(),
          }
        : undefined,
    };
    return response;
  }
}
