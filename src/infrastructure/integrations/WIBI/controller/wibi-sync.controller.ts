import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WibiSyncService } from '../services/wibi-sync.service';

interface WibiSyncBody {
  batchSize?: number;
  dryRun?: boolean;
  maxBatches?: number;
  background?: boolean;
}

@ApiTags('Integraciones - WIBI')
@Controller('integrations/wibi/sync')
export class WibiSyncController {
  constructor(private readonly service: WibiSyncService) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ejecuta sincronizacion temporal WIBI hacia Puntos',
  })
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        batchSize: { type: 'number', example: 1000 },
        dryRun: { type: 'boolean', example: true },
        maxBatches: { type: 'number', example: 2 },
        background: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Sincronizacion finalizada.',
  })
  async run(@Body() body: WibiSyncBody = {}): Promise<unknown> {
    const input = {
      batchSize: body.batchSize,
      dryRun: body.dryRun,
      maxBatches: body.maxBatches,
    };

    if (body.background === true) {
      this.service.runInBackground(input);
      return {
        status: 'ACCEPTED',
        message: 'WIBI sync started in background',
      };
    }

    return this.service.run(input);
  }
}
