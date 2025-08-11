// src/context/Categoria/infrastructure/dtos/CategoriaResponseDto.ts
export class CategoriaResponseDto {
  id: string;
  nombre: string;
  descripcion?: string | null;
  codExt: number | null;
  timestamp: {
    createdAt: Date;
    updatedAt: Date;
  };
}
