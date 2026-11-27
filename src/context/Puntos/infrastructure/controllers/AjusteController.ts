import { ApiJwtGuard } from '@infrastructure/auth/api-jwt.guard';
import { Authz } from '@infrastructure/auth/authz-policy.decorator';
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AjusteDto } from '@puntos/application/dtos/AjusteDto';
import { CreateOperacionResponse } from '@puntos/application/dtos/CreateOperacionResponse';
import { AjusteUseCase } from '@puntos/application/use-cases/Ajuste/Ajuste';
import { AcreditarExternoDto } from '@puntos/application/dtos/AcreditarExternoDto';
import {
  AcreditarExternoUseCase,
  type AcreditarExternoResult,
} from '@puntos/application/use-cases/Ajuste/AcreditarExterno';
import { QueryFailedError } from 'typeorm';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { UserId } from '@shared/infrastructure/decorators/user-id.decorator';
import { TransactionalRunner } from '@shared/infrastructure/transaction/TransactionalRunner';
import { ClientPerms } from '@sistemas-fsa/authz/nest';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Ajuste')
@ApiBearerAuth()
@UseGuards(ApiJwtGuard)
@Authz({
  allowedAzp: ['puntos-fsa', 'bff', 'crm-fsa-back'],
  requireSucursalData: true, // <- obligatorio sucursalId / codigoExt en el token
})
@Controller('ajuste')
export class AjusteController {
  constructor(
    private readonly ajusteUseCase: AjusteUseCase,
    private readonly acreditarExternoUseCase: AcreditarExternoUseCase,
    private readonly transactionalRunner: TransactionalRunner,
  ) {}

  @Post('acreditar-externo')
  @HttpCode(200)
  // Para otros sistemas (sin sucursal en la credencial). Ej.: eventos-back.
  @Authz({ allowedAzp: ['eventos-back'], requireSucursalData: false })
  @ApiOperation({
    summary:
      'Acreditación pedida por otro sistema; con la misma claveExterna acredita una sola vez',
  })
  @ClientPerms('ajuste:write')
  async acreditarExterno(
    @Body() dto: AcreditarExternoDto,
    @UserId() userId: string,
  ): Promise<AcreditarExternoResult> {
    try {
      return await this.transactionalRunner.runInTransaction((ctx) =>
        this.acreditarExternoUseCase.run(userId, dto, ctx),
      );
    } catch (error: unknown) {
      // Dos pedidos iguales al mismo tiempo: el índice único frena al segundo.
      const code = (error as { driverError?: { code?: string } })?.driverError
        ?.code;
      if (error instanceof QueryFailedError && code === '23505') {
        return this.transactionalRunner.runInTransaction((ctx) =>
          this.acreditarExternoUseCase.run(userId, dto, ctx),
        );
      }
      throw error;
    }
  }

  @Post('acreditar')
  @ApiOperation({ summary: 'Registra ajuste de acreditación' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        clienteId: { type: 'string' },
        puntos: { type: 'number' },
        motivo: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Ajuste registrado.' })
  @ClientPerms('ajuste:write')
  async registrarAjusteAcreditacion(
    @Body() dto: AjusteDto,
    @UserId() userId: string,
  ): Promise<CreateOperacionResponse> {
    const tipo = TxTipo.ACREDITACION;
    return this.transactionalRunner.runInTransaction((ctx) =>
      this.ajusteUseCase.run(tipo, userId, dto, ctx),
    );
  }

  @Post('gastar')
  @ApiOperation({ summary: 'Registra ajuste de gasto' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        clienteId: { type: 'string' },
        puntos: { type: 'number' },
        motivo: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Ajuste registrado.' })
  @ClientPerms('ajuste:write')
  async registrarAjusteGasto(
    @Body() dto: AjusteDto,
    @UserId() userId: string,
  ): Promise<CreateOperacionResponse> {
    const tipo = TxTipo.GASTO;
    return this.transactionalRunner.runInTransaction((ctx) =>
      this.ajusteUseCase.run(tipo, userId, dto, ctx),
    );
  }
}
