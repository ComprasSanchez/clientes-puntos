// @regla/application/use-cases/ExecuteRulesUseCase.ts
import { OpTipo } from '@shared/core/enums/OpTipo';
import { ReglaEngineRequest } from '../../../core/interfaces/IReglaEngine';
import { CantidadPuntos } from '../../../core/value-objects/CantidadPuntos';
import { FechaOperacion } from '../../../core/value-objects/FechaOperacion';
import { Moneda } from '../../../core/value-objects/Moneda';
import { MontoMoneda } from '../../../core/value-objects/MontoMoneda';
import { ExecuteRulesRequestDto } from '../../dtos/RunRuleRequest.dto';
import { ExecuteRulesResponseDto } from '../../dtos/RunRuleResponse.dto';
import { RulesOrchestrationService } from '../../services/RuleOrchestationService';
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { RULE_ORCHESTATION_SERVICE } from '@regla/core/tokens/tokens';

function safeNumber(n: unknown, fallback = 0): number {
  const num = typeof n === 'number' ? n : Number(n);
  return Number.isFinite(num) ? num : fallback;
}

function parseOpTipo(value: string): OpTipo {
  // Ajustá según tus valores reales de OpTipo
  const v = String(value).toUpperCase();
  if (v in OpTipo) return OpTipo[v as keyof typeof OpTipo] as OpTipo;
  // Si tus enums son numéricos o distintos, adaptá esta lógica.
  throw new BadRequestException(`Tipo de operación inválido: ${value}`);
}

@Injectable()
export class ExecuteRulesUseCase {
  constructor(
    @Inject(RULE_ORCHESTATION_SERVICE)
    private readonly orchestration: RulesOrchestrationService,
  ) {}

  public async execute(
    dto: ExecuteRulesRequestDto,
  ): Promise<ExecuteRulesResponseDto> {
    // fecha segura (Date | string ISO)
    const fechaJs = dto.fecha instanceof Date ? dto.fecha : new Date(dto.fecha);

    // tipo seguro
    const tipo = parseOpTipo(dto.tipo);

    // moneda (si viene), normalizada opcionalmente
    const moneda = dto.moneda
      ? Moneda.create(dto.moneda.toUpperCase())
      : undefined;

    // map carrito (opcional)
    const productosMapped = dto.productos?.map((i) => ({
      productoId: i.productoId,
      codExt: i.codExt,
      nombre: i.nombre,
      cantidad: Math.max(1, safeNumber(i.cantidad, 1)),
      precio: {
        amount: safeNumber(i.precio?.amount, 0),
        currency: i.precio?.currency?.toUpperCase(),
      },
      costo: {
        amount: safeNumber(i.costo?.amount, 0),
        currency: i.costo?.currency?.toUpperCase(),
      },
      usarBase: i.usarBase, // 'precio' | 'costo'
      clasificadores: i.clasificadores,
      tags: i.tags,
    }));

    const context: ReglaEngineRequest = {
      clienteId: dto.clienteId,
      tipo,
      fecha: new FechaOperacion(fechaJs),
      puntosSolicitados:
        dto.puntosSolicitados != null
          ? new CantidadPuntos(safeNumber(dto.puntosSolicitados, 0))
          : undefined,
      monto:
        dto.monto != null
          ? new MontoMoneda(safeNumber(dto.monto, 0))
          : undefined,
      moneda,
      saldoActual: new CantidadPuntos(safeNumber(dto.saldoActual, 0)),
      productos:
        productosMapped && productosMapped.length > 0
          ? productosMapped
          : undefined,
    };

    const result = await this.orchestration.execute(context);

    const response: ExecuteRulesResponseDto = {
      debitAmount: result.debitAmount,
      credito: result.credito
        ? {
            cantidad: result.credito.cantidad,
            expiraEn: result.credito.expiraEn,
          }
        : undefined,
      reglasAplicadas: result.reglasAplicadas || {},
    };
    return response;
  }
}
