import { InvalidFormatError } from 'src/shared/core/exceptions/InvalidFormatError';

export class ClienteEmail {
  value: string | null;

  constructor(value?: string | null) {
    const v = value != null && value.trim() !== '' ? value.trim() : null;
    this.value = v;
    this.validate();
  }

  private validate() {
    if (this.value === null) {
      return;
    }
    const emailRegexStricto =
      /^(?!.*\.\.)([A-Za-z0-9]+(?:[._%+-]?[A-Za-z0-9]+)*)@(?!-)[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*(?:\.[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)+$/;
    if (!emailRegexStricto.test(this.value)) {
      throw new InvalidFormatError(this.value);
    }
  }

  toString(): string {
    return this.value ?? '';
  }
}
