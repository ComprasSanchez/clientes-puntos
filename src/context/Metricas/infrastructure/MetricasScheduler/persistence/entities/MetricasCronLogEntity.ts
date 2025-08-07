import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('metricas_cron_log')
export class MetricasCronLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  jobName: string;

  @Column({ type: 'date' })
  fechaResumen: Date;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endTime: Date;

  @Column()
  status: string; // 'OK', 'ERROR', etc

  @Column({ nullable: true })
  message: string;

  @Column({ nullable: true, type: 'text' })
  error: string;
}
