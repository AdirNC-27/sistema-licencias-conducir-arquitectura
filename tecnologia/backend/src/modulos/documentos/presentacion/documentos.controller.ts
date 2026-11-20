import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Response } from 'express';
import { Rol, UsuarioActual } from '../../../compartido/dominio/rol';
import { Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { ConsultarDocumentosUseCase, RevisarDocumentoUseCase, SubirDocumentoUseCase } from '../aplicacion/casos-de-uso';
import { EstadoDocumento, TipoDocumento } from '../dominio/documento';
import { Contrato } from '../../../compartido/presentacion/contrato';
import { DocumentoRespuesta, RevisionDocumentoRespuesta } from './respuestas';

class SubirDto {
  @ApiProperty({ enum: TipoDocumento }) @IsEnum(TipoDocumento) tipo!: TipoDocumento;
  @ApiPropertyOptional({ example: '2026-11-01', description: 'Obligatoria para el certificado médico' }) @IsOptional() @IsDateString() fechaEmision?: string;
}

class RevisionDto {
  @ApiProperty({ enum: [EstadoDocumento.APROBADO, EstadoDocumento.OBSERVADO] })
  @IsIn([EstadoDocumento.APROBADO, EstadoDocumento.OBSERVADO])
  estado!: EstadoDocumento.APROBADO | EstadoDocumento.OBSERVADO;
  @ApiPropertyOptional({ example: 'La foto no es a color' }) @IsOptional() @IsString() @MaxLength(250) observacion?: string;
}

@ApiTags('Requisitos y documentos')
@ApiBearerAuth()
@Controller()
export class DocumentosController {
  constructor(
    private readonly subir: SubirDocumentoUseCase,
    private readonly revisar: RevisarDocumentoUseCase,
    private readonly consultar: ConsultarDocumentosUseCase,
  ) {}

  @Post('expedientes/:id/documentos')
  @Roles(Rol.POSTULANTE)
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: 2 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { tipo: { enum: Object.values(TipoDocumento) }, fechaEmision: { type: 'string', format: 'date' }, archivo: { type: 'string', format: 'binary' } } } })
  @Contrato({ resumen: 'Adjuntar un documento del expediente (RF03)', descripcion: 'multipart/form-data con el campo archivo: PDF, JPG o PNG de hasta 2 MB.', exito: { estado: 201, descripcion: 'Documento registrado en estado PENDIENTE', tipo: DocumentoRespuesta }, errores: [400, [403, 'El expediente pertenece a otro postulante'], [404, 'No existe el expediente'], [409, 'El expediente no está en la etapa DOCUMENTOS o el documento ya fue aprobado'], 413, [422, 'Formato no permitido, certificado médico vencido o sin fecha de emisión']] })
  adjuntar(@Param('id', ParseIntPipe) id: number, @Body() dto: SubirDto, @UploadedFile() archivo: Express.Multer.File | undefined, @Usuario() usuario: UsuarioActual) {
    if (!archivo) throw new BadRequestException('Adjunte el archivo en el campo "archivo"');
    return this.subir.ejecutar(id, dto.tipo, dto.fechaEmision ? new Date(dto.fechaEmision) : null, { nombre: archivo.originalname, tipoMime: archivo.mimetype, contenido: archivo.buffer }, usuario);
  }

  @Get('expedientes/:id/documentos')
  @Contrato({ resumen: 'Documentos del expediente y su estado', exito: { descripcion: 'Documentos del expediente', tipo: DocumentoRespuesta, lista: true }, errores: [400, [403, 'El expediente pertenece a otro postulante'], [404, 'No existe el expediente']] })
  listar(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.consultar.listar(id, usuario);
  }

  @Get('documentos/:id/archivo')
  @Contrato({ resumen: 'Descargar el archivo de un documento (solo el dueño o el personal, EQ-02)', exito: { descripcion: 'El archivo, con su tipo de contenido', archivo: true }, errores: [400, [403, 'El documento pertenece a otro postulante'], [404, 'No existe el documento']] })
  async descargar(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual, @Res() res: Response) {
    const archivo = await this.consultar.archivo(id, usuario);
    res.setHeader('Content-Type', archivo.tipoMime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(archivo.nombre)}"`);
    res.send(archivo.contenido);
  }

  @Patch('documentos/:id/revision')
  @Roles(Rol.GESTOR)
  @Contrato({ resumen: 'Aprobar u observar un documento (RF04, auditable)', descripcion: 'Cuando todos los documentos quedan aprobados, el expediente pasa a la etapa PAGO.', exito: { descripcion: 'Documento revisado', tipo: RevisionDocumentoRespuesta }, errores: [400, 403, [404, 'No existe el documento'], [409, 'El documento ya fue aprobado'], [422, 'Indique el motivo de la observación']] })
  revisarDocumento(@Param('id', ParseIntPipe) id: number, @Body() dto: RevisionDto, @Usuario() gestor: UsuarioActual) {
    return this.revisar.ejecutar(id, dto.estado, dto.observacion ?? null, gestor);
  }
}
