import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiJwtGuard } from '@infrastructure/auth/api-jwt.guard';
import { Authz } from '@infrastructure/auth/authz-policy.decorator';
import {
  UpsertClienteFromPlexRequestDto,
  UpsertClienteFromPlexResponseDto,
} from '../dto/clientes-upsert-from-plex.dto';
import { ClientesUpsertFromPlexService } from '../services/clientes-upsert-from-plex.service';

@ApiTags('Integraciones - Clientes')
@ApiBearerAuth()
@UseGuards(ApiJwtGuard)
@Authz({
  allowedAzp: ['clientes-fsa', 'puntos-fsa', 'bff'],
  requireSucursalData: false,
})
@Controller('integrations/clientes')
export class ClientesUpsertController {
  constructor(private readonly service: ClientesUpsertFromPlexService) {}

  @Post('upsert')
  @ApiOperation({
    summary: 'Upsert técnico de cliente desde PLEX (fuente de verdad)',
  })
  @ApiBody({ type: UpsertClienteFromPlexRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Cliente creado o actualizado correctamente.',
    type: UpsertClienteFromPlexResponseDto,
  })
  async upsert(
    @Body() dto: UpsertClienteFromPlexRequestDto,
  ): Promise<UpsertClienteFromPlexResponseDto> {
    return this.service.run(dto);
  }
}
