/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/infrastructure/docs/onzecrm.openapi.ts
import type { OpenAPIObject } from '@nestjs/swagger';

function pickPaths(doc: OpenAPIObject, allow: RegExp[]): OpenAPIObject {
  const filtered: OpenAPIObject = {
    ...doc,
    paths: {},
    tags: doc.tags?.filter((t) => /onze|xml|plex/i.test(t.name ?? '')),
  };

  for (const [path, item] of Object.entries(doc.paths ?? {})) {
    if (allow.some((rx) => rx.test(path))) {
      (filtered.paths as any)[path] = item;
    }
  }

  return filtered;
}

export function buildOnzeDoc(base: OpenAPIObject): OpenAPIObject {
  const full = mergeOnzeInto(base);
  // 🔒 filtrar solo el endpoint xml
  return pickPaths(full, [/^\/onzecrm(\/.*)?$/]);
}

export function buildOnzeOpenApi(): Partial<OpenAPIObject> {
  return {
    info: {
      title: 'OnzeCRM Integration',
      version: '1.0.0',
      description: 'Endpoint XML multipropósito vía CodAccion',
    },
    tags: [{ name: 'OnzeCRM' }],
    paths: {
      '/onzecrm': {
        post: {
          tags: ['OnzeCRM'],
          summary: 'Procesa MensajeFidelyGb (XML) según CodAccion',
          operationId: 'onzecrm_post',
          requestBody: {
            required: true,
            content: {
              'application/xml': {
                schema: { type: 'string' },
                examples: {
                  FidelizarVenta: {
                    summary: 'Fidelizar Venta (CodAccion=1001)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <CodAccion>1001</CodAccion>
  <!-- ... -->
</MensajeFidelyGb>`,
                  },
                  ConsultarCliente: {
                    summary: 'Consultar Cliente (CodAccion=2001)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <CodAccion>2001</CodAccion>
  <!-- ... -->
</MensajeFidelyGb>`,
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/xml': {
                  schema: { type: 'string' },
                  examples: {
                    ok: {
                      value: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>0</RespCode>
  <RespMsg>OK</RespMsg>
</RespuestaFidelyGb>`,
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Error',
              content: {
                'application/xml': {
                  schema: { type: 'string' },
                  example: `<?xml version="1.0" encoding="utf-8"?><RespuestaFidelyGb><RespCode>1</RespCode><RespMsg>Error</RespMsg></RespuestaFidelyGb>`,
                },
              },
            },
          },
          // Si querés exigir auth en esta doc, agregá:
          security: [{ bearer: [] }],
        },
      },
    },
    components: {
      securitySchemes: {
        bearer: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  };
}

export function mergeOnzeInto(doc: OpenAPIObject): OpenAPIObject {
  const extra = buildOnzeOpenApi();
  // merge “amigable”: combiná secciones conocidas manualmente
  doc.info = { ...doc.info, ...extra.info };
  doc.tags = [...(doc.tags ?? []), ...(extra.tags ?? [])];
  doc.paths = { ...(doc.paths ?? {}), ...(extra.paths ?? {}) };
  doc.components = {
    ...(doc.components ?? {}),
    ...(extra.components ?? {}),
    securitySchemes: {
      ...((doc.components ?? {}).securitySchemes ?? {}),
      ...((extra.components ?? {}).securitySchemes ?? {}),
    },
  } as any;
  return doc;
}
