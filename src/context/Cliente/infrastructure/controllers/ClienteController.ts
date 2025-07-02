import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
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

  @Post()
  async create(@Body() dto: CreateClienteDto): Promise<void> {
    // Obtener la categoría como dominio
    const categoria = await this.findCategoriaById.run(dto.categoriaId);
    // Ejecutar use-case de creación
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

  @Get()
  async findAll() {
    const clientes = await this.findAllUseCase.run();
    return clientes.map((c) => ({
      id: c.id.value,
      dni: c.dni.value,
      nombre: c.nombre.value,
      apellido: c.apellido.value,
      sexo: c.sexo.value,
      fechaNacimiento: c.fechaNacimiento.value,
      status: c.status.value,
      categoria: c.categoria.nombre.value,
      email: c.email.value,
      telefono: c.telefono.value,
      direccion: c.fullAdress.direccion.value,
      codPostal: c.fullAdress.codPostal.value,
      localidad: c.fullAdress.localidad.value,
      provincia: c.fullAdress.provincia.value,
      idFidely: c.fidelyStatus.idFidely.value,
      tarjetaFidely: c.fidelyStatus.tarjetaFidely.value,
      fechaBaja: c.fidelyStatus.fechaBaja.value?.toISOString() ?? null,
    }));
  }

  @Get('dni/:dni')
  async findByDni(@Param('dni') dni: string) {
    const c = await this.findByDniUseCase.run(dni);
    return {
      id: c.id.value,
      dni: c.dni.value,
      nombre: c.nombre.value,
      apellido: c.apellido.value,
      sexo: c.sexo.value,
      fechaNacimiento: c.fechaNacimiento.value,
      status: c.status.value,
      categoria: c.categoria.nombre.value,
      email: c.email.value,
      telefono: c.telefono.value,
      direccion: c.fullAdress.direccion.value,
      codPostal: c.fullAdress.codPostal.value,
      localidad: c.fullAdress.localidad.value,
      provincia: c.fullAdress.provincia.value,
      idFidely: c.fidelyStatus.idFidely.value,
      tarjetaFidely: c.fidelyStatus.tarjetaFidely.value,
      fechaBaja: c.fidelyStatus.fechaBaja.value?.toISOString() ?? null,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const c = await this.findByIdUseCase.run(id);
    return {
      id: c.id.value,
      dni: c.dni.value,
      nombre: c.nombre.value,
      apellido: c.apellido.value,
      sexo: c.sexo.value,
      fechaNacimiento: c.fechaNacimiento.value,
      status: c.status.value,
      categoria: c.categoria.nombre.value,
      email: c.email.value,
      telefono: c.telefono.value,
      direccion: c.fullAdress.direccion.value,
      codPostal: c.fullAdress.codPostal.value,
      localidad: c.fullAdress.localidad.value,
      provincia: c.fullAdress.provincia.value,
      idFidely: c.fidelyStatus.idFidely.value,
      tarjetaFidely: c.fidelyStatus.tarjetaFidely.value,
      fechaBaja: c.fidelyStatus.fechaBaja.value?.toISOString() ?? null,
    };
  }

  @Get(':id/profile')
  async profile(@Param('id') id: string) {
    return this.getProfileUseCase.run(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClienteDto,
  ): Promise<void> {
    await this.updateUseCase.run({ id, ...dto });
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.run(id);
  }
}
