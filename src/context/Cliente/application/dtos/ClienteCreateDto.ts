export class CreateClienteDto {
  dni: string;
  categoriaId: string;
  idFidely: number | null;
  tarjetaFidely: string | null;
  fechaBaja?: string | null;
}
