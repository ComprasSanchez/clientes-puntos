// src/infrastructure/controllers/OperacionController.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
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

  // --- Operaciones POST ---
  @Post('compra')
  async compra(@Body() dto: OperacionDto): Promise<CreateOperacionResponse> {
    return this.compraUseCase.run(dto);
  }

  @Post('devolucion')
  async devolucion(
    @Body() dto: OperacionDto,
  ): Promise<CreateOperacionResponse> {
    return this.devolucionUseCase.run(dto);
  }

  @Post('anulacion')
  async anulacion(@Body() dto: OperacionDto): Promise<CreateOperacionResponse> {
    return this.anulacionUseCase.run(dto);
  }
}
