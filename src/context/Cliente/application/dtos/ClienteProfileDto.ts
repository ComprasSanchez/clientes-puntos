import { ApiProperty } from '@nestjs/swagger';

export class ClienteProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  dni: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  apellido: string;

  @ApiProperty()
  sexo: string;

  @ApiProperty({ type: String, example: '1997-11-11' })
  fechaNacimiento: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  categoria: string;

  @ApiProperty({ nullable: true })
  email: string | null;

  @ApiProperty({ nullable: true })
  telefono: string | null;

  @ApiProperty({ nullable: true })
  direccion: string | null;

  @ApiProperty({ nullable: true })
  codPostal: string | null;

  @ApiProperty({ nullable: true })
  localidad: string | null;

  @ApiProperty({ nullable: true })
  provincia: string | null;

  @ApiProperty({ nullable: true })
  idFidely: string | null;

  @ApiProperty({ nullable: true })
  tarjetaFidely: string | null;

  @ApiProperty({ type: String, example: '2024-07-08' })
  fechaAlta: string;

  @ApiProperty({ type: String, example: '2025-01-01', nullable: true })
  fechaBaja: string | null;

  @ApiProperty({ type: String })
  createdAt: string;

  @ApiProperty({ type: String })
  updatedAt: string;

  @ApiProperty()
  saldoActual: number;
}
