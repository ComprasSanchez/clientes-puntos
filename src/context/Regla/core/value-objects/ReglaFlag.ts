import { InvalidBooleanError } from 'src/shared/core/exceptions/InvalidBooleanError';

export class ReglaFlag {
  constructor(public readonly value: boolean) {
    if (typeof value !== 'boolean') {
      throw new InvalidBooleanError(value);
    }
  }
}
