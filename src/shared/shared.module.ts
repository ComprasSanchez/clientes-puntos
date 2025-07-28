import { Module, Global } from '@nestjs/common';
import { UUIDv4Generator } from './infrastructure/uuid/UuidV4Generator';
import { UUIDGenerator } from './core/uuid/UuidGenerator';
import { CardGenerator } from './core/interfaces/CardGenerator';
import { LuhnTarjetaGenerator } from './infrastructure/generators/LuhnCardGenerator';

@Global()
@Module({
  providers: [
    { provide: UUIDGenerator, useClass: UUIDv4Generator },
    {
      provide: CardGenerator,
      useClass: LuhnTarjetaGenerator,
    },
  ],
  exports: [UUIDGenerator, CardGenerator],
})
export class SharedModule {}
