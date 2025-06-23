export interface AcreditarDto {
  clienteId: string; // El ID del cliente
  cantidadOriginal: number; // Puntos a acreditar
  expiraEn?: string; // Fecha ISO (p.ej. "2025-12-31T23:59:59Z")
  origenTipo: string; // Enum que indica el origen de la operación
  referenciaId?: string; // ID externo opcional
}
