// @regla/infrastructure/ReglaEngineAdapter.ts
import { Injectable, Inject } from '@nestjs/common';
import { EXECUTE_RULES_USE_CASE } from '../../core/tokens/tokens';

import { RuleEngineContract } from '../../application/dtos/RuleEngineContract';
import { ExecuteRulesRequestDto } from '../../application/dtos/RunRuleRequest.dto';
import { ExecuteRulesResponseDto } from '../../application/dtos/RunRuleResponse.dto';
import { ExecuteRulesUseCase } from '@regla/application/use-cases/ReglaProcessRules/ProcessRules';

@Injectable()
export class ReglaEngineAdapter implements RuleEngineContract {
  constructor(
    @Inject(EXECUTE_RULES_USE_CASE)
    private readonly useCase: ExecuteRulesUseCase,
  ) {}

  async procesar(
    req: ExecuteRulesRequestDto,
  ): Promise<ExecuteRulesResponseDto> {
    // ⚙️ Mapear dominio → DTO de input (con soporte de carrito)
    const inputDto: ExecuteRulesRequestDto = {
      clienteId: req.clienteId,
      tipo: req.tipo,
      fecha: req.fecha,
      puntosSolicitados: req.puntosSolicitados,
      monto: req.monto,
      moneda: req.moneda,
      saldoActual: req.saldoActual,

      // 🔹 productos es opcional; si viene, normalizamos
      productos: req.productos?.map((i) => ({
        productoId: i.productoId,
        codExt: i.codExt,
        nombre: i.nombre,
        cantidad: Math.max(1, i.cantidad ?? 1),
        precio: {
          amount: Number(i.precio?.amount ?? 0),
          currency: i.precio?.currency,
        },
        costo: {
          amount: Number(i.costo?.amount ?? 0),
          currency: i.costo?.currency,
        },
        usarBase: i.usarBase, // 'precio' | 'costo'
        clasificadores: i.clasificadores?.map((c) => ({
          type: c.type,
          id: c.id,
        })),
        tags: i.tags,
      })),
    };

    const respDto = await this.useCase.execute(inputDto);

    // 🔁 DTO salida → contrato
    return {
      debitAmount: respDto.debitAmount,
      credito: respDto.credito
        ? {
            cantidad: respDto.credito.cantidad,
            expiraEn: respDto.credito.expiraEn
              ? new Date(respDto.credito.expiraEn)
              : undefined,
          }
        : undefined,
      // aseguramos objeto y no array
      reglasAplicadas: respDto.reglasAplicadas ?? {},
    };
  }
}
