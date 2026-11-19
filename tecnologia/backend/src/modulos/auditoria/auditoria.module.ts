import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { REGISTRO_AUDITORIA } from './dominio/registro-auditoria';
import { AuditoriaOrmEntity, BitacoraAuditoriaTypeOrm } from './infraestructura/bitacora-auditoria.typeorm';
import { AuditoriaController } from './presentacion/auditoria.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditoriaOrmEntity])],
  controllers: [AuditoriaController],
  providers: [BitacoraAuditoriaTypeOrm, { provide: REGISTRO_AUDITORIA, useExisting: BitacoraAuditoriaTypeOrm }],
  exports: [REGISTRO_AUDITORIA],
})
export class AuditoriaModule {}
