import { v4 as uuidv4 } from 'uuid';
import { UUIDGenerator } from '../../core/uuid/UuidGenerator';

export class UUIDv4Generator implements UUIDGenerator {
  generate(): string {
    return uuidv4();
  }
}
