import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Regla as ReglaDomain } from '../../core/entities/Regla';
import { ReglaId } from '../../core/value-objects/ReglaId';
import { ReglaNombre } from '../../core/value-objects/ReglaNombre';
import { ReglaTipo } from '../../core/value-objects/ReglaTipo';
import { ReglaPrioridad } from '../../core/value-objects/ReglaPrioridad';
import { ReglaFlag } from '../../core/value-objects/ReglaFlag';
import { ReglaVigenciaInicio } from '../../core/value-objects/ReglaVigenciaInicio';
import { ReglaVigenciaFin } from '../../core/value-objects/ReglaVigenciaFin';
import { ReglaDescripcion } from '../../core/value-objects/ReglaDescripcion';
import { ConversionRule } from '../../core/entities/ConversionRule';
import { RatioConversion } from '../../core/value-objects/RatioConversion';
import { DiasExpiracion } from '../../core/value-objects/DiasExpiracion';
import { TipoRegla } from '../../core/enums/TipoRegla';

@Entity({ name: 'reglas' })
export class ReglaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'enum', enum: TipoRegla })
  tipo: TipoRegla;

  @Column('int')
  prioridad: number;

  @Column({ type: 'boolean' })
  activa: boolean;

  @Column({ type: 'boolean' })
  excluyente: boolean;

  @Column({ type: 'timestamp' })
  vigenciaInicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  vigenciaFin: Date | null;

  @Column({ nullable: true })
  descripcion: string | null;

  @Column('jsonb', { nullable: true })
  config: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toDomain(): ReglaDomain {
    const id = new ReglaId(this.id);
    const nombre = new ReglaNombre(this.nombre);
    const tipo = ReglaTipo.create(this.tipo);
    const prioridad = new ReglaPrioridad(this.prioridad);
    const activa = new ReglaFlag(this.activa);
    const excluyente = new ReglaFlag(this.excluyente);
    const vigenciaInicio = new ReglaVigenciaInicio(this.vigenciaInicio);
    const vigenciaFin = this.vigenciaFin
      ? new ReglaVigenciaFin(this.vigenciaFin)
      : undefined;
    const descripcion = this.descripcion
      ? new ReglaDescripcion(this.descripcion)
      : undefined;

    switch (this.tipo) {
      case TipoRegla.CONVERSION:
        return new ConversionRule(
          id,
          nombre,
          tipo,
          prioridad,
          activa,
          excluyente,
          vigenciaInicio,
          vigenciaFin,
          descripcion,
          new RatioConversion(Number(this.config.rateAccred)),
          new RatioConversion(Number(this.config.rateSpend)),
          new DiasExpiracion(Number(this.config.creditExpiryDays)),
        );
      // case 'otroTipo':
      //   return new OtraRegla(...);
      default:
        throw new Error(`Tipo de regla "${this.tipo}" no soportado`);
    }
  }

  static fromDomain(regla: ReglaDomain): ReglaEntity {
    const e = new ReglaEntity();
    e.id = regla.id.value;
    e.nombre = regla.nombre.value;
    e.tipo = regla.tipo.value;
    e.prioridad = regla.prioridad.value;
    e.activa = regla.activa.value;
    e.excluyente = regla.excluyente.value;
    e.vigenciaInicio = regla.vigenciaInicio.value;
    e.vigenciaFin = regla.vigenciaFin?.value ?? null;
    e.descripcion = regla.descripcion?.value ?? null;
    e.createdAt = new Date();
    e.updatedAt = new Date();

    // Configuración de parámetros según subtipo
    if (regla instanceof ConversionRule) {
      e.config = {
        rateAccred: regla['rateAccred'].value,
        rateSpend: regla['rateSpend'].value,
        creditExpiryDays: regla['creditExpiryDays'].value,
      };
    } else {
      e.config = {};
    }

    return e;
  }
}
