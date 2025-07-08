import { ApiProperty } from '@nestjs/swagger';

export class ClienteResponseDto {
  @ApiProperty({ example: 'clnt-1234' })
  id: string;

  @ApiProperty({ example: '12345678' })
  dni: string;

  @ApiProperty({ example: 'John' })
  nombre: string;

  @ApiProperty({ example: 'Doe' })
  apellido: string;

  @ApiProperty({ example: 'M' })
  sexo: string;

  @ApiProperty({ type: String, nullable: true, example: '1980-01-01' })
  fechaNacimiento: string | null;

  @ApiProperty({ example: 'activo' })
  status: string;

  @ApiProperty({ example: 'Premium' })
  categoria: string;

  @ApiProperty({ type: String, nullable: true, example: 'john.doe@email.com' })
  email: string | null;

  @ApiProperty({ type: String, nullable: true, example: '+54 9 11 2345 6789' })
  telefono: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Calle Falsa 123' })
  direccion: string | null;

  @ApiProperty({ type: String, nullable: true, example: '1000' })
  codPostal: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Buenos Aires' })
  localidad: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Buenos Aires' })
  provincia: string | null;

  @ApiProperty({ type: String, nullable: true, example: '123456' })
  idFidely: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'TARJ987654' })
  tarjetaFidely: string | null;

  @ApiProperty({ type: String, nullable: true, example: '2025-07-08' })
  fechaBaja: string | null;
}
