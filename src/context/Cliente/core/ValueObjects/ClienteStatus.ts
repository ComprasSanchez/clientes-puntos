export enum StatusCliente {
  Activo = 'activo',
  Bloqueado = 'bloqueado',
  Inactivo = 'inactivo',
}

export class ClienteStatus {
  value: StatusCliente;

  constructor(value: string) {
    if (!value) {
      throw new Error('El status del cliente no puede ser vacío.');
    }
    const v = value.toLowerCase() as StatusCliente;
    if (!Object.values(StatusCliente).includes(v)) {
      throw new Error(
        `Status inválido: "${value}" no es uno de los valores permitidos (${Object.values(StatusCliente).join(', ')}).`,
      );
    }
    this.value = v;
  }

  toString(): string {
    return this.value;
  }
}
