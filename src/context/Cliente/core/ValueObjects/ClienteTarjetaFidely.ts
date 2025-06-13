export class ClienteTarjetaFidely {
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
    const tarjetaRegex = /^[0-9]{1,16}$/;
    if (!tarjetaRegex.test(this.value)) {
      throw new Error(
        `Tarjeta inválida: "${this.value}" debe contener hasta 16 dígitos numéricos.`,
      );
    }
  }

  toString(): string {
    return this.value ?? '';
  }
}
