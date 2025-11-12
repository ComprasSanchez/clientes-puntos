export class ClienteIdFidely {
  value?: number; // <-- puede ser undefined

  constructor(value?: number | null) {
    this.value = value === null ? undefined : value;
    this.validate();
  }

  private validate() {
    if (this.value == null) {
      // undefined o null
      return;
    }
    // Si querés validar algo cuando hay valor, ponelo acá:
    if (typeof this.value !== 'number' || Number.isNaN(this.value)) {
      throw new Error('idFidely debe ser un número válido');
    }
  }
}
