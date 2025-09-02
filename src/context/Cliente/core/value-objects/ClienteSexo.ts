import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { Sexo } from '../enums/SexoCliente';
import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';

export class ClienteSexo {
  value: string;

  constructor(value: string) {
    this.value = value;
    this.validate();
  }

  private validate() {
    if (!this.value) {
      throw new FieldRequiredError('Sexo');
    }

    // Forzar mayúscula por si el caller pasa 'm', 'f' o 'x'
    const v = this.value.normalize('NFC').trim().toUpperCase();

    // Validar membresía en el enum Sexo
    if (!Object.values(Sexo).includes(v as Sexo)) {
      throw new InvalidFormatError(v);
    }

    // Finalmente, asignamos la versión normalizada
    this.value = v;
  }

  toString(): string {
    return this.value;
  }
}
