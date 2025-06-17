export class ClienteDni {
  value: string;

  constructor(value: string) {
    this.value = value.trim();
    this.validate();
  }

  private validate() {
    if (!this.value) {
      throw new Error('El DNI del cliente no puede ser vacío.');
    }

    // Validar formato de DNI español (7 a 10 digitos)
    const dniRegex = /^\d{7,10}$/;
    if (!dniRegex.test(this.value)) {
      throw new Error(
        `DNI inválido: "${this.value}" no cumple con el formato esperado.`,
      );
    }
  }
}
