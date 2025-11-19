export interface ClienteBasicData {
  id: string;
  nombre: string;
  apellido?: string;
  documento?: string;
}

export interface ClienteQueryPort {
  findById(id: string): Promise<ClienteBasicData | null>;
}
