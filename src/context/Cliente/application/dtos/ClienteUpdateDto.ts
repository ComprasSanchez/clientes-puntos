export class UpdateClienteDto {
  dni?: string;
  nombre?: string;
  apellido?: string;
  sexo?: string;
  fechaNacimiento?: string;
  status?: string;
  categoriaId?: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  codPostal?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  idFidely?: string | null;
  tarjetaFidely?: string | null;
  fechaBaja?: string | null;
}
