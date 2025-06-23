import { Sexo } from '../enums/SexoCliente';

export class ClienteSexo {
  value: string;

  constructor(value: string) {
    this.value = value;
    this.validate();
  }

  private validate() {
    if (!this.value) {
      throw new Error('El sexo del cliente no puede ser vacío.');
    }

    // Forzar mayúscula por si el caller pasa 'm', 'f' o 'x'
    const v = this.value.toUpperCase();

    // Validar membresía en el enum Sexo
    if (!Object.values(Sexo).includes(v as Sexo)) {
      throw new Error(
        `Sexo inválido: "${this.value}" no es uno de los valores permitidos (${Object.values(Sexo).join(', ')}).`,
      );
    }

    // Finalmente, asignamos la versión normalizada
    this.value = v;
  }

  toString(): string {
    return this.value;
  }
}
