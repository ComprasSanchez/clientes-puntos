// core/interfaces/consultar-cliente-domain-response.interface.ts

export interface ConsultarClienteDomainResponse {
  idClienteFidely: string;
  campania: string;
  categoria: number;
  nombre: string;
  apellido: string;
  fecNac: string | null;
  dni: string;
  telefono: string | null;
  celular: string | null;
  direccion: string | null;
  email: string | null;
  sexo: string | null;
  codPostal: string | null;
  puntos: number;
  valorPunto: number;
  porcentualCompra: number | null;
  porcentualPunto: number | null;
}
