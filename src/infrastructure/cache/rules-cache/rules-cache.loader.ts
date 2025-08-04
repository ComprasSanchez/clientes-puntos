// src/infrastructure/cache/rules/rules-cache.loader.ts
import { Injectable } from '@nestjs/common';
import { RulesCacheService } from './rules-cache.service';
import { ReglaRepository } from '@regla/core/repository/ReglaRepository';
import { Regla } from '@regla/core/entities/Regla';
// Cambia esto por tu propio repositorio de reglas real

@Injectable()
export class RulesCacheLoader {
  constructor(
    private readonly rulesCache: RulesCacheService,
    private readonly reglaRepo: ReglaRepository,
  ) {}

  // Popular cache y devolver reglas
  async loadAndCacheRules(): Promise<Regla[]> {
    const reglas = await this.reglaRepo.findAll();
    await this.rulesCache.setRules(reglas);
    return reglas;
  }

  // Obtener reglas desde cache (o refrescar si no existen)
  async getRules(): Promise<Regla[]> {
    let reglas = await this.rulesCache.getRules<Regla>();
    if (!reglas) {
      reglas = await this.loadAndCacheRules();
    }
    return reglas;
  }

  // Forzar invalidación de cache
  async invalidate(): Promise<void> {
    await this.rulesCache.invalidate();
  }
}
