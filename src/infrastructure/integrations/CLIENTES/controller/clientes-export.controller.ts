// points/src/interfaces/http/ClientesExportController.ts
import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ClientesExportService } from '../services/ClientesExportService';
import { PuntosClienteBatch } from '../dto/clientes-export.dto';

@Controller('integrations/puntos/clientes')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ClientesExportController {
  constructor(private readonly service: ClientesExportService) {}

  @Get()
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
