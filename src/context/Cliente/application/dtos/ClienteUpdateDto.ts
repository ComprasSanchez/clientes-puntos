import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClienteDto {
  @ApiPropertyOptional()
  dni?: string;

  @ApiPropertyOptional()
  nombre?: string;

  @ApiPropertyOptional()
  apellido?: string;

  @ApiPropertyOptional()
  sexo?: string;

  @ApiPropertyOptional({ type: String, example: '1997-11-11' })
  fechaNacimiento?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  categoriaId?: string;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional()
  telefono?: string | null;

  @ApiPropertyOptional()
  direccion?: string | null;

  @ApiPropertyOptional()
  codPostal?: string | null;

  @ApiPropertyOptional()
  localidad?: string | null;

  @ApiPropertyOptional()
  provincia?: string | null;

  @ApiPropertyOptional()
  idFidely?: string | null;

  @ApiPropertyOptional()
  tarjetaFidely?: string | null;

  @ApiPropertyOptional()
  fechaBaja?: string | null;
}
