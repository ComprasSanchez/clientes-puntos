import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReglaEntity } from '../entities/regla.entity';
import { TypeOrmReglaRepository } from './ReglaRepository/ReglaTypeOrmImpl';

@Module({
  imports: [TypeOrmModule.forFeature([ReglaEntity])],
  providers: [
    {
      provide: 'ReglaRepository', // el token que usa tu capa de aplicación
      useClass: TypeOrmReglaRepository, // tu implementación concreta
    },
  ],
  exports: ['ReglaRepository'], // exporta los repositorios para que puedan ser usados en otros módulos
})
export class ReglaPersistenceModule {
  // Aquí puedes definir tus repositorios, entidades, etc.
  // Por ejemplo, si tienes un Repositorio de Reglas:
  // providers: [TypeOrmReglaRepository],
  // exports: [TypeOrmReglaRepository],
}
