export class MetricasSaldo {
  constructor(
    public readonly saldoTotal: number,
    public readonly promedioPorUsuario: number,
    public readonly totalUsuarios: number,
    public readonly usuariosConSaldo: number,
  ) {}

  // Métodos auxiliares, si querés calcular proporciones, etc.
  porcentajeUsuariosConSaldo(): number {
    if (this.totalUsuarios === 0) return 0;
    return (this.usuariosConSaldo / this.totalUsuarios) * 100;
  }
}
