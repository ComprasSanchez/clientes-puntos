// core/interfaces/consultar-cliente-domain-response.interface.ts

export interface ConsultarClienteDomainResponse {
  idClienteFidely: string;
  campania: string;
  categoria: string;
  nombre: string;
  apellido: string;
  fecNac: string;
  dni: string;
  telefono: string;
  celular: string;
  direccion: string;
  email: string;
  sexo: string;
  codPostal: string;
  puntos: number;
  valorPunto: number;
  porcentualCompra: number;
  porcentualPunto: number;
}
