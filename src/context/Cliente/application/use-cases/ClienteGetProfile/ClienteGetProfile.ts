import { ClienteNotFoundError } from '../../../core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '../../../core/repository/ClienteRepository';
import { ClienteId } from '../../../core/value-objects/ClienteId';
import { ClienteProfileDto } from '../../dtos/ClienteProfileDto';
import { IPuntosService } from '../../ports/IPuntosService';

export class ClienteGetProfile {
  constructor(
    private readonly repository: ClienteRepository,
    private readonly puntosService: IPuntosService,
  ) {}

  /**
   * Devuelve el perfil completo de un cliente, incluyendo su saldo de puntos.
   */
  async run(id: string): Promise<ClienteProfileDto> {
    const cliente = await this.repository.findById(new ClienteId(id));
    if (!cliente) {
      throw new ClienteNotFoundError(`Cliente ${id} no encontrado`);
    }

    // Llamada al contexto Puntos para obtener el saldo actual
    const saldoActual = await this.puntosService.obtenerSaldoActual(id);

    // Mapear la entidad Cliente a DTO, inyectando el saldo obtenido
    return {
      id: cliente.id.value,
      dni: cliente.dni.value,
      nombre: cliente.nombre.value,
      apellido: cliente.apellido.value,
      sexo: cliente.sexo.value,
      fechaNacimiento: cliente.fechaNacimiento.value.toISOString(),
      status: cliente.status.value,
      categoria: cliente.categoria.nombre.value,
      email: cliente.email.value,
      telefono: cliente.telefono.value,
      direccion: cliente.fullAdress.direccion.value,
      codPostal: cliente.fullAdress.codPostal.value,
      localidad: cliente.fullAdress.localidad.value,
      provincia: cliente.fullAdress.provincia.value,
      idFidely: cliente.fidelyStatus.idFidely.value,
      tarjetaFidely: cliente.fidelyStatus.tarjetaFidely.value,
      fechaAlta: cliente.fidelyStatus.fechaAlta.value.toISOString(),
      fechaBaja: cliente.fidelyStatus.fechaBaja.value?.toISOString() ?? null,
      createdAt: cliente.timestamp.createdAt.toISOString(),
      updatedAt: cliente.timestamp.updatedAt.toISOString(),
      saldoActual,
    };
  }
}
