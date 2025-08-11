import { CreateCategoriaDto } from '@cliente/application/dtos/CategoriaCreateDto';
import { UpdateCategoriaDto } from '@cliente/application/dtos/CategoriaUpdateDto';
import { CategoriaCreate } from '@cliente/application/use-cases/CategoriaCreate/CategoriaCreate';
import { CategoriaDelete } from '@cliente/application/use-cases/CategoriaDelete/CategoriaDelete';
import { CategoriaFindAll } from '@cliente/application/use-cases/CategoriaFindAll/CategoriaFindAll';
import { CategoriaFindById } from '@cliente/application/use-cases/CategoriaFindById/CategoriaFindById';
import { CategoriaUpdate } from '@cliente/application/use-cases/CategoriaUpdate/CategoriaUpdate';
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { CategoriaResponseDto } from '../../application/dtos/CategoriaResponseDto';

@Controller('categoria')
export class CategoriaController {
  constructor(
    private readonly createUseCase: CategoriaCreate,
    private readonly findAllUseCase: CategoriaFindAll,
    private readonly findByIdUseCase: CategoriaFindById,
    private readonly updateUseCase: CategoriaUpdate,
    private readonly deleteUseCase: CategoriaDelete,
  ) {}

  @Post()
  async create(@Body() dto: CreateCategoriaDto): Promise<void> {
    await this.createUseCase.run(dto);
  }

  @Get()
  async findAll(): Promise<CategoriaResponseDto[]> {
    const list = await this.findAllUseCase.run();
    return list.map((c) => ({
      id: c.id.value,
      nombre: c.nombre.value,
      codExt: c.codExt,
      descripcion: c.descripcion?.value ?? null,
      timestamp: c.timestamp,
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const c = await this.findByIdUseCase.run(id);
    return {
      id: c.id.value,
      nombre: c.nombre.value,
      descripcion: c.descripcion?.value ?? null,
      timestamp: c.timestamp,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoriaDto,
  ): Promise<void> {
    await this.updateUseCase.run({ id, ...dto });
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.run(id);
  }
}
