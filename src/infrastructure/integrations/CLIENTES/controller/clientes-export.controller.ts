// points/src/interfaces/http/ClientesExportController.ts
import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClientesExportService } from '../services/ClientesExportService';
import { PuntosClienteBatch } from '../dto/clientes-export.dto';

@ApiTags('Integraciones - Clientes')
@Controller('integrations/puntos/clientes')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ClientesExportController {
  constructor(private readonly service: ClientesExportService) {}

  @Get()
  @ApiOperation({
    summary: 'Exporta clientes en batch con cursor',
    description:
      'Devuelve clientes paginados para integración. Si hay más datos, retorna cursor para la siguiente página.',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor opaco de paginación devuelto por la llamada anterior.',
    type: String,
  })
  @ApiQuery({
    name: 'batchSize',
    required: false,
    description: 'Cantidad máxima de registros a devolver.',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Lote de clientes exportado correctamente.',
    schema: {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              dni: { type: 'string' },
              nombre: { type: 'string' },
              apellido: { type: 'string' },
              fidelyId: { type: 'string' },
              tarjetaFidely: { type: 'string' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        cursor: { type: 'string', nullable: true },
      },
    },
  })
  async getAllPaged(
    @Query('cursor') cursor?: string,
    @Query('batchSize') batchSize?: number,
  ): Promise<PuntosClienteBatch> {
    return this.service.fetchAllPaged({
      cursor: cursor ?? null,
      batchSize: batchSize ? Number(batchSize) : undefined,
    });
  }
}
