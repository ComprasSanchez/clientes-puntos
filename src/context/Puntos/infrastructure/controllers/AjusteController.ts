import { ApiJwtGuard } from '@infrastructure/auth/api-jwt.guard';
import { Authz } from '@infrastructure/auth/authz-policy.decorator';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AjusteDto } from '@puntos/application/dtos/AjusteDto';
import { CreateOperacionResponse } from '@puntos/application/dtos/CreateOperacionResponse';
import { AjusteUseCase } from '@puntos/application/use-cases/Ajuste/Ajuste';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { UserId } from '@shared/infrastructure/decorators/user-id.decorator';
import { TransactionalRunner } from '@shared/infrastructure/transaction/TransactionalRunner';

@UseGuards(ApiJwtGuard)
@Authz({
  allowedAzp: ['puntos-fsa', 'bff'],
  requireSucursalData: true, // <- obligatorio sucursalId / codigoExt en el token
})
@Controller('ajuste')
export class AjusteController {
  constructor(
    private readonly ajusteUseCase: AjusteUseCase,
    private readonly transactionalRunner: TransactionalRunner,
  ) {}

  @Post('acreditar')
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
