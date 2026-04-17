import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Matches } from 'class-validator';

export class UpsertClienteFromPlexRequestDto {
  @ApiProperty({ example: '12345678' })
  @IsString()
  @Matches(/^\d{6,10}$/)
  dni!: string;

  @ApiProperty({ example: 987654 })
  @IsInt()
  idFidely!: number;

  @ApiProperty({ example: '123456789012' })
  @IsString()
  @Matches(/^\d{1,16}$/)
  tarjetaFidely!: string;

  @ApiPropertyOptional({ enum: ['activo', 'bloqueado', 'inactivo'] })
  @IsOptional()
  @IsString()
  @IsIn(['activo', 'bloqueado', 'inactivo'])
  status?: 'activo' | 'bloqueado' | 'inactivo';

  @ApiProperty({ example: 'PLEX' })
  @IsString()
  @IsIn(['PLEX'])
  source!: 'PLEX';

  @ApiProperty({ example: '238902' })
  @IsString()
  sourceId!: string;
}

export class UpsertClienteFromPlexResponseDto {
  @ApiProperty({ example: '7ec074b8-56f6-4b88-b587-2a172b5f9cd4' })
  clienteId!: string;

  @ApiProperty({ enum: ['created', 'updated'] })
  action!: 'created' | 'updated';
}
