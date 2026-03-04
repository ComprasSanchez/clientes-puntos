// src/infrastructure/controllers/LoteController.ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { LoteResponseDto } from '../dtos/LoteResponseDto';
import { BatchEstado } from '../../core/enums/BatchEstado';
import { LoteId } from '../../core/value-objects/LoteId';
import { FindAllLotesUseCase } from '@puntos/application/use-cases/LoteFindAll/LoteFindAll';
import { FindLoteByIdUseCase } from '@puntos/application/use-cases/LoteFindById/LoteFindById';
import { FindLotesByClienteUseCase } from '@puntos/application/use-cases/LoteFindByCliente/LoteFindByCliente';
import { ApiJwtGuard } from '@infrastructure/auth/api-jwt.guard';
import { Authz } from '@infrastructure/auth/authz-policy.decorator';
import { ClientPerms } from '@sistemas-fsa/authz/nest';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Lote')
@ApiBearerAuth()
@UseGuards(ApiJwtGuard)
@Authz({
  allowedAzp: ['puntos-fsa', 'bff'],
  requireSucursalData: false, // si no dependen de sucursal
})
@Controller('lotes')
export class LoteController {
  constructor(
    private readonly findAllLotes: FindAllLotesUseCase,
    private readonly findLoteById: FindLoteByIdUseCase,
    private readonly findLotesByCliente: FindLotesByClienteUseCase,
  ) {}

  @ClientPerms('lote:read')
  @Get()
  @ApiOperation({ summary: 'Lista todos los lotes' })
  @ApiResponse({ status: 200, type: [LoteResponseDto] })
  async getAll(): Promise<LoteResponseDto[]> {
    const lotes = await this.findAllLotes.run();
    return lotes.map(LoteResponseDto.fromDomain);
  }

  @ClientPerms('lote:read')
  @Get(':id')
  @ApiOperation({ summary: 'Busca lote por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: LoteResponseDto })
  async getById(@Param('id') id: string): Promise<LoteResponseDto | null> {
    const lote = await this.findLoteById.run(new LoteId(id));
    return lote ? LoteResponseDto.fromDomain(lote) : null;
  }

  @ClientPerms('lote:read')
  @Get('/cliente/:clienteId')
  @ApiOperation({ summary: 'Lista lotes por cliente' })
  @ApiParam({ name: 'clienteId', type: String })
  @ApiQuery({ name: 'estado', required: false, enum: BatchEstado })
  @ApiResponse({ status: 200, type: [LoteResponseDto] })
  async getByCliente(
    @Param('clienteId') clienteId: string,
    @Query('estado') estado?: BatchEstado,
  ): Promise<LoteResponseDto[]> {
    const lotes = await this.findLotesByCliente.run(clienteId, estado);
    return lotes.map(LoteResponseDto.fromDomain);
  }
}
