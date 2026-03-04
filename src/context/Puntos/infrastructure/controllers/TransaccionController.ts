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
import { ClientPerms } from '@sistemas-fsa/authz/nest';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Transaccion')
@ApiBearerAuth()
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

  @ClientPerms('transaccion:read')
  @Get()
  @ApiOperation({ summary: 'Lista todas las transacciones' })
  @ApiResponse({
    status: 200,
    description: 'Listado de transacciones.',
    type: [TransaccionResponseDto],
  })
  async getAll(): Promise<TransaccionResponseDto[]> {
    const transacciones = await this.findAllTransacciones.run();
    return transacciones.map(TransaccionResponseDto.fromDomain);
  }

  @ClientPerms('transaccion:read')
  @Get(':id')
  @ApiOperation({ summary: 'Busca transacción por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Transacción encontrada o null.',
    type: TransaccionResponseDto,
  })
  async getById(
    @Param('id') id: string,
  ): Promise<TransaccionResponseDto | null> {
    const transaccion = await this.findTransaccionById.run(
      new TransaccionId(id),
    );
    return transaccion ? TransaccionResponseDto.fromDomain(transaccion) : null;
  }

  @ClientPerms('transaccion:read')
  @Get('/lote/:loteId')
  @ApiOperation({ summary: 'Lista transacciones por lote' })
  @ApiParam({ name: 'loteId', type: String })
  @ApiResponse({ status: 200, type: [TransaccionResponseDto] })
  async getByLote(
    @Param('loteId') loteId: string,
  ): Promise<TransaccionResponseDto[]> {
    const transacciones = await this.findByLote.run(new LoteId(loteId));
    return transacciones.map(TransaccionResponseDto.fromDomain);
  }

  @ClientPerms('transaccion:read')
  @Get('/cliente/:clienteId')
  @ApiOperation({ summary: 'Lista transacciones por cliente' })
  @ApiParam({ name: 'clienteId', type: String })
  @ApiResponse({ status: 200, type: [TransaccionResponseDto] })
  async getByCliente(
    @Param('clienteId') clienteId: string,
  ): Promise<TransaccionResponseDto[]> {
    const transacciones = await this.findByCliente.run(clienteId);
    return transacciones.map(TransaccionResponseDto.fromDomain);
  }

  @ClientPerms('transaccion:read')
  @Get('/operacion/:opId')
  @ApiOperation({ summary: 'Lista transacciones por operación' })
  @ApiParam({ name: 'opId', type: Number })
  @ApiResponse({ status: 200, type: [TransaccionResponseDto] })
  async getByOperacionId(
    @Param('opId') opId: number,
  ): Promise<TransaccionResponseDto[]> {
    const transacciones = await this.findByOperacionId.run(opId);
    return transacciones.map(TransaccionResponseDto.fromDomain);
  }

  @ClientPerms('transaccion:read')
  @Get('/referencia/:ref')
  @ApiOperation({ summary: 'Lista transacciones por referencia' })
  @ApiParam({ name: 'ref', type: String })
  @ApiResponse({ status: 200, type: [TransaccionResponseDto] })
  async getByReferencia(
    @Param('ref') ref: string,
  ): Promise<TransaccionResponseDto[]> {
    const transacciones = await this.findByReferencia.run(ref);
    return transacciones.map(TransaccionResponseDto.fromDomain);
  }
}
