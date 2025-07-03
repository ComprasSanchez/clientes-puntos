// test/e2e/puntos-reglas.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompraUseCase } from '@puntos/application/use-cases/Compra/Compra';
import { LoteEntity } from '@puntos/infrastructure/entities/lote.entity';
import { TransaccionEntity } from '@puntos/infrastructure/entities/transaccion.entity';
import { PuntosInfrastructureModule } from '@puntos/infrastructure/puntos.module';
import { ReglaEntity } from '@regla/infrastructure/entities/regla.entity';
import { ReglaInfrastructureModule } from '@regla/infrastructure/regla.module';
import { OpTipo } from '@shared/core/enums/OpTipo';
import { DataSource } from 'typeorm';
import { buildConversionRule } from './factories/BuildConversionRule';
import { buildLote } from './factories/BuildLote';
import { REGLA_REPO } from '@regla/core/tokens/tokens';
import { ReglaRepository } from '@regla/core/repository/ReglaRepository';
import {
  LOTE_REPO,
  TX_REPO,
} from '@puntos/core/tokens/tokens';
import { LoteRepository } from '@puntos/core/repository/LoteRepository';
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import { TransaccionId } from '@puntos/core/value-objects/TransaccionId';
import { ReglaCriteria } from '@regla/core/entities/Criteria';
import { FechaOperacion } from '@regla/core/value-objects/FechaOperacion';
import { TipoMoneda } from '@shared/core/enums/TipoMoneda';
import { MontoMoneda } from '@regla/core/value-objects/MontoMoneda';
import { Moneda } from '@regla/core/value-objects/Moneda';
import { CantidadPuntos } from '@regla/core/value-objects/CantidadPuntos';

describe('E2E: Puntos ←→ Reglas', () => {
  let moduleRef: TestingModule;
  let compraUc: CompraUseCase;
  let conn: DataSource;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [ReglaEntity, LoteEntity, TransaccionEntity],
          synchronize: true,
        }),
        // monta ambos módulos
        ReglaInfrastructureModule,
        PuntosInfrastructureModule,
      ],
    }).compile();

    compraUc = moduleRef.get(CompraUseCase);
    conn = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await conn.close();
  });

  it('debe ejecutar reglas y crear transacción', async () => {
    // 1) Persisto una regla de conversión en DB
    const reglaRepo = moduleRef.get<ReglaRepository>(REGLA_REPO);
    const regla = buildConversionRule();
    await reglaRepo.save(regla);

    // Crea tu criteria a partir del dominio o del contexto
    const criteria = ReglaCriteria.fromContext({
      clienteId: regla.id.value,
      tipo: OpTipo.COMPRA,
      fecha: new FechaOperacion(new Date()),
      puntosSolicitados: undefined,
      monto: new MontoMoneda(5000),
      moneda: Moneda.create(TipoMoneda.ARS),
      saldoActual: new CantidadPuntos(10000),
    });

    const resultados = await reglaRepo.findByCriteria(criteria);
    expect(resultados).toHaveLength(1);
    expect(resultados[0].id.value).toBe(regla.id.value);

    // 2) Creo un lote inicial para el cliente
    const loteRepo = moduleRef.get<LoteRepository>(LOTE_REPO);
    const lote = buildLote();
    await loteRepo.save(lote);

    // 3) Invoco el caso de uso de compra
    const resultado = await compraUc.run({
      clienteId: lote.clienteId,
      origenTipo: 'TEST',
      montoMoneda: 5000,
      moneda: TipoMoneda.ARS,
      referencia: lote.referenciaId?.value || '1234567891234567',
    });

    // 4) Verifico que se creó la transacción con débito/ crédito según la regla
    expect(resultado).toHaveProperty('transaccionId');
    const tx = await moduleRef
      .get<TransaccionRepository>(TX_REPO)
      .findById(new TransaccionId(resultado.transacciones[0].id));
    expect(tx).not.toBeNull();
    expect(tx?.tipo).toBe(OpTipo.COMPRA);
    // …más aserciones sobre cantidad, saldo, etc…
  });
});
