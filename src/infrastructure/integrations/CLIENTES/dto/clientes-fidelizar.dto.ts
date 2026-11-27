import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class FidelizarClienteRequestDto {
  @ApiProperty({ example: '12345678' })
  @IsString()
  @Matches(/^\d{6,10}$/)
  dni!: string;
}

export class FidelizarClienteResponseDto {
  @ApiProperty({ example: '7ec074b8-56f6-4b88-b587-2a172b5f9cd4' })
  clienteId!: string;

  @ApiProperty({ example: '12345678' })
  tarjetaFidely!: string;

  @ApiProperty({ description: 'false si ya estaba fidelizado' })
  created!: boolean;
}
