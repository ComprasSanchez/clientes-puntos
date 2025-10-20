// src/infrastructure/controllers/ReglaController.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CreateReglaDto } from '@regla/application/dtos/CreateReglaDto';
import { UpdateReglaDto } from '@regla/application/dtos/UpdateReglaDto';
import { TipoRegla } from '@regla/core/enums/TipoRegla';
import { ConversionRule } from '@regla/core/entities/ConversionRule';
import { ReglaFindAll } from '@regla/application/use-cases/ReglaFindAll/FindAll';
import { ReglaFindById } from '@regla/application/use-cases/ReglaFindById/FindById';
import { ReglaCreate } from '@regla/application/use-cases/ReglaCreate/Create';
import { ReglaUpdate } from '@regla/application/use-cases/ReglaUpdate/Update';
import { ReglaDelete } from '@regla/application/use-cases/ReglaDelete/Delete';
import { ReglaResponseDto } from '../dtos/ReglaResponseDto';
import { Regla } from '@regla/core/entities/Regla';
import { ReglaNotFound } from '@regla/core/exceptions/ReglaNotFoundError';
import { ReglaFindCotizacion } from '@regla/application/use-cases/ReglaFindCotizacion/FindCotizacion';
import { ApiJwtGuard } from '@infrastructure/auth/api-jwt.guard';
import { Authz } from '@infrastructure/auth/authz-policy.decorator';

@UseGuards(ApiJwtGuard)
@Authz({
  allowedAzp: ['puntos-fsa', 'bff'],
  requireSucursalData: false,
})
@Controller('regla')
export class ReglaController {
  constructor(
    private readonly findAllUseCase: ReglaFindAll,
    private readonly findByIdUseCase: ReglaFindById,
    private readonly findCotizacionUseCase: ReglaFindCotizacion,
    private readonly createUseCase: ReglaCreate,
    private readonly updateUseCase: ReglaUpdate,
    private readonly deleteUseCase: ReglaDelete,
  ) {}

  @Get()
  async findAll(): Promise<ReglaResponseDto[]> {
    const reglas = await this.findAllUseCase.run();
    return reglas.map((r) => this.toResponseDto(r));
  }

  @Get('/cotizacion')
  async findCotizacion(): Promise<ConversionRule> {
    return this.findCotizacionUseCase.run();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ReglaResponseDto> {
    const regla = await this.findByIdUseCase.run(id);
    if (!regla) throw new ReglaNotFound();
    return this.toResponseDto(regla);
  }

  // Solo administrator
  @Authz({
    allowedAzp: ['puntos-fsa'],
    requiredClientRoles: { 'puntos-fsa': ['administrator'] },
    requireSucursalData: false,
  })
  @Post()
  async create(@Body() dto: CreateReglaDto): Promise<void> {
    await this.createUseCase.run(dto);
  }

  // Solo administrator
  @Authz({
    allowedAzp: ['puntos-fsa'],
    requiredClientRoles: { 'puntos-fsa': ['administrator'] },
    requireSucursalData: false,
  })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReglaDto,
  ): Promise<void> {
    await this.updateUseCase.run(id, dto);
  }

  // Solo administrator
  @Authz({
    allowedAzp: ['puntos-fsa'],
    requiredClientRoles: { 'puntos-fsa': ['administrator'] },
    requireSucursalData: false,
  })
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.run(id);
  }

  // --- mapper dominio → DTO
  private toResponseDto(regla: Regla): ReglaResponseDto {
    const base: ReglaResponseDto = {
      id: regla.id.value,
      nombre: regla.nombre.value,
      tipo: regla.tipo.value,
      prioridad: regla.prioridad.value,
      activa: regla.activa.value,
      excluyente: regla.excluyente.value,
      vigenciaInicio: regla.vigenciaInicio.value,
      vigenciaFin: regla.vigenciaFin?.value,
      descripcion: regla.descripcion?.value,
    };

    if (
      regla.tipo.value === TipoRegla.CONVERSION &&
      regla instanceof ConversionRule
    ) {
      return {
        ...base,
        config: {
          rateAccred: regla.rateAccredVo.value,
          rateSpend: regla.rateSpendVo.value,
          creditExpiryDays: regla.creditExpiryDaysVo?.value,
        },
      };
    }
    return base;
  }
}
