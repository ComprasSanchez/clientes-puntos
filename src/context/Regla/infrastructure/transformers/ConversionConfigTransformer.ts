import { ValueTransformer } from 'typeorm';
import { ConversionConfig } from '../../core/value-objects/ConversionConfig';

/**
 * Transformer para TypeORM: maneja la columna JSONB `config`.
 */
export const ConversionConfigTransformer: ValueTransformer = {
  /**
   * De VO a JSON plano para guardar.
   */
  to(value?: ConversionConfig): any {
    return value ? value.toPlain() : null;
  },

  /**
   * De JSONB a VO.
   */
  from(dbValue: any): ConversionConfig | undefined {
    return dbValue != null ? ConversionConfig.fromPlain(dbValue) : undefined;
  },
};
