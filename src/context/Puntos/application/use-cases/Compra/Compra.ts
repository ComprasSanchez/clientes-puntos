import { OpTipo } from 'src/shared/core/enums/OpTipo';
import { CreateOperacionRequest } from '../../dtos/CreateOperacionRequest';
import { CreateOperacionResponse } from '../../dtos/CreateOperacionResponse';
import { OperacionDto } from '../../dtos/OperacionDto';
import { CreateOperacionService } from '../../services/CreateOperacionService';

export class CompraUseCase {
  constructor(private readonly service: CreateOperacionService) {}

  async run(input: OperacionDto): Promise<CreateOperacionResponse> {
    const req: CreateOperacionRequest = {
      ...input,
      tipo: OpTipo.COMPRA,
    };
    return this.service.execute(req);
  }
}
