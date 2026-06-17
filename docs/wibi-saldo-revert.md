# Cómo revertir: saldo desde WIBI

## Contexto

El endpoint `GET /puntos/me` originalmente consultaba el saldo en tiempo real a la API externa de **WIBI** (sistema de fidelización). Fue reemplazado para leer de la tabla local `saldo_cliente`, que se mantiene actualizada por el servicio de sync `WibiSyncService`.

---

## Qué se cambió

**Archivo:** `src/context/Puntos/infrastructure/controllers/puntos-me.controller.ts`

| Antes (WIBI) | Después (local) |
|---|---|
| Inyectaba `PuntosServiceWIBI` | Inyecta `ObtenerSaldo` via `OBTENER_SALDO_SERVICE` |
| Llamaba `this.resolveSaldoActual(nroTarjeta)` | Llama `this.obtenerSaldo.run(puntosClienteId)` |
| Tiraba `NotFoundException` si el cliente no tenía `nroTarjeta` | No requiere `nroTarjeta` para el saldo |
| Tiraba `BadGatewayException` si WIBI fallaba | No hay dependencia externa para el saldo |

---

## Pasos para revertir

1. **Descomentar** el import de `BadGatewayException` en NestJS.

2. **Descomentar** el import de `PuntosServiceWIBI`:
   ```ts
   import { PuntosServiceWIBI } from '../adapters/PuntosServiceWIBI/PuntosServiceWIBI';
   ```

3. **Reemplazar** la inyección en el constructor:
   ```ts
   // Quitar:
   @Inject(OBTENER_SALDO_SERVICE) private readonly obtenerSaldo: ObtenerSaldo,

   // Restaurar:
   private readonly wibiService: PuntosServiceWIBI,
   ```

4. **Restaurar** la lógica de saldo en `getSaldoActual`:
   ```ts
   // Quitar:
   const saldoActual = await this.obtenerSaldo.run(puntosClienteId);

   // Restaurar (requiere nroTarjeta):
   if (!nroTarjeta) {
     throw new NotFoundException(`El cliente ${puntosClienteId} no posee NroTarjeta para consulta WIBI`);
   }
   const saldoActual = await this.resolveSaldoActual(nroTarjeta);
   ```

5. **Descomentar** el método privado `resolveSaldoActual`.

6. En el módulo `puntos.module.ts`, `PuntosServiceWIBI` ya está registrado como provider — no requiere cambios ahí.

---

## Variables de entorno necesarias para WIBI

```
WIBI_API_URL=https://api.wibi.com.ar/onzecrm
WIBI_TOKEN_URL=https://api.wibi.com.ar/onzecrm/token
WIBI_API_KEY=...
WIBI_USER=...
WIBI_PASS=...
```

---

## Diferencia de comportamiento

| Aspecto | WIBI (tiempo real) | Local (`saldo_cliente`) |
|---|---|---|
| Latencia | ~200-500ms (HTTP externo) | ~5ms (query local) |
| Dependencia | Requiere que WIBI esté online | Sin dependencia externa |
| Actualización | Siempre fresco | Depende del sync (`WibiSyncService`) |
| Fallo posible | `502 Bad Gateway` si WIBI cae | Devuelve `0` si el cliente aún no tiene registro |
