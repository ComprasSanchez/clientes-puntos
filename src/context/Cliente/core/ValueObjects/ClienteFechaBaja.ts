export class ClienteFechaBaja {
  value: Date | null;

  constructor(value?: Date | null) {
    this.value = value ?? null;
    this.validate();
  }

  private validate() {
    // Nullable: si es null, no hay validación
    if (this.value === null) {
      return;
    }
    if (!(this.value instanceof Date) || isNaN(this.value.getTime())) {
      throw new Error('Fecha de baja inválida: no es una fecha válida.');
    }
    const ahora = new Date();
    if (this.value > ahora) {
      throw new Error(
        `Fecha de baja inválida: "${this.value.toISOString().split('T')[0]}" no puede ser en el futuro.`,
      );
    }
  }

  toString(): string {
    return this.value ? this.value.toISOString().split('T')[0] : '';
  }
}
