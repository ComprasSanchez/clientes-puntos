// dtos/plex-consultar-cliente.response.dto.ts

import { ConsultarClienteDomainResponse } from '../interfaces/consultar-cliente-domain.interface';

export interface PlexConsultarClienteResponseDto {
  respCode: string;
  respMsg: string;
  cliente: {
    idClienteFidely: string;
    campania: string;
    categoria: number;
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
    redefinicionPunto: {
      porcentualCompra: number;
      porcentualPunto: number;
    };
  };
}

export class PlexConsultarClienteResponseMapper {
  static fromDomain(
    domain: ConsultarClienteDomainResponse,
  ): PlexConsultarClienteResponseDto {
    return {
      respCode: '0',
      respMsg: 'OK',
      cliente: {
        idClienteFidely: domain.idClienteFidely,
        campania: domain.campania,
        categoria: domain.categoria,
        nombre: domain.nombre,
        apellido: domain.apellido,
        fecNac: domain.fecNac || '',
        dni: domain.dni,
        telefono: domain.telefono || '',
        celular: domain.celular || '',
        direccion: domain.direccion || '',
        email: domain.email || '',
        sexo: domain.sexo || '',
        codPostal: domain.codPostal || '',
        puntos: domain.puntos,
        valorPunto: domain.valorPunto,
        redefinicionPunto: {
          porcentualCompra: domain.porcentualCompra || 0,
          porcentualPunto: domain.porcentualPunto || 0,
        },
      },
    };
  }

  static toXml(dto: PlexConsultarClienteResponseDto): any {
    return {
      RespuestaFidelyGb: {
        RespCode: dto.respCode,
        RespMsg: dto.respMsg,
        Cliente: {
          IdClienteFidely: dto.cliente.idClienteFidely,
          Campania: dto.cliente.campania,
          Categoria: dto.cliente.categoria,
          Nombre: dto.cliente.nombre,
          Apellido: dto.cliente.apellido,
          FecNac: dto.cliente.fecNac,
          Dni: dto.cliente.dni,
          Telefono: dto.cliente.telefono,
          Celular: dto.cliente.celular,
          Direccion: dto.cliente.direccion,
          Email: dto.cliente.email,
          Sexo: dto.cliente.sexo,
          CodPostal: dto.cliente.codPostal,
          Puntos: dto.cliente.puntos.toString(),
          ValorPunto: dto.cliente.valorPunto.toString(),
          RedefinicionPunto: {
            PorcentualCompra:
              dto.cliente.redefinicionPunto.porcentualCompra.toString(),
            PorcentualPunto:
              dto.cliente.redefinicionPunto.porcentualPunto.toString(),
          },
        },
      },
    };
  }
}
