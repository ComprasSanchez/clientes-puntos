import {
  v4 as uuidv4,
  validate as uuidValidate,
  version as uuidVersion,
} from 'uuid';
import { UUIDGenerator } from '../../core/uuid/UuidGenerator';
import { UUIDValidationError } from './exceptions/UUIDValidationError';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UUIDv4Generator implements UUIDGenerator {
  generate(): string {
    const id = uuidv4();

    // 1) Validar que sea un UUID bien formado
    if (!uuidValidate(id)) {
      throw new UUIDValidationError();
    }
    // 2) Asegurarse de que sea versión 4
    if (uuidVersion(id) !== 4) {
      throw new UUIDValidationError();
    }

    return id;
  }
}
