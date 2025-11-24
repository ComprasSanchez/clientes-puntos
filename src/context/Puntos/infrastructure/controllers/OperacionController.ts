// src/infrastructure/controllers/OperacionController.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
  Inject,
} from '@nestjs/common';
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
import { Authz } from '@infrastructure/auth/authz-policy.decorator';
import { PaginatedOperacionResponseDto } from '../dtos/PaginatedOperacionResponseDto';
import { OperacionValorService } from '@puntos/application/services/OperacionValorService';
import { PaginationQueryDto } from '@shared/infrastructure/dtos/pagination-query.dto';
import { OperacionDetalleResponseDto } from '../dtos/OperacionDetalleResponseDto';
import { FindOperacionDetalleByIdUseCase } from '@puntos/application/use-cases/OperacionDetalleView/OperacionDetalleView';
import { OPERACION_VALOR_SERVICE } from '@puntos/core/tokens/tokens';
import { ClientPerms } from '@sistemas-fsa/authz/nest';

// @UseGuards(ApiJwtGuard)
// @Authz({
//   allowedAzp: ['puntos-fsa', 'bff'],
//   requireSucursalData: false, // GETs no requieren sucursal
// })
@Controller('operacion')
export class OperacionController {
  constructor(
    @Inject(OPERACION_VALOR_SERVICE)
    private readonly operacionValorService: OperacionValorService,
    private readonly findAllOperaciones: FindAllOperacionesUseCase,
    private readonly findOperacionById: FindOperacionByIdUseCase,
    private readonly findByCliente: FindOperacionesByClienteUseCase,
    private readonly findByReferencia: FindOperacionesByReferenciaUseCase,
    private readonly findOperacionDetalleById: FindOperacionDetalleByIdUseCase,
    private readonly compraUseCase: CompraUseCase,
    private readonly devolucionUseCase: DevolucionUseCase,
    private readonly anulacionUseCase: AnulacionUseCase,
    private readonly transactionalRunner: TransactionalRunner,
  ) {}

  @Get()
  @ClientPerms('operacion:read')
  async getAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedOperacionResponseDto> {
    // 1) Operaciones paginadas
    const pageResult = await this.findAllOperaciones.run(query.toParams());

    // 2) Calcular valor (crédito/debito/delta) en batch
    const valorMap = await this.operacionValorService.calcularParaOperaciones(
      pageResult.items,
    );

    // 3) Mapear a DTO + inyectar los campos resumidos
    const items = pageResult.items.map((op) => {
      const dto = OperacionResponseDto.fromDomain(op);
      const valor = valorMap.get(op.id.value);

      if (valor) {
        dto.puntosCredito = valor.puntosCredito;
        dto.puntosDebito = valor.puntosDebito;
        dto.puntosDelta = valor.puntosDelta;
      }

      return dto;
    });

    return {
      items,
      total: pageResult.total,
      page: pageResult.page,
      limit: pageResult.limit,
      hasNext: pageResult.page * pageResult.limit < pageResult.total,
    };
  }

  @ClientPerms('operacion:read')
  @Get(':id/detalle')
  async getDetalle(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<OperacionDetalleResponseDto> {
    const opId = OperacionId.instance(id);
    const detalle = await this.findOperacionDetalleById.run(opId);

    if (!detalle) {
      throw new NotFoundException(`Operación ${id} no encontrada`);
    }

    return OperacionDetalleResponseDto.fromView(detalle);
  }

  @ClientPerms('operacion:read')
  @Get(':id')
  async getById(@Param('id') id: number): Promise<OperacionResponseDto | null> {
    const operacion = await this.findOperacionById.run(
      OperacionId.instance(id),
    );
    return operacion ? OperacionResponseDto.fromDomain(operacion) : null;
  }

  @ClientPerms('operacion:read')
  @Get('/cliente/:clienteId')
  async getByCliente(
    @Param('clienteId') clienteId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedOperacionResponseDto> {
    // 1) Operaciones paginadas por cliente
    const pageResult = await this.findByCliente.run(
      clienteId,
      query.toParams(),
    );

    // 2) Calcular valor (crédito/debito/delta) en batch
    const valorMap = await this.operacionValorService.calcularParaOperaciones(
      pageResult.items,
    );

    // 3) Mapear a DTO + inyectar los campos resumidos
    const items = pageResult.items.map((op) => {
      const dto = OperacionResponseDto.fromDomain(op);
      const valor = valorMap.get(op.id.value);

      if (valor) {
        dto.puntosCredito = valor.puntosCredito;
        dto.puntosDebito = valor.puntosDebito;
        dto.puntosDelta = valor.puntosDelta;
      }

      return dto;
    });

    const hasNext =
      pageResult.total > 0 &&
      pageResult.page < Math.ceil(pageResult.total / pageResult.limit);

    return {
      items,
      total: pageResult.total,
      page: pageResult.page,
      limit: pageResult.limit,
      hasNext: hasNext,
    };
  }

  @ClientPerms('operacion:read')
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
    requireSucursalData: true,
  })
  @ClientPerms('operacion:write')
  @Post('compra')
  async compra(@Body() dto: OperacionDto): Promise<CreateOperacionResponse> {
    return this.transactionalRunner.runInTransaction((ctx) =>
      this.compraUseCase.run(dto, ctx),
    );
  }

  @Authz({
    allowedAzp: ['puntos-fsa'],
    requireSucursalData: true,
  })
  @ClientPerms('operacion:write')
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
    requireSucursalData: true,
  })
  @ClientPerms('operacion:write')
  @Post('anulacion')
  async anulacion(@Body() dto: OperacionDto): Promise<CreateOperacionResponse> {
    return this.transactionalRunner.runInTransaction((ctx) =>
      this.anulacionUseCase.run(dto, ctx),
    );
  }
}
