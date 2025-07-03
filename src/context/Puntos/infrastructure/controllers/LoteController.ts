// src/infrastructure/controllers/LoteController.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { LoteResponseDto } from '../dtos/LoteResponseDto';
import { BatchEstado } from '../../core/enums/BatchEstado';
import { LoteId } from '../../core/value-objects/LoteId';
import { FindAllLotesUseCase } from '@puntos/application/use-cases/LoteFindAll/LoteFindAll';
import { FindLoteByIdUseCase } from '@puntos/application/use-cases/LoteFindById/LoteFindById';
import { FindLotesByClienteUseCase } from '@puntos/application/use-cases/LoteFindByCliente/LoteFindByCliente';

@Controller('lotes')
export class LoteController {
  constructor(
    private readonly findAllLotes: FindAllLotesUseCase,
    private readonly findLoteById: FindLoteByIdUseCase,
    private readonly findLotesByCliente: FindLotesByClienteUseCase,
  ) {}

  @Get()
  async getAll(): Promise<LoteResponseDto[]> {
    const lotes = await this.findAllLotes.run();
    return lotes.map(LoteResponseDto.fromDomain);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<LoteResponseDto | null> {
    const lote = await this.findLoteById.run(new LoteId(id));
    return lote ? LoteResponseDto.fromDomain(lote) : null;
  }

  @Get('/cliente/:clienteId')
  async getByCliente(
    @Param('clienteId') clienteId: string,
    @Query('estado') estado?: BatchEstado,
  ): Promise<LoteResponseDto[]> {
    const lotes = await this.findLotesByCliente.run(clienteId, estado);
    return lotes.map(LoteResponseDto.fromDomain);
  }
}
