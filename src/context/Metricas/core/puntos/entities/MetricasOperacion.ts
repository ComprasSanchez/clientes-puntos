export class MetricasOperacion {
  constructor(
    public readonly fecha: Date,
    public readonly cantidadOperaciones: number,
    public readonly puntosAcreditados: number,
    public readonly puntosGastados: number,
    public readonly distribucionOperaciones: {
      compra: number;
      devolucion: number;
      anulacion: number;
      ajuste: number;
    },
  ) {}
}
