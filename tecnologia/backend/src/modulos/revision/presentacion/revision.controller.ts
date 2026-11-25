import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Rol, ROLES_PERSONAL, UsuarioActual } from '../../../compartido/dominio/rol';
import { Contrato } from '../../../compartido/presentacion/contrato';
import { Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import {
  AtenderObservacionUseCase,
  AutorizarEmisionUseCase,
  ConsultarRevisionUseCase,
  ObservarExpedienteUseCase,
  RegistrarLicenciaUseCase,
  RegistrarVerificacionUseCase,
} from '../aplicacion/casos-de-uso';
import { ResultadoVerificacion, TipoVerificacion } from '../dominio/verificacion';
import { EmisionRespuesta, LicenciaRespuesta, ObservacionBandejaRespuesta, ObservacionRespuesta, RevisionRespuesta, VerificacionRespuesta } from './respuestas';

class VerificacionDto {
  @ApiProperty({ enum: TipoVerificacion, example: TipoVerificacion.SNC_CERTIFICADO_MEDICO }) @IsEnum(TipoVerificacion) tipo!: TipoVerificacion;
  @ApiProperty({ enum: ResultadoVerificacion, example: ResultadoVerificacion.CONFORME }) @IsEnum(ResultadoVerificacion) resultado!: ResultadoVerificacion;
  @ApiPropertyOptional({ example: 'Certificado N.° 0045821 de la clínica San Juan, vigente', description: 'Obligatorio si no es conforme' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  detalle?: string;
}

class ObservacionDto {
  @ApiProperty({ example: 'La constancia COFIPRO del SNC no coincide con el DNI del postulante' }) @IsString() @Length(1, 500) motivo!: string;
}

class AtencionDto {
  @ApiProperty({ example: 'Se volvió a consultar el SNC y se registró la constancia correcta' }) @IsString() @Length(1, 500) respuesta!: string;
}

class LicenciaDto {
  @ApiProperty({ example: 'Q45892014' }) @IsString() @Length(1, 20) numero!: string;
}

@ApiTags('Revisión y emisión')
@ApiBearerAuth()
@Controller()
export class RevisionController {
  constructor(
    private readonly verificar: RegistrarVerificacionUseCase,
    private readonly observar: ObservarExpedienteUseCase,
    private readonly atender: AtenderObservacionUseCase,
    private readonly autorizar: AutorizarEmisionUseCase,
    private readonly licenciar: RegistrarLicenciaUseCase,
    private readonly consultar: ConsultarRevisionUseCase,
  ) {}

  @Get('expedientes/:id/revision')
  @Roles(...ROLES_PERSONAL)
  @Contrato({ resumen: 'Revisión del expediente: verificaciones, observaciones, licencia y pendientes (RF11)', exito: { descripcion: 'Estado de la revisión', tipo: RevisionRespuesta }, errores: [400, 403, [404, 'No existe el expediente']] })
  revision(@Param('id', ParseIntPipe) id: number) {
    return this.consultar.revision(id);
  }

  @Post('expedientes/:id/verificaciones')
  @Roles(Rol.GESTOR)
  @Contrato({
    resumen: 'Registrar una verificación en el SNC o en el récord de sanciones (RF24, RF27, auditable)',
    descripcion: 'El gestor consulta el portal oficial y deja constancia. Cada registro se guarda como historial.',
    exito: { estado: 201, descripcion: 'Verificación registrada', tipo: VerificacionRespuesta },
    errores: [400, 403, [404, 'No existe el expediente'], [409, 'El expediente ya fue emitido'], [422, 'No corresponde a la categoría o falta el detalle']],
  })
  registrarVerificacion(@Param('id', ParseIntPipe) id: number, @Body() dto: VerificacionDto, @Usuario() gestor: UsuarioActual) {
    return this.verificar.ejecutar(id, dto.tipo, dto.resultado, dto.detalle ?? null, gestor);
  }

  @Post('expedientes/:id/observaciones')
  @Roles(Rol.SUPERVISOR)
  @Contrato({
    resumen: 'Observar el expediente y devolverlo al gestor (RF11, auditable)',
    exito: { estado: 201, descripcion: 'Observación abierta; la emisión queda bloqueada', tipo: ObservacionRespuesta },
    errores: [400, 403, [404, 'No existe el expediente'], [409, 'No está en la etapa EMISION o ya tiene una observación abierta'], [422, 'Motivo demasiado corto']],
  })
  registrarObservacion(@Param('id', ParseIntPipe) id: number, @Body() dto: ObservacionDto, @Usuario() supervisor: UsuarioActual) {
    return this.observar.ejecutar(id, dto.motivo, supervisor);
  }

  @Get('observaciones/abiertas')
  @Roles(Rol.GESTOR, Rol.SUPERVISOR)
  @Contrato({ resumen: 'Expedientes devueltos por el supervisor y aún no atendidos', exito: { descripcion: 'Observaciones abiertas, de la más antigua a la más reciente', tipo: ObservacionBandejaRespuesta, lista: true }, errores: [403] })
  abiertas() {
    return this.consultar.observacionesAbiertas();
  }

  @Patch('observaciones/:id/atencion')
  @Roles(Rol.GESTOR)
  @Contrato({ resumen: 'Atender una observación del supervisor (RF11, auditable)', exito: { descripcion: 'Observación atendida', tipo: ObservacionRespuesta }, errores: [400, 403, [404, 'No existe la observación'], [409, 'Ya fue atendida'], [422, 'Descripción demasiado corta']] })
  atenderObservacion(@Param('id', ParseIntPipe) id: number, @Body() dto: AtencionDto, @Usuario() gestor: UsuarioActual) {
    return this.atender.ejecutar(id, dto.respuesta, gestor);
  }

  @Patch('expedientes/:id/emision')
  @Roles(Rol.SUPERVISOR)
  @Contrato({
    resumen: 'Autorizar la emisión de la licencia (RF12, auditable)',
    descripcion: 'Exige las verificaciones conformes de la categoría y ninguna observación abierta.',
    exito: { descripcion: 'Expediente en la etapa EMITIDA', tipo: EmisionRespuesta },
    errores: [400, 403, [404, 'No existe el expediente'], [409, 'El expediente no está en la etapa EMISION'], [422, 'Faltan verificaciones o hay una observación abierta']],
  })
  async emitir(@Param('id', ParseIntPipe) id: number, @Usuario() supervisor: UsuarioActual) {
    const e = await this.autorizar.ejecutar(id, supervisor);
    return { expedienteId: e.id, numero: e.numero, etapa: e.etapa };
  }

  @Post('expedientes/:id/licencia')
  @Roles(Rol.GESTOR)
  @Contrato({
    resumen: 'Registrar la licencia emitida para su carga en el SNC (RF24, auditable)',
    exito: { estado: 201, descripcion: 'Licencia registrada; se avisa al postulante', tipo: LicenciaRespuesta },
    errores: [400, 403, [404, 'No existe el expediente'], [409, 'No está emitido, ya tiene licencia o el número está repetido'], [422, 'Formato de número no válido']],
  })
  registrarLicencia(@Param('id', ParseIntPipe) id: number, @Body() dto: LicenciaDto, @Usuario() gestor: UsuarioActual) {
    return this.licenciar.ejecutar(id, dto.numero, gestor);
  }

  @Get('expedientes/:id/licencia')
  @Contrato({ resumen: 'Licencia emitida del expediente', exito: { descripcion: 'Licencia registrada', tipo: LicenciaRespuesta }, errores: [400, [403, 'El expediente pertenece a otro postulante (EQ-02)'], [404, 'No existe el expediente o la licencia aún no fue registrada']] })
  licencia(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.consultar.licencia(id, usuario);
  }
}
