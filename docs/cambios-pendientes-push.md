# Cambios pendientes de push — rama `dev`

> 11 commits locales no pusheados a `origin/dev`.  
> Resumen de qué se modificó y por qué.

---

## 1. Nuevo endpoint `PATCH /clientes/touch`

**Archivos:**
- `src/infrastructure/integrations/CLIENTES/controller/clientes-upsert.controller.ts`
- `src/infrastructure/integrations/CLIENTES/services/clientes-upsert-from-plex.service.ts`
- `src/context/Cliente/core/repository/ClienteRepository.ts`
- `src/context/Cliente/infrastructure/persistence/ClienteRepository/ClienteRepositoryImpl.ts`

**Qué hace:**  
Recibe un DNI por body y actualiza el campo `updated_at` del cliente en la base de datos al timestamp actual, sin modificar ningún otro dato.

**Por qué:**  
PLEX detecta cambios en clientes comparando `updated_at`. Al tocar este campo se fuerza que PLEX re-sincronice ese cliente en su próxima pasada, sin necesidad de modificar datos reales.

**Detalles técnicos:**
- Método HTTP: `PATCH`, retorna `204 No Content`.
- La query normaliza los ceros a la izquierda del DNI en ambos lados (el parámetro recibido y el valor guardado en BD) usando `REGEXP_REPLACE(dni, '^0+', '')`, para que el match funcione independientemente del formato.
- Documentado en Swagger con `@ApiOperation`, `@ApiBody` y `@ApiResponse`.

---

## 2. Fix en lógica de gasto de puntos (`AjusteHandler`)

**Archivo:** `src/context/Puntos/application/handlers/AjusteHandler.ts`

**Qué hacía antes:**  
Usaba `instrucciones.debitos?.[0]?.cantidad ?? req.puntos` con nullish coalescing. El problema: si el objeto `CantidadPuntos` existía pero tenía `value = 0`, se tomaba ese cero como total válido en lugar de caer al fallback `req.puntos`.

**Qué hace ahora:**  
Antes de usar el débito de las instrucciones, verifica explícitamente que `debitoValor > 0`. Si es cero o no existe, usa `req.puntos` como fallback.

**Además:**  
Se agregó un log con `Logger` de NestJS que imprime `tipo`, `req.puntos`, el valor del débito y el `total` resultante — útil para diagnosticar futuros problemas sin necesidad de agregar logs temporales.

---

## 3. Fix en alta de cliente existente — comportamiento idempotente (`FidelizarClienteAdapter`)

**Archivos:**
- `src/infrastructure/integrations/PLEX/use-cases/FidelizarCliente/adapters/fidelizar-cliente.adapter.ts`
- `src/infrastructure/integrations/PLEX/use-cases/FidelizarCliente/dtos/fidelizar-cliente.request.dto.ts`

**Qué hacía antes:**  
Si PLEX mandaba `codAccion = NUEVO` o `TARJETA_VIRTUAL` y el DNI ya existía en la base de datos, se lanzaba un error 500: `"DNI ya existe; para actualizar use codAccion 101 o 102"`.

**Qué hace ahora:**  
Si el DNI ya existe, devuelve silenciosamente el cliente existente (`domainResponse = existingByDni; break`) sin lanzar error. Comportamiento idempotente: crear un cliente que ya existe es un no-op.

**Normalización de DNI en el mapper:**  
Al mapear el DNI que viene de PLEX se aplica `.replace(/^0+/, '')` para quitar ceros a la izquierda antes de persistir o buscar, evitando duplicados por diferencia de formato (ej. `00012345678` vs `12345678`).

---

## 4. Fix de indentación en `operacion.entity.ts`

**Archivo:** `src/context/Puntos/infrastructure/entities/operacion.entity.ts`

Corrección cosmética: la columna `idComprobante` estaba sin indentación dentro de la clase. No hay cambio funcional.

---

## Resumen de archivos modificados

| Archivo | Tipo de cambio |
|---|---|
| `ClienteRepository.ts` | Nueva firma `touchByDni` en la interfaz |
| `ClienteRepositoryImpl.ts` | Implementación de `touchByDni` con normalización de DNI |
| `clientes-upsert.controller.ts` | Nuevo endpoint `PATCH /touch` con Swagger |
| `clientes-upsert-from-plex.service.ts` | Nuevo método `touch(dni)` delegando al repo |
| `AjusteHandler.ts` | Fix fallback gasto + Logger |
| `fidelizar-cliente.adapter.ts` | Alta idempotente: DNI existente ya no tira error |
| `fidelizar-cliente.request.dto.ts` | Normalización de DNI en el mapper de PLEX |
| `operacion.entity.ts` | Fix de indentación solamente |
