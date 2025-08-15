// core/reglas/dto/ClassifierRefDTO.ts
export interface ClassifierRefDTO {
  type: string; // ej: "categoria" | "marca" | "rubro" | "custom"
  id: string | number; // id del clasificador
  name?: string;
}
