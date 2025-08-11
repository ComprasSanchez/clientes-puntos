import { UseCaseResponse } from '@infrastructure/integrations/PLEX/dto/usecase-response.dto';
import { Injectable } from '@nestjs/common';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

@Injectable()
export class FidelizarProductoPlexAdapater {
  constructor() {}

  handle(xml: string): UseCaseResponse {
    const parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
    });
    parser.parse(xml) as unknown;

    // 7. Armar XML de respuesta con el mapper
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
    });
    const xmlObj = {
      RespuestaFidelyGB: {
        respCode: '0',
        respMsg: 'OK',
      },
    };
    const xmlString = builder.build(xmlObj);

    return {
      response: `<?xml version="1.0" encoding="utf-8"?>\n${xmlString}`,
      dto: xmlObj,
    };
  }
}
