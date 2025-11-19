// @cliente/core/ports/ClienteQueryPort.ts
export interface ClienteBasicData {
  id: string;
  nombre: string;
  apellido?: string;
  documento?: string;
  email?: string;
}

export interface ClienteQueryPort {
  findById(id: string): Promise<ClienteBasicData | null>;
}
