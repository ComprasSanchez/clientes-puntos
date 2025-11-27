// points/src/interfaces/http/dto/puntos-cliente-export.dto.ts
export type PuntosClienteRawDto = {
  id: string; // UUID o lo que uses
  dni: string; // documento del cliente
  nombre: string;
  apellido: string;
  fidelyId: string;
  tarjetaFidely: string;
  updatedAt: string; // ISO-8601
};

export type PuntosClienteBatch = {
  rows: PuntosClienteRawDto[];
  cursor: string | null; // base64 de { lastId: string }
};
