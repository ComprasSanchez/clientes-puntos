// src/infrastructure/controllers/TransaccionController.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TransaccionResponseDto } from '../dtos/TransaccionResponseDto';
import { TransaccionId } from '../../core/value-objects/TransaccionId';
import { LoteId } from '../../core/value-objects/LoteId';
import { FindAllTransaccionesUseCase } from '@puntos/application/use-cases/TransaccionFindAll/TransaccionFindAll';
import { FindTransaccionByIdUseCase } from '@puntos/application/use-cases/TransaccionFindById/TransaccionFindById';
import { FindTransaccionesByLoteUseCase } from '@puntos/application/use-cases/TransaccionFindByLote/TransaccionFindByLote';
import { FindTransaccionesByClienteUseCase } from '@puntos/application/use-cases/TransaccionFindByCliente/TransaccionFindByCliente';
import { FindTransaccionesByOperationIdUseCase } from '@puntos/application/use-cases/TransaccionFindByOperacionId/TransaccionFindByOperacionId';
import { FindTransaccionesByReferenciaUseCase } from '@puntos/application/use-cases/TransaccionFindByReferencia/TransaccionFindByReferencia';
import { ApiJwtGuard } from '@infrastructure/auth/api-jwt.guard';
import { Authz } from '@infrastructure/auth/authz-policy.decorator';

@UseGuards(ApiJwtGuard)
@Authz({
  allowedAzp: ['puntos-fsa', 'bff'],
  requireSucursalData: false, // no depende de sucursal
})
@Controller('transacciones')
export class TransaccionController {
  constructor(
    private readonly findAllTransacciones: FindAllTransaccionesUseCase,
    private readonly findTransaccionById: FindTransaccionByIdUseCase,
    private readonly findByLote: FindTransaccionesByLoteUseCase,
    private readonly findByCliente: FindTransaccionesByClienteUseCase,
    private readonly findByOperacionId: FindTransaccionesByOperationIdUseCase,
    private readonly findByReferencia: FindTransaccionesByReferenciaUseCase,
  ) {}

  @Get()
  async getAll(): Promise<TransaccionResponseDto[]> {
    const transacciones = await this.findAllTransacciones.run();
    return transacciones.map(TransaccionResponseDto.fromDomain);
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
  ): Promise<TransaccionResponseDto | null> {
    const transaccion = await this.findTransaccionById.run(
      new TransaccionId(id),
    );
    return transaccion ? TransaccionResponseDto.fromDomain(transaccion) : null;
  }

  @Get('/lote/:loteId')
  async getByLote(
    @Param('loteId') loteId: string,
  ): Promise<TransaccionResponseDto[]> {
    const transacciones = await this.findByLote.run(new LoteId(loteId));
    return transacciones.map(TransaccionResponseDto.fromDomain);
  }

  @Get('/cliente/:clienteId')
  async getByCliente(
    @Param('clienteId') clienteId: string,
  ): Promise<TransaccionResponseDto[]> {
    const transacciones = await this.findByCliente.run(clienteId);
    return transacciones.map(TransaccionResponseDto.fromDomain);
  }

  @Get('/operacion/:opId')
  async getByOperacionId(
    @Param('opId') opId: number,
  ): Promise<TransaccionResponseDto[]> {
    const transacciones = await this.findByOperacionId.run(opId);
    return transacciones.map(TransaccionResponseDto.fromDomain);
  }

  @Get('/referencia/:ref')
  async getByReferencia(
    @Param('ref') ref: string,
  ): Promise<TransaccionResponseDto[]> {
    const transacciones = await this.findByReferencia.run(ref);
    return transacciones.map(TransaccionResponseDto.fromDomain);
  }
}
