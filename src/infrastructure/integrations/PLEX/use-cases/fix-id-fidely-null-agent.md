# Problema: id_fidely almacenado como null y Error TypeError: toString

He analizado el flujo y realizado varios intentos de solución sin éxito hasta el momento. El problema persiste en dos frentes:

1. **id_fidely sigue siendo null:** A pesar de intentar omitir la columna en el `INSERT` y de intentar forzar el uso de `nextval()` en el `values()`, Postgres sigue almacenando `null`. Sospecho que la cláusula `ON CONFLICT` o la forma en que TypeORM construye la query está enviando valores explícitos que anulan los defaults.
2. **Error de crash corregido pero persistente:** El error `Cannot read properties of undefined (reading 'toString')` sigue apareciendo. He añadido guardas en el adaptador y en el mapper, pero esto indica que el error ocurre en un punto que todavía no hemos identificado del flujo (posiblemente antes de las guardas o en un servicio relacionado).

## Resolución Final (ÉXITO)

- **id_fidely:** Se solucionó mediante el uso de **SQL Directo (Raw Query)** en `ClienteRepositoryImpl`. Esto asegura que la secuencia `nextval()` sea llamada explícitamente por Postgres, evitando que el ORM (TypeORM) envíe valores `null` o `undefined` que anulen el default de la base de datos.
- **toString Crash:** Se identificó que la causa era un desajuste en el conteo de parámetros en la query SQL raw (cuando se usaba la secuencia, el array de parámetros era más corto que los placeholders `$1...$N`). El driver de BD fallaba al intentar acceder a parámetros faltantes. Se corrigió con una **indexación dinámica de parámetros**.
- **Debug Robusto:** Se añadió un bloque `try/catch` global en `PlexController` que devuelve el **Stack Trace** (`[STACK]`) en la respuesta XML en caso de cualquier error futuro, facilitando el diagnóstico rápido.

## Verificación Exitosa
El usuario confirmó la creación exitosa del cliente con:
- `IDClienteFidely: 1000000008`
- El registro en la base de datos muestra `id_fidely = 1000000008` y `tarjeta_fidely` generada correctamente.

## Contexto
En el flujo de fidelización de clientes, el campo `id_fidely` debe ser generado automáticamente por la base de datos si no se envía en el request. Sin embargo, se observó que al enviar un XML sin el campo `IDClienteFidely`, o con el campo vacío, el valor almacenado en la base es `null` en vez de un valor generado por la secuencia.

## Causa
Esto ocurre porque el ORM (TypeORM/NestJS) traduce los valores `undefined` o `null` en el objeto de persistencia a `NULL` en el INSERT. Cuando el campo se incluye explícitamente como `null` o `undefined`, la base de datos no aplica el valor por defecto (la secuencia), sino que almacena `NULL`.

## Solución
La solución es **no incluir el campo `idFidely` en el objeto de persistencia** si no viene en el request. Solo debe agregarse si existe un valor válido. De esta forma, la base de datos aplicará el valor por defecto y generará el identificador automáticamente.

### Ejemplo aplicado en el adapter:
```ts
const clienteRequest: any = {
  dni: plexDto.dni,
  nombre: plexDto.nombre,
  // ...otros campos...
};
// Solo incluir idFidely si viene en el request y es válido
if (
  plexDto.idClienteFidely !== undefined &&
  plexDto.idClienteFidely !== null &&
  String(plexDto.idClienteFidely).trim() !== ''
) {
  clienteRequest.idFidely = Number(plexDto.idClienteFidely);
}
```

## Resumen del flujo
- El XML se mapea a DTO.
- El adapter construye el objeto de persistencia.
- Si `idClienteFidely` no viene, **no se incluye** en el objeto.
- El ORM no envía el campo en el INSERT.
- La base de datos genera el valor automáticamente usando la secuencia.

## Por qué solo modificar el mapper no es suficiente
Modificar el mapper para devolver `undefined` o `null` no resuelve el problema, porque el ORM sigue enviando el campo como `NULL`. Es necesario condicionar la inclusión del campo en el objeto de persistencia.

## Conclusión
Para confiar en el valor default de la base de datos, nunca se debe enviar el campo `idFidely` si no hay valor. Así se evita el conflicto con el ORM y la base de datos genera el identificador correctamente.
