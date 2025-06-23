import { Module, Global } from '@nestjs/common';
import { UUIDv4Generator } from './infrastructure/uuid/UuidV4Generator';
import { UUIDGenerator } from './core/uuid/UuidGenerator';

@Global()
@Module({
  providers: [{ provide: UUIDGenerator, useClass: UUIDv4Generator }],
  exports: [UUIDGenerator],
})
export class SharedModule {}
