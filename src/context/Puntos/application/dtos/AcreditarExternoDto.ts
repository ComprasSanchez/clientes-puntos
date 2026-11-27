import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Acreditación pedida por otro sistema, con clave para no repetirla. */
export class AcreditarExternoDto {
  @ApiProperty({ format: 'uuid', description: 'Cliente de clientes-puntos' })
  @IsUUID()
  clienteId!: string;

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
