import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClienteDto {
  @ApiPropertyOptional()
  dni?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  categoriaId?: string;

  @ApiPropertyOptional()
  idFidely?: number;

  @ApiPropertyOptional()
  tarjetaFidely: string;

  @ApiPropertyOptional()
  fechaBaja?: string | null;
}
