// @regla/infrastructure/ReglaEngineAdapter.ts
import { Injectable, Inject } from '@nestjs/common';
import { EXECUTE_RULES_USE_CASE } from '../tokens/tokens';
import { ExecuteRulesUseCase } from '../../application/use-cases/ProcessRules';
import { RuleEngineContract } from '../../application/dtos/RuleEngineContract';
import { ExecuteRulesRequestDto } from '../../application/dtos/RunRuleRequest.dto';
import { ExecuteRulesResponseDto } from '../../application/dtos/RunRuleResponse.dto';

@Injectable()
export class ReglaEngineAdapter implements RuleEngineContract {
  constructor(
    @Inject(EXECUTE_RULES_USE_CASE)
    private readonly useCase: ExecuteRulesUseCase,
  ) {}

  async procesar(
    req: ExecuteRulesRequestDto,
  ): Promise<ExecuteRulesResponseDto> {
    // Mapear domain → DTO de input
    const inputDto = {
      clienteId: req.clienteId,
      tipo: req.tipo,
      fecha: req.fecha,
      puntosSolicitados: req.puntosSolicitados,
      monto: req.monto,
      moneda: req.moneda,
      saldoActual: req.saldoActual,
    };
    const respDto = await this.useCase.execute(inputDto);
    // Mapear DTO de salida → dominio
    return {
      debitAmount: respDto.debitAmount,
      credito: respDto.credito && {
        cantidad: respDto.credito.cantidad,
        expiraEn: respDto.credito.expiraEn
          ? new Date(respDto.credito.expiraEn)
          : undefined,
      },
    };
  }
}
