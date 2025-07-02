import { InvalidBooleanError } from '@shared/core/exceptions/InvalidBooleanError';

export class ReglaFlag {
  constructor(public readonly value: boolean) {
    if (typeof value !== 'boolean') {
      throw new InvalidBooleanError(value);
    }
    this.value = value;
  }
}
