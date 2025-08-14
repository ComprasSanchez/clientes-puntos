// infrastructure/integrations/PLEX/dtos/fidelizar-producto.response.dto.ts
export interface PlexFidelizarProductoResponseDto {
  respCode: string; // '0' OK, otros = error
  respMsg: string; // descripción
  idProducto?: string; // opcional: eco del IdProducto procesado
}

export class PlexFidelizarProductoResponseMapper {
  static toXml(dto: PlexFidelizarProductoResponseDto): any {
    return {
      RespuestaFidelyGB: {
        respCode: dto.respCode,
        respMsg: dto.respMsg,
        ...(dto.idProducto ? { idProducto: dto.idProducto } : {}),
      },
    };
  }
}
