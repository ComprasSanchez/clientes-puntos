export type ClientesFsaDocumentoDto = {
  tipo: string;
  numero: string;
};

export type ClientesFsaClienteDto = {
  id: string;
  nnro_documento?: string | null;
  nro_documento?: string | null;
  documento: ClientesFsaDocumentoDto;
  nombre?: string | null;
  apellido?: string | null;
  sexo?: string | null;
  estado?: string | null;
  fechaNacimiento?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  codPostal?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  domicilio?: {
    calle?: string | null;
    numero?: string | null;
    ciudad?: string | null;
    provincia?: string | null;
    codPostal?: string | null;
  } | null;
  contactos?: Array<{
    tipo?: string | null;
    valor?: string | null;
    descripcion?: string | null;
    principal?: boolean | string | number | null;
    verificado?: boolean | string | number | null;
  }>;
};

export type ClientesFsaMeDto = ClientesFsaClienteDto & {
  fuentesDatos?: Array<{
    sistema?: string;
    extId?: string;
  }>;
};

export type ClientesFsaClienteIdDto = {
  id: string;
};

export type ClientesFsaClientesBulkRequestDto = {
  documentos: string[];
};

export type ClientesFsaClientesBulkResponseDto = {
  items: ClientesFsaClienteDto[];
};

export type ClientesFsaUpsertVerificacionRequest = {
  tipoDocumento: string;
  nroDocumento: string;
  nombre: string;
  apellido: string;
  sexo?: string | null;
  fechaNacimiento?: string | null;
  email?: string | null;
  telefono?: string | null;
  domicilio?: {
    calle: string;
    numero?: string | null;
    ciudad: string;
    provincia: string;
    codPostal?: string | null;
  } | null;
};
