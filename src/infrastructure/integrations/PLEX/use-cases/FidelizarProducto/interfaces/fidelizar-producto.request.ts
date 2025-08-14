export interface PlexFidelizarProductoRequestDto {
  codAccion: string; // 500..504
  idProducto: number; // codExt del producto en tu dominio
  producto?: string; // nombre
  presentacion?: string;
  costo?: number;
  precio?: number;
  activa?: boolean;
  clasificadores?: Array<{
    idTipoClasificador: number;
    idClasificador: number;
    nombre?: string;
  }>;
  motivo?: string; // para 504 (auditoría), opcional
}
