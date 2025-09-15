// src/infrastructure/controllers/OperacionController.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { OperacionResponseDto } from '../dtos/OperacionResponseDto';
import { OperacionId } from '../../core/value-objects/OperacionId';
import { FindAllOperacionesUseCase } from '@puntos/application/use-cases/OperacionFindAll/OperacionFindAll';
import { FindOperacionByIdUseCase } from '@puntos/application/use-cases/OperacionFindById/OperacionFindById';
import { FindOperacionesByClienteUseCase } from '@puntos/application/use-cases/OperacionFindbyCliente/OperacionFindByCliente';
import { FindOperacionesByReferenciaUseCase } from '@puntos/application/use-cases/OperacionFindByReferencia/OperacionFindByReferencia';
import { CompraUseCase } from '@puntos/application/use-cases/Compra/Compra';
import { DevolucionUseCase } from '@puntos/application/use-cases/Devolucion/Devolucion';
import { AnulacionUseCase } from '@puntos/application/use-cases/Anulacion/Anulacion';
import { OperacionDto } from '@puntos/application/dtos/OperacionDto';
import { CreateOperacionResponse } from '@puntos/application/dtos/CreateOperacionResponse';
import { TransactionalRunner } from '@shared/infrastructure/transaction/TransactionalRunner';
import { ApiJwtGuard } from '@infrastructure/auth/api-jwt.guard';
import { Authz } from '@infrastructure/auth/authz-policy.decorator';

@UseGuards(ApiJwtGuard)
@Authz({
  allowedAzp: ['puntos-fsa'],
  requiredClientRoles: { 'puntos-fsa': ['consultant', 'administrator'] },
  requireSucursalData: false, // GETs no requieren sucursal
})
@Controller('operacion')
export class OperacionController {
  constructor(
    private readonly findAllOperaciones: FindAllOperacionesUseCase,
    private readonly findOperacionById: FindOperacionByIdUseCase,
    private readonly findByCliente: FindOperacionesByClienteUseCase,
    private readonly findByReferencia: FindOperacionesByReferenciaUseCase,
    private readonly compraUseCase: CompraUseCase,
    private readonly devolucionUseCase: DevolucionUseCase,
    private readonly anulacionUseCase: AnulacionUseCase,
    private readonly transactionalRunner: TransactionalRunner,
  ) {}

  @Get()
  async getAll(): Promise<OperacionResponseDto[]> {
    const operaciones = await this.findAllOperaciones.run();
    return operaciones.map(OperacionResponseDto.fromDomain);
  }

  @Get(':id')
  async getById(@Param('id') id: number): Promise<OperacionResponseDto | null> {
    const operacion = await this.findOperacionById.run(
      OperacionId.instance(id),
    );
    return operacion ? OperacionResponseDto.fromDomain(operacion) : null;
  }

  @Get('/cliente/:clienteId')
  async getByCliente(
    @Param('clienteId') clienteId: string,
  ): Promise<OperacionResponseDto[]> {
    const operaciones = await this.findByCliente.run(clienteId);
    return operaciones.map(OperacionResponseDto.fromDomain);
  }

  @Get('/referencia/:referenciaId')
  async getByReferencia(
    @Param('referenciaId') referenciaId: string,
  ): Promise<OperacionResponseDto[]> {
    const operaciones = await this.findByReferencia.run(referenciaId);
    return operaciones.map(OperacionResponseDto.fromDomain);
  }

  // --- POSTs: sólo administrator y requieren sucursal ---
  @Authz({
    allowedAzp: ['puntos-fsa'],
    requiredClientRoles: { 'puntos-fsa': ['administrator'] },
    requireSucursalData: true,
  })
  @Post('compra')
  async compra(@Body() dto: OperacionDto): Promise<CreateOperacionResponse> {
    return this.transactionalRunner.runInTransaction((ctx) =>
      this.compraUseCase.run(dto, ctx),
    );
  }

  @Authz({
    allowedAzp: ['puntos-fsa'],
    requiredClientRoles: { 'puntos-fsa': ['administrator'] },
    requireSucursalData: true,
  })
  @Post('devolucion')
  async devolucion(
    @Body() dto: OperacionDto,
  ): Promise<CreateOperacionResponse> {
    return this.transactionalRunner.runInTransaction((ctx) =>
      this.devolucionUseCase.run(dto, ctx),
    );
  }

  @Authz({
    allowedAzp: ['puntos-fsa'],
    requiredClientRoles: { 'puntos-fsa': ['administrator'] },
    requireSucursalData: true,
  })
  @Post('anulacion')
  async anulacion(@Body() dto: OperacionDto): Promise<CreateOperacionResponse> {
    return this.transactionalRunner.runInTransaction((ctx) =>
      this.anulacionUseCase.run(dto, ctx),
    );
  }
}
