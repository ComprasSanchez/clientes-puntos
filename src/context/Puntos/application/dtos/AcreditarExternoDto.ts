import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Acreditación pedida por otro sistema, con clave para no repetirla. */
export class AcreditarExternoDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Cliente de clientes-puntos (si no viene, se busca por dni)',
  })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({
    example: '30111222',
    description: 'DNI, si no se conoce el clienteId',
  })
  @IsOptional()
  @Matches(/^\d{6,10}$/, { message: 'dni inválido' })
  dni?: string;

  @ApiProperty({ example: 500 })
  @IsInt()
  @Min(1)
  @Max(1000000)
  puntos!: number;

  @ApiProperty({ example: 'Trivia calendario de fin de año (7/12)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  motivo!: string;

  @ApiProperty({ example: 'CALENDARIO_FIN_DE_ANIO' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  origenTipo!: string;

  @ApiProperty({ example: 'calendario:FIN_DE_ANIO_2026:2026-12-07:<cliente>' })
  @Matches(/^[A-Za-z0-9:_.-]{8,160}$/, { message: 'claveExterna inválida' })
  claveExterna!: string;
}
