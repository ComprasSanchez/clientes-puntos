// dtos/plex-consultar-cliente.response.dto.ts

import { ConsultarClienteDomainResponse } from '../interfaces/consultar-cliente-domain.interface';

export interface PlexConsultarClienteResponseDto {
  respCode: string;
  respMsg: string;
  cliente: {
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
        fecNac: domain.fecNac,
        dni: domain.dni,
        telefono: domain.telefono,
        celular: domain.celular,
        direccion: domain.direccion,
        email: domain.email,
        sexo: domain.sexo,
        codPostal: domain.codPostal,
        puntos: domain.puntos,
        valorPunto: domain.valorPunto,
        redefinicionPunto: {
          porcentualCompra: domain.porcentualCompra,
          porcentualPunto: domain.porcentualPunto,
        },
      },
    };
  }

  static toXml(dto: PlexConsultarClienteResponseDto): any {
    return {
      RespuestaFidelyGb: {
        RespCode: { _text: dto.respCode },
        RespMsg: { _text: dto.respMsg },
        Cliente: {
          IdClienteFidely: { _text: dto.cliente.idClienteFidely },
          Campania: { _text: dto.cliente.campania },
          Categoria: { _text: dto.cliente.categoria },
          Nombre: { _text: dto.cliente.nombre },
          Apellido: { _text: dto.cliente.apellido },
          FecNac: { _text: dto.cliente.fecNac },
          Dni: { _text: dto.cliente.dni },
          Telefono: { _text: dto.cliente.telefono },
          Celular: { _text: dto.cliente.celular },
          Direccion: { _text: dto.cliente.direccion },
          Email: { _text: dto.cliente.email },
          Sexo: { _text: dto.cliente.sexo },
          CodPostal: { _text: dto.cliente.codPostal },
          Puntos: { _text: dto.cliente.puntos.toString() },
          ValorPunto: { _text: dto.cliente.valorPunto.toString() },
          RedefinicionPunto: {
            PorcentualCompra: {
              _text: dto.cliente.redefinicionPunto.porcentualCompra.toString(),
            },
            PorcentualPunto: {
              _text: dto.cliente.redefinicionPunto.porcentualPunto.toString(),
            },
          },
        },
      },
    };
  }
}
