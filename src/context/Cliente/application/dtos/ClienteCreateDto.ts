export class CreateClienteDto {
  dni: string;
  nombre: string;
  apellido: string;
  sexo: string;
  fechaNacimiento: string; // ISO date string
  categoriaId: string;
  idFidely: number;
  tarjetaFidely: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  codPostal?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  fechaBaja?: string | null;
}
