// infrastructure/integrations/PLEX/dto/fidelizar-producto.request.dto.ts
export interface PlexClasificadorDto {
  idTipoClasificador: number;
  idClasificador: number;
  nombre?: string;
}

export interface PlexProductoDto {
  idProducto: number; // codExt
  producto?: string; // nombre
  presentacion?: string;
  costo?: number;
  precio?: number;
  activa?: boolean;
  clasificadores?: PlexClasificadorDto[];
}

export interface PlexFidelizarProductoRequestDto {
  codAccion: number; // 500..504
  idRed?: number;
  productos: PlexProductoDto[]; // 👈 array de productos
  motivo?: string; // ej. auditoría para 504 (opcional)
}
