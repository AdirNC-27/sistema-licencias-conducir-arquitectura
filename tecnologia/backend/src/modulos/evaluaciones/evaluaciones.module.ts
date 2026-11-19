import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ExpedientesModule } from '../expedientes/expedientes.module';
import { ConsultarEvaluacionesUseCase, CorregirResultadoUseCase, RegistrarResultadoUseCase, ValidarResultadoUseCase } from './aplicacion/casos-de-uso';
import { CalificacionConocimientos, CalificacionManejo } from './dominio/calificacion/calificacion.strategy';
import { ESTRATEGIAS_CALIFICACION, REPOSITORIO_EVALUACIONES } from './dominio/contratos/contratos';
import { EvaluacionOrmEntity, RepositorioEvaluacionesTypeOrm } from './infraestructura/evaluaciones.typeorm';
import { EvaluacionesController } from './presentacion/evaluaciones.controller';

/** Raíz de composición: aquí se conecta cada contrato del dominio con su implementación. */
@Module({
  imports: [TypeOrmModule.forFeature([EvaluacionOrmEntity]), ExpedientesModule, AuditoriaModule],
  controllers: [EvaluacionesController],
  providers: [
    RegistrarResultadoUseCase,
    CorregirResultadoUseCase,
    ValidarResultadoUseCase,
    ConsultarEvaluacionesUseCase,
    { provide: REPOSITORIO_EVALUACIONES, useClass: RepositorioEvaluacionesTypeOrm },
    {
      provide: ESTRATEGIAS_CALIFICACION,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nota = Number(config.get('NOTA_MINIMA', 14));
        return [new CalificacionConocimientos(nota), new CalificacionManejo(nota)];
      },
    },
  ],
})
export class EvaluacionesModule {}
