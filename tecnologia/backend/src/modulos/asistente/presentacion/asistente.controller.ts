import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Rol, ROLES_PERSONAL, UsuarioActual } from '../../../compartido/dominio/rol';
import { Contrato } from '../../../compartido/presentacion/contrato';
import { Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { AtenderConsultasUseCase, ConsultarAsistentePersonalUseCase, ConsultarAsistenteUseCase, ConsultarPendientesUseCase, GestionarContenidosUseCase } from '../aplicacion/casos-de-uso';
import { Audiencia, TemaContenido } from '../dominio/contenido';
import { ConsultaDerivadaRespuesta, ConsultaPersonalRespuesta, ConsultaRespuesta, ContenidoRespuesta, PendienteRespuesta } from './respuestas';

class PreguntaDto {
  @ApiProperty({ example: '¿Cuánto cuesta la licencia para mototaxi?' }) @IsString() @Length(1, 300) pregunta!: string;
}

class RespuestaGestorDto {
  @ApiProperty({ example: 'Sí, puede presentar el certificado de cualquier clínica autorizada por el MTC.' }) @IsString() @Length(1, 1000) respuesta!: string;
}

class ContenidoDto {
  @ApiProperty({ enum: TemaContenido }) @IsEnum(TemaContenido) tema!: TemaContenido;
  @ApiPropertyOptional({ enum: Audiencia, default: Audiencia.POSTULANTE }) @IsOptional() @IsEnum(Audiencia) audiencia?: Audiencia;
  @ApiProperty({ example: '¿Cuánto cuesta la licencia?' }) @IsString() @Length(1, 200) pregunta!: string;
  @ApiProperty({ example: 'La tasa del TUPA es S/ 69.90 para la II-B y S/ 69.40 para la II-C.' }) @IsString() @Length(1, 1000) respuesta!: string;
  @ApiPropertyOptional({ example: 'precio, tasa, cuánto pago' }) @IsOptional() @IsString() @MaxLength(300) palabrasClave?: string;
  @ApiPropertyOptional({ example: true, default: true }) @IsOptional() @IsBoolean() activo?: boolean;
}

const ESTADOS = ['PENDIENTE', 'RESPONDIDA'] as const;
class FiltroDerivadasDto {
  @ApiPropertyOptional({ enum: ESTADOS, default: 'PENDIENTE' }) @IsOptional() @IsIn(ESTADOS) estado: (typeof ESTADOS)[number] = 'PENDIENTE';
}

@ApiTags('Asistente virtual')
@ApiBearerAuth()
@Controller('asistente')
export class AsistenteController {
  constructor(
    private readonly asistente: ConsultarAsistenteUseCase,
    private readonly atencion: AtenderConsultasUseCase,
    private readonly contenidos: GestionarContenidosUseCase,
    private readonly pendientes: ConsultarPendientesUseCase,
    private readonly personal: ConsultarAsistentePersonalUseCase,
  ) {}

  @Get('pendientes')
  @Contrato({
    resumen: 'Mis pendientes y recordatorios',
    descripcion: 'Personal: lo que su rol tiene por hacer (documentos, pagos, exámenes, validaciones, emisiones, cupos, plazos). Postulante: lo que le toca y lo que vence pronto. Calculado con los datos del sistema; urgentes primero.',
    exito: { descripcion: 'Pendientes ordenados por urgencia', tipo: PendienteRespuesta, lista: true },
    errores: [],
  })
  misPendientes(@Usuario() usuario: UsuarioActual) {
    return this.pendientes.ejecutar(usuario);
  }

  @Post('personal/consultas')
  @Roles(...ROLES_PERSONAL)
  @Contrato({
    resumen: 'Preguntar a la IA de orientación (personal)',
    descripcion: 'Responde «¿qué tengo pendiente?» con los datos del sistema y las dudas de procedimiento con el contenido aprobado para el personal. No ejecuta acciones ni guarda la conversación.',
    exito: { estado: 201, descripcion: 'Respuesta', tipo: ConsultaPersonalRespuesta },
    errores: [400, 403, [422, 'Pregunta vacía o demasiado larga']],
  })
  preguntarPersonal(@Body() dto: PreguntaDto, @Usuario() usuario: UsuarioActual) {
    return this.personal.preguntar(usuario, dto.pregunta);
  }

  @Post('consultas')
  @Roles(Rol.POSTULANTE)
  @Contrato({
    resumen: 'Preguntar a la IA de orientación (RF14, RF15)',
    descripcion: 'Responde con contenido aprobado o con el estado del propio trámite. Si pide una acción o no hay respuesta confiable, deriva la consulta al gestor. Nunca modifica el trámite (RC06).',
    exito: { estado: 201, descripcion: 'Consulta respondida o derivada', tipo: ConsultaRespuesta },
    errores: [400, 403, [422, 'Pregunta vacía o demasiado larga']],
  })
  preguntar(@Body() dto: PreguntaDto, @Usuario() usuario: UsuarioActual) {
    return this.asistente.preguntar(usuario, dto.pregunta);
  }

  @Get('consultas/mias')
  @Roles(Rol.POSTULANTE)
  @Contrato({ resumen: 'Mi conversación con el asistente', exito: { descripcion: 'Últimas 50 consultas, de la más antigua a la más reciente', tipo: ConsultaRespuesta, lista: true }, errores: [403] })
  mias(@Usuario() usuario: UsuarioActual) {
    return this.asistente.historial(usuario);
  }

  @Get('derivadas')
  @Roles(Rol.GESTOR)
  @Contrato({ resumen: 'Consultas derivadas al gestor (RF15)', exito: { descripcion: 'Pendientes (de la más antigua) o respondidas (de la más reciente)', tipo: ConsultaDerivadaRespuesta, lista: true }, errores: [400, 403] })
  derivadas(@Query() filtro: FiltroDerivadasDto) {
    return this.atencion.derivadas(filtro.estado !== 'RESPONDIDA');
  }

  @Patch('consultas/:id/respuesta')
  @Roles(Rol.GESTOR)
  @Contrato({ resumen: 'Responder una consulta derivada (RF15, auditable)', descripcion: 'El postulante recibe un aviso y ve la respuesta en su conversación.', exito: { descripcion: 'Consulta respondida', tipo: ConsultaDerivadaRespuesta }, errores: [400, 403, [404, 'No existe la consulta'], [409, 'Ya fue respondida'], [422, 'No es una consulta derivada o la respuesta está vacía']] })
  responder(@Param('id', ParseIntPipe) id: number, @Body() dto: RespuestaGestorDto, @Usuario() gestor: UsuarioActual) {
    return this.atencion.responder(id, dto.respuesta, gestor);
  }

  @Get('contenidos')
  @Roles(Rol.ADMINISTRADOR, Rol.GESTOR)
  @Contrato({ resumen: 'Contenido aprobado del asistente (HU25)', exito: { descripcion: 'Todos los contenidos, activos e inactivos', tipo: ContenidoRespuesta, lista: true }, errores: [403] })
  listarContenidos() {
    return this.contenidos.listar();
  }

  @Post('contenidos')
  @Roles(Rol.ADMINISTRADOR)
  @Contrato({ resumen: 'Agregar contenido aprobado (HU25, auditable)', exito: { estado: 201, descripcion: 'Contenido creado', tipo: ContenidoRespuesta }, errores: [400, 403, [422, 'Pregunta o respuesta demasiado corta']] })
  crearContenido(@Body() dto: ContenidoDto, @Usuario() administrador: UsuarioActual) {
    return this.contenidos.crear({ tema: dto.tema, audiencia: dto.audiencia ?? Audiencia.POSTULANTE, pregunta: dto.pregunta, respuesta: dto.respuesta, palabrasClave: dto.palabrasClave ?? '', activo: dto.activo ?? true }, administrador);
  }

  @Put('contenidos/:id')
  @Roles(Rol.ADMINISTRADOR)
  @Contrato({ resumen: 'Modificar o desactivar contenido aprobado (HU25, auditable)', exito: { descripcion: 'Contenido actualizado', tipo: ContenidoRespuesta }, errores: [400, 403, [404, 'No existe el contenido'], [422, 'Pregunta o respuesta demasiado corta']] })
  actualizarContenido(@Param('id', ParseIntPipe) id: number, @Body() dto: ContenidoDto, @Usuario() administrador: UsuarioActual) {
    return this.contenidos.actualizar(id, { tema: dto.tema, audiencia: dto.audiencia ?? Audiencia.POSTULANTE, pregunta: dto.pregunta, respuesta: dto.respuesta, palabrasClave: dto.palabrasClave ?? '', activo: dto.activo ?? true }, administrador);
  }
}
