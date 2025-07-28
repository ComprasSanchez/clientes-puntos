export class ClienteIdFidely {
  value: number;

  constructor(value: number) {
    this.value = value;
    this.validate();
  }

  private validate() {
    if (this.value === null) {
      return;
    }
    // Validación básica de no vacío; extender si hay formato específico.
  }
}
