export interface ClienteProfileDto {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  sexo: string;
  fechaNacimiento: string; // ISO date string
  status: string;
  categoria: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  codPostal: string | null;
  localidad: string | null;
  provincia: string | null;
  idFidely: string | null;
  tarjetaFidely: string | null;
  fechaAlta: string; // ISO date string
  fechaBaja: string | null; // ISO date string or null
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  saldoActual: number; // puntos obtenidos desde contexto Puntos
}
