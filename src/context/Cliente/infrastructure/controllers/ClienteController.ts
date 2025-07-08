import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CategoriaFindById } from '@cliente/application/use-cases/CategoriaFindById/CategoriaFindById';
import { ClienteCreate } from '@cliente/application/use-cases/ClienteCreate/ClienteCreate';
import { ClienteFindAll } from '@cliente/application/use-cases/ClienteFindAll/ClienteFindAll';
import { ClienteFindByDni } from '@cliente/application/use-cases/ClienteFindByDni/ClienteFindByDni';
import { ClienteGetProfile } from '@cliente/application/use-cases/ClienteGetProfile/ClienteGetProfile';
import { ClienteFindById } from '@cliente/application/use-cases/ClienteFindbyId/ClienteFindById';
import { ClienteUpdate } from '@cliente/application/use-cases/ClienteUpdate/ClienteUpdate';
import { ClienteDelete } from '@cliente/application/use-cases/ClienteDelete/ClienteDelete';
import { CreateClienteDto } from '@cliente/application/dtos/ClienteCreateDto';
import { UpdateClienteDto } from '@cliente/application/dtos/ClienteUpdateDto';
import { ClienteProfileDto } from '@cliente/application/dtos/ClienteProfileDto';
import { ClienteResponseDto } from '../../application/dtos/ClienteResponseDto';

@ApiTags('Cliente')
@Controller('cliente')
export class ClienteController {
  constructor(
    private readonly createUseCase: ClienteCreate,
    private readonly findAllUseCase: ClienteFindAll,
    private readonly findByIdUseCase: ClienteFindById,
    private readonly findByDniUseCase: ClienteFindByDni,
    private readonly getProfileUseCase: ClienteGetProfile,
    private readonly updateUseCase: ClienteUpdate,
    private readonly deleteUseCase: ClienteDelete,
    private readonly findCategoriaById: CategoriaFindById,
  ) {}

  @ApiOperation({ summary: 'Crear un cliente' })
  @ApiBody({ type: CreateClienteDto })
  @ApiResponse({ status: 201, description: 'Cliente creado.' })
  @Post()
  async create(@Body() dto: CreateClienteDto): Promise<void> {
    const categoria = await this.findCategoriaById.run(dto.categoriaId);
    await this.createUseCase.run(
      dto.dni,
      dto.nombre,
      dto.apellido,
      dto.sexo,
      new Date(dto.fechaNacimiento),
      categoria,
      dto.email ?? undefined,
      dto.telefono ?? undefined,
      dto.direccion ?? undefined,
      dto.codPostal ?? undefined,
      dto.localidad ?? undefined,
      dto.provincia ?? undefined,
      dto.idFidely ?? undefined,
      dto.tarjetaFidely ?? undefined,
    );
  }

  @ApiOperation({ summary: 'Obtener todos los clientes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes.',
    type: [ClienteResponseDto],
  })
  @Get()
  async findAll(): Promise<ClienteResponseDto[] | null> {
    const clientes = await this.findAllUseCase.run();

    return clientes;
  }

  @ApiOperation({ summary: 'Buscar cliente por DNI' })
  @ApiParam({ name: 'dni', type: String })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado.',
    type: ClienteProfileDto,
  })
  @Get('dni/:dni')
  async findByDni(
    @Param('dni') dni: string,
  ): Promise<ClienteResponseDto | null> {
    const c = await this.findByDniUseCase.run(dni);
    return c;
  }

  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado.',
    type: ClienteProfileDto,
  })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ClienteResponseDto | null> {
    const c = await this.findByIdUseCase.run(id);
    return c;
  }

  @ApiOperation({ summary: 'Obtener perfil de cliente' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Perfil del cliente.',
    type: ClienteProfileDto,
  })
  @Get(':id/profile')
  async profile(@Param('id') id: string) {
    return this.getProfileUseCase.run(id);
  }

  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateClienteDto })
  @ApiResponse({ status: 204, description: 'Cliente actualizado.' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClienteDto,
  ): Promise<void> {
    await this.updateUseCase.run({ id, ...dto });
  }

  @ApiOperation({ summary: 'Eliminar cliente' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Cliente eliminado.' })
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.run(id);
  }
}
