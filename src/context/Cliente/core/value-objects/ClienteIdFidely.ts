export class ClienteIdFidely {
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
    // Validación básica de no vacío; extender si hay formato específico.
  }

  toString(): string {
    return this.value ?? '';
  }
}
