// src/regla/application/services/rules-query.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RulesCacheLoader } from '@infrastructure/cache/rules-cache/rules-cache.loader';
import { Regla as ReglaDomain } from '@regla/core/entities/Regla';
import { ReglaCriteria } from '@regla/core/entities/Criteria';
import { TipoRegla } from '@regla/core/enums/TipoRegla';

@Injectable()
export class RulesQueryService {
  private readonly logger = new Logger(RulesQueryService.name);

  constructor(
    @Inject(RulesCacheLoader)
    private readonly rulesCacheLoader: RulesCacheLoader,
  ) {}

  /**
   * Devuelve reglas filtradas por criteria en memoria (basado en cache).
   * No ejecuta efectos ni orquestación; sólo preselecciona candidatas.
   */
  async findByCriteria(criteria: ReglaCriteria): Promise<ReglaDomain[]> {
    const t0 = Date.now();
    const reglas = await this.rulesCacheLoader.getRules(); // readonly-ish

    // Armamos un pipeline de filtros composable para mantener la legibilidad.
    const filters: Array<(r: ReglaDomain) => boolean> = [];

    // 1) Activas + vigencia (apoyate en la lógica del agregado)
    filters.push((r) => !!r.activa?.value);
    filters.push((r) => r.isApplicable(criteria.fecha?.value));

    // 2) Tipo (si criteria lo trae tiene sentido acotar)
    if (criteria.tipo) {
      // const tipoVal = criteria.tipo; // OpTipo? Ojo: esto filtra tipo de operación. Si también querés por tipo de REGLA, ajustá:
      // Si además tenés un filtro por tipo de regla, podés agregar algo del estilo:
      // filters.push((r) => r.tipo?.value === TipoRegla.PRODUCTO);
    }

    // 3) Pre‑filtro por productos (sin acoplar a entidades)
    //    Si hay carrito en criteria, al menos exigimos que:
    //    - Si la regla es de PRODUCTO, no la descartemos de entrada; no conocemos su targeting acá.
    //    - Si la regla NO es de producto, igual la dejamos (ej. conversión, topes globales).
    if (criteria.productos && criteria.productos.length > 0) {
      filters.push((r) => {
        // Mantener candidatas de tipo PRODUCTO y las globales (CONVERSION/TOPE/ETC):
        const t = r.tipo?.value;
        return t === TipoRegla.PRODUCTO || t === TipoRegla.CONVERSION;
      });
    }

    // 4) (Opcional) Si querés excluir reglas que explícitamente dependan de monto/puntos cuando no están presentes:
    if (!criteria.monto && !criteria.puntosSolicitados) {
      // Por ahora no filtramos nada; muchas reglas (producto/conversión) pueden derivar monto luego.
      // Dejar hook por si querés activar algo como: filters.push((r) => r.tipo?.value !== TipoRegla.CONVERSION);
    }

    // Ejecutar pipeline
    const candidatas = filters.reduce(
      (acc, f) => acc.filter(f),
      reglas as ReadonlyArray<ReglaDomain>,
    );

    // Orden estable: prioridad asc, y de yapa desempate por id para estabilidad
    const ordenadas = [...candidatas].sort((a, b) => {
      const pa = a.prioridad?.value ?? Number.MAX_SAFE_INTEGER;
      const pb = b.prioridad?.value ?? Number.MAX_SAFE_INTEGER;
      if (pa !== pb) return pa - pb;
      // desempate estable por id (lexicográfico)
      const ida = a.id?.value ?? '';
      const idb = b.id?.value ?? '';
      return ida.localeCompare(idb);
    });

    const dt = Date.now() - t0;
    this.logger.debug(
      `findByCriteria -> total=${reglas.length} candidatas=${candidatas.length} devueltas=${ordenadas.length} (${dt}ms)`,
    );

    return ordenadas;
  }
}
