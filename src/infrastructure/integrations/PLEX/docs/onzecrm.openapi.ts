/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/infrastructure/docs/onzecrm.openapi.ts
import type { OpenAPIObject } from '@nestjs/swagger';

export function buildOnzeOpenApi(): Partial<OpenAPIObject> {
  return {
    info: {
      title: 'OnzeCRM Integration',
      version: '1.0.0',
      description:
        'Endpoint XML multipropósito vía CodAccion (Auth: CodAccion=1)',
    },
    tags: [{ name: 'OnzeCRM' }],
    paths: {
      '/onzecrm': {
        post: {
          tags: ['OnzeCRM'],
          summary: 'Procesa MensajeFidelyGb (XML) según CodAccion',
          description:
            'Recibe <MensajeFidelyGb> en XML con <CodAccion> y procesa según la acción indicada.',
          operationId: 'onzecrm_post',
          // Hacemos pública la operación en la doc. Si querés exigir bearer, remové esta línea.
          security: [],

          requestBody: {
            required: true,
            content: {
              'application/xml': {
                // ⬇⬇⬇ FIX: schema como objeto XML con root definido
                schema: {
                  type: 'object',
                  xml: { name: 'MensajeFidelyGb' },
                  properties: {},
                  additionalProperties: true,
                },
                examples: {
                  // ───────────────────────────────────────────────────────────
                  // Auth (1)
                  // ───────────────────────────────────────────────────────────
                  AuthRequest: {
                    summary: 'Auth (CodAccion=1)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <CodAccion>1</CodAccion>
  <auth>
    <user>usuario_demo</user>
    <pass>secreto_demo</pass>
  </auth>
</MensajeFidelyGb>`,
                  },

                  // ───────────────────────────────────────────────────────────
                  // Fidelizar Cliente (100–103)
                  // ───────────────────────────────────────────────────────────
                  FidelizarClienteNuevo: {
                    summary: 'Fidelizar Cliente (CodAccion=100 — Nuevo)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <Proveedor>FIDELYGB</Proveedor>
  <CodAccion>100</CodAccion>
  <Cliente>
    <Campania>Campaña Primavera</Campania>
    <Categoria>Gold</Categoria>
    <NroTarjeta>1234567890</NroTarjeta>
    <DNI>30111222</DNI>
    <Nombre>Juan</Nombre>
    <Apellido>Pérez</Apellido>
    <Sexo>M</Sexo>
    <FecNac>1985-06-15</FecNac>
    <Email>juan.perez@example.com</Email>
    <Telefono>3515555555</Telefono>
    <Direccion>Av. Siempre Viva 742</Direccion>
    <CodPostal>5000</CodPostal>
    <Localidad>Córdoba</Localidad>
    <Provincia>Córdoba</Provincia>
  </Cliente>
</MensajeFidelyGb>`,
                  },
                  FidelizarClienteModificar: {
                    summary: 'Fidelizar Cliente (CodAccion=101 — Modificar)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <Proveedor>FIDELYGB</Proveedor>
  <CodAccion>101</CodAccion>
  <Cliente>
    <IDClienteFidely>123</IDClienteFidely>
    <Email>nuevo@email.com</Email>
    <Telefono>3514444444</Telefono>
  </Cliente>
</MensajeFidelyGb>`,
                  },
                  FidelizarClienteReemplazo: {
                    summary:
                      'Fidelizar Cliente (CodAccion=102 — Reemplazar Tarjeta)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <Proveedor>FIDELYGB</Proveedor>
  <CodAccion>102</CodAccion>
  <Cliente>
    <IDClienteFidely>123</IDClienteFidely>
    <NroTarjetaAnterior>9876543210</NroTarjetaAnterior>
    <NroTarjeta>1122334455</NroTarjeta>
  </Cliente>
</MensajeFidelyGb>`,
                  },
                  FidelizarClienteVirtual: {
                    summary:
                      'Fidelizar Cliente (CodAccion=103 — Tarjeta Virtual)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <Proveedor>FIDELYGB</Proveedor>
  <CodAccion>103</CodAccion>
  <Cliente>
    <DNI>30111222</DNI>
    <Nombre>Juan</Nombre>
    <Apellido>Pérez</Apellido>
  </Cliente>
</MensajeFidelyGb>`,
                  },

                  // ───────────────────────────────────────────────────────────
                  // Fidelizar Venta (200–202)
                  // ───────────────────────────────────────────────────────────
                  FidelizarVenta: {
                    summary: 'Fidelizar Venta (CodAccion=200 — Venta)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <Proveedor>FIDELYGB</Proveedor>
  <CodAccion>200</CodAccion>
  <Venta>
    <NroTarjeta>1122334455</NroTarjeta>
    <ImporteTotal>1500.00</ImporteTotal>
    <ValorCanjePunto>10.00</ValorCanjePunto>
    <PuntosCanjeados>50</PuntosCanjeados>
    <IdComprobante>987</IdComprobante>
    <NroComprobante>A12345</NroComprobante>
    <FechaComprobante>2025-09-02</FechaComprobante>
    <Productos>
      <IdProducto>ABC001</IdProducto>
      <Cantidad>2</Cantidad>
      <Precio>500.00</Precio>
    </Productos>
    <Productos>
      <IdProducto>XYZ002</IdProducto>
      <Cantidad>1</Cantidad>
      <Precio>500.00</Precio>
    </Productos>
  </Venta>
</MensajeFidelyGb>`,
                  },
                  FidelizarDevolucion: {
                    summary: 'Fidelizar Venta (CodAccion=201 — Devolución)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <Proveedor>FIDELYGB</Proveedor>
  <CodAccion>201</CodAccion>
  <Venta>
    <NroTarjeta>1122334455</NroTarjeta>
    <IdComprobante>987</IdComprobante>
    <NroComprobante>A12345</NroComprobante>
    <FechaComprobante>2025-09-02</FechaComprobante>
    <Productos>
      <IdProducto>ABC001</IdProducto>
      <Cantidad>1</Cantidad>
      <Precio>500.00</Precio>
    </Productos>
  </Venta>
</MensajeFidelyGb>`,
                  },
                  FidelizarAnularMovimiento: {
                    summary:
                      'Fidelizar Venta (CodAccion=202 — Anular Movimiento)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <Proveedor>FIDELYGB</Proveedor>
  <CodAccion>202</CodAccion>
  <Venta>
    <IdMovimiento>12345</IdMovimiento>
  </Venta>
</MensajeFidelyGb>`,
                  },

                  // ───────────────────────────────────────────────────────────
                  // Consultar Cliente (300)
                  // ───────────────────────────────────────────────────────────
                  ConsultarCliente: {
                    summary:
                      'Consultar Cliente (CodAccion=300 — por NroTarjeta)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <Proveedor>FIDELYGB</Proveedor>
  <CodAccion>300</CodAccion>
  <NroTarjeta>1122334455</NroTarjeta>
</MensajeFidelyGb>`,
                  },

                  // ───────────────────────────────────────────────────────────
                  // Consultar Estadística Cliente (301)
                  // ───────────────────────────────────────────────────────────
                  ConsultarEstadisticaCliente: {
                    summary:
                      'Consultar Estadística Cliente (CodAccion=301 — por DNI)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <Proveedor>FIDELYGB</Proveedor>
  <CodAccion>301</CodAccion>
  <DNI>30111222</DNI>
</MensajeFidelyGb>`,
                  },

                  // ───────────────────────────────────────────────────────────
                  // Fidelizar Productos (500–504)
                  // ───────────────────────────────────────────────────────────
                  FidelizarProductosNuevo: {
                    summary: 'Fidelizar Productos (CodAccion=500 — Nuevo)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <Proveedor>FIDELYGB</Proveedor>
  <CodAccion>500</CodAccion>
  <IdRed>1</IdRed>
  <Productos>
    <IdProducto>ABC001</IdProducto>
    <Producto>Paracetamol</Producto>
    <Presentacion>500mg x 10</Presentacion>
    <Costo>200.00</Costo>
    <Precio>350.00</Precio>
    <Clasificadores>
      <IdTipoClasificador>1</IdTipoClasificador>
      <IdClasificador>10</IdClasificador>
      <Nombre>Laboratorio Demo</Nombre>
    </Clasificadores>
  </Productos>
</MensajeFidelyGb>`,
                  },
                  FidelizarProductosEdicion: {
                    summary: 'Fidelizar Productos (CodAccion=501 — Edición)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <Proveedor>FIDELYGB</Proveedor>
  <CodAccion>501</CodAccion>
  <IdRed>1</IdRed>
  <Productos>
    <IdProducto>ABC001</IdProducto>
    <Precio>370.00</Precio>
  </Productos>
</MensajeFidelyGb>`,
                  },
                  FidelizarProductosBaja: {
                    summary: 'Fidelizar Productos (CodAccion=502 — Baja)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <Proveedor>FIDELYGB</Proveedor>
  <CodAccion>502</CodAccion>
  <IdRed>1</IdRed>
  <Productos>
    <IdProducto>ABC001</IdProducto>
  </Productos>
</MensajeFidelyGb>`,
                  },
                  FidelizarProductosReactivacion: {
                    summary:
                      'Fidelizar Productos (CodAccion=503 — Reactivación)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <Proveedor>FIDELYGB</Proveedor>
  <CodAccion>503</CodAccion>
  <IdRed>1</IdRed>
  <Productos>
    <IdProducto>ABC001</IdProducto>
  </Productos>
</MensajeFidelyGb>`,
                  },
                  FidelizarProductosPrecios: {
                    summary:
                      'Fidelizar Productos (CodAccion=504 — Actualización de precios)',
                    value: `<?xml version="1.0" encoding="utf-8"?>
<MensajeFidelyGb>
  <Proveedor>FIDELYGB</Proveedor>
  <CodAccion>504</CodAccion>
  <IdRed>1</IdRed>
  <Productos>
    <IdProducto>ABC001</IdProducto>
    <Costo>210.00</Costo>
    <Precio>360.00</Precio>
  </Productos>
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
                  // ⬇⬇⬇ FIX: schema como objeto XML con root definido
                  schema: {
                    type: 'object',
                    xml: { name: 'RespuestaFidelyGb' },
                    properties: {},
                    additionalProperties: true,
                  },
                  examples: {
                    // ─────────────────────────────────────────────────────────
                    // Auth (1)
                    // ─────────────────────────────────────────────────────────
                    AuthOkEpochSeconds: {
                      summary: 'Auth OK (exp en segundos — recomendado)',
                      value: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>0</RespCode>
  <RespMsg>OK</RespMsg>
  <auth>
    <token>eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIi...</token>
    <exp>1756813798</exp>
  </auth>
</RespuestaFidelyGb>`,
                    },
                    AuthOkIsoLike: {
                      summary: 'Auth OK (exp como fecha — variante opcional)',
                      value: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>0</RespCode>
  <RespMsg>OK</RespMsg>
  <auth>
    <token>eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIi...</token>
    <exp>2025-09-02 08:49</exp>
  </auth>
</RespuestaFidelyGb>`,
                    },

                    // ─────────────────────────────────────────────────────────
                    // Fidelizar Venta (200–202)
                    // ─────────────────────────────────────────────────────────
                    FidelizarVentaResponse: {
                      summary: 'Respuesta Fidelizar Venta (CodAccion=200)',
                      value: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>0</RespCode>
  <RespMsg>OK</RespMsg>
  <Venta>
    <IdMovimiento>12345</IdMovimiento>
    <PuntosDescontados>50</PuntosDescontados>
    <PuntosAcreditados>100</PuntosAcreditados>
    <TotalPuntosCliente>1050</TotalPuntosCliente>
  </Venta>
</RespuestaFidelyGb>`,
                    },
                    FidelizarDevolucionResponse: {
                      summary: 'Respuesta Fidelizar Devolución (CodAccion=201)',
                      value: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>0</RespCode>
  <RespMsg>OK</RespMsg>
  <Venta>
    <IdMovimiento>12346</IdMovimiento>
    <PuntosDescontados>0</PuntosDescontados>
    <PuntosAcreditados>-50</PuntosAcreditados>
    <TotalPuntosCliente>950</TotalPuntosCliente>
  </Venta>
</RespuestaFidelyGb>`,
                    },
                    FidelizarAnularMovimientoResponse: {
                      summary:
                        'Respuesta Fidelizar Anular Movimiento (CodAccion=202)',
                      value: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>0</RespCode>
  <RespMsg>OK</RespMsg>
  <Venta>
    <IdMovimiento>12345</IdMovimiento>
    <PuntosDescontados>0</PuntosDescontados>
    <PuntosAcreditados>0</PuntosAcreditados>
    <TotalPuntosCliente>1000</TotalPuntosCliente>
  </Venta>
</RespuestaFidelyGb>`,
                    },

                    // ─────────────────────────────────────────────────────────
                    // Consultar Cliente (300)
                    // ─────────────────────────────────────────────────────────
                    ConsultarClienteOk: {
                      summary:
                        'Respuesta OK — Cliente encontrado (CodAccion=300)',
                      value: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>0</RespCode>
  <RespMsg>OK</RespMsg>
  <Cliente>
    <IdClienteFidely>123</IdClienteFidely>
    <Campania>Campaña Primavera</Campania>
    <Categoria>Gold</Categoria>
    <Nombre>Juan</Nombre>
    <Apellido>Pérez</Apellido>
    <FecNac>1985-06-15</FecNac>
    <Dni>30111222</Dni>
    <Telefono>3515555555</Telefono>
    <Celular>3515111111</Celular>
    <Direccion>Av. Siempre Viva 742</Direccion>
    <Email>juan.perez@example.com</Email>
    <Sexo>M</Sexo>
    <CodPostal>5000</CodPostal>
    <Puntos>1050</Puntos>
    <ValorPunto>10.00</ValorPunto>
    <RedefinicionPunto>
      <PorcentualCompra>0.3</PorcentualCompra>
      <PorcentualPunto>0.7</PorcentualPunto>
    </RedefinicionPunto>
  </Cliente>
</RespuestaFidelyGb>`,
                    },
                    ConsultarClienteNoEncontrado: {
                      summary:
                        'Respuesta Error — Cliente no encontrado (CodAccion=300)',
                      value: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>1</RespCode>
  <RespMsg>Cliente no encontrado para el NroTarjeta indicado</RespMsg>
</RespuestaFidelyGb>`,
                    },

                    // ─────────────────────────────────────────────────────────
                    // Consultar Estadística Cliente (301)
                    // ─────────────────────────────────────────────────────────
                    ConsultarEstadisticaClienteOk: {
                      summary:
                        'Respuesta OK — Estadísticas encontradas (CodAccion=301)',
                      value: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>0</RespCode>
  <RespMsg>OK</RespMsg>
  <Cliente>
    <IdClienteFidely>123</IdClienteFidely>
    <Categoria>Gold</Categoria>
    <SaldoPuntos>1050</SaldoPuntos>
    <PesosAhorroUltimoMes>2500.00</PesosAhorroUltimoMes>
    <PesosAhorro3Meses>7300.00</PesosAhorro3Meses>
    <PuntosUltimoMes>200</PuntosUltimoMes>
    <Puntos3Meses>600</Puntos3Meses>
    <MovimientosUltimoMes>15</MovimientosUltimoMes>
    <Movimientos3Meses>42</Movimientos3Meses>
  </Cliente>
</RespuestaFidelyGb>`,
                    },
                    ConsultarEstadisticaClienteNoEncontrado: {
                      summary:
                        'Respuesta Error — Cliente sin estadísticas (CodAccion=301)',
                      value: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>1</RespCode>
  <RespMsg>No existen estadísticas para el DNI indicado</RespMsg>
</RespuestaFidelyGb>`,
                    },

                    // ─────────────────────────────────────────────────────────
                    // Fidelizar Productos (500–504)
                    // ─────────────────────────────────────────────────────────
                    FidelizarProductosResponseOk: {
                      summary:
                        'Respuesta OK — Fidelizar Productos (CodAccion=500–504)',
                      value: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>0</RespCode>
  <RespMsg>OK</RespMsg>
</RespuestaFidelyGb>`,
                    },
                    FidelizarProductosResponseError: {
                      summary:
                        'Respuesta Error — Fidelizar Productos (CodAccion=500–504)',
                      value: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>1</RespCode>
  <RespMsg>Error al procesar productos</RespMsg>
</RespuestaFidelyGb>`,
                    },
                  },
                },
              },
            },

            '400': {
              description:
                'Solicitud inválida (XML mal formado o faltan campos)',
              content: {
                'application/xml': {
                  // ⬇⬇⬇ FIX: schema objeto con root
                  schema: {
                    type: 'object',
                    xml: { name: 'RespuestaFidelyGb' },
                    properties: {},
                    additionalProperties: true,
                  },
                  example: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>1</RespCode>
  <RespMsg>XML inválido o credenciales faltantes</RespMsg>
</RespuestaFidelyGb>`,
                },
              },
            },

            '401': {
              description: 'Credenciales inválidas',
              content: {
                'application/xml': {
                  // ⬇⬇⬇ FIX: schema objeto con root
                  schema: {
                    type: 'object',
                    xml: { name: 'RespuestaFidelyGb' },
                    properties: {},
                    additionalProperties: true,
                  },
                  example: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>1</RespCode>
  <RespMsg>Usuario o contraseña incorrectos</RespMsg>
</RespuestaFidelyGb>`,
                },
              },
            },

            '500': {
              description: 'Error inesperado',
              content: {
                'application/xml': {
                  // ⬇⬇⬇ FIX: schema objeto con root
                  schema: {
                    type: 'object',
                    xml: { name: 'RespuestaFidelyGb' },
                    properties: {},
                    additionalProperties: true,
                  },
                  example: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>1</RespCode>
  <RespMsg>Error</RespMsg>
</RespuestaFidelyGb>`,
                },
              },
            },
          },
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
  // Merge controlado de secciones conocidas
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

function pickPaths(doc: OpenAPIObject, allow: RegExp[]): OpenAPIObject {
  const filtered: OpenAPIObject = {
    ...doc,
    paths: {},
    tags: doc.tags?.filter((t) => /onze|xml|plex/i.test((t as any).name ?? '')),
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
  // 🔒 Filtrar solo el endpoint XML
  return pickPaths(full, [/^\/onzecrm(\/.*)?$/]);
}
