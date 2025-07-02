import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';

export class FakeUUIDGen implements UUIDGenerator {
  generate(): string {
    return '00000000-0000-4000-8000-000000000000';
  }
}
