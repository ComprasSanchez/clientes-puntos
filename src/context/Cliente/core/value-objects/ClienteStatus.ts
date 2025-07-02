import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';
import { StatusCliente } from '../enums/StatusCliente';
import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';

export class ClienteStatus {
  value: StatusCliente;

  constructor(value: string) {
    if (!value) {
      throw new FieldRequiredError('Status');
    }
    const v = value.toLowerCase() as StatusCliente;
    if (!Object.values(StatusCliente).includes(v)) {
      throw new InvalidFormatError(value);
    }
    this.value = v;
  }

  toString(): string {
    return this.value;
  }
}
