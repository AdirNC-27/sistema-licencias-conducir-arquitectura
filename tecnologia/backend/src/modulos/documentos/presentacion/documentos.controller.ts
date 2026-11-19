import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Response } from 'express';
import { Rol, UsuarioActual } from '../../../compartido/dominio/rol';
import { Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { ConsultarDocumentosUseCase, RevisarDocumentoUseCase, SubirDocumentoUseCase } from '../aplicacion/casos-de-uso';
import { EstadoDocumento, TipoDocumento } from '../dominio/documento';

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
  @ApiOperation({ summary: 'Adjuntar un documento del expediente (RF03): PDF, JPG o PNG hasta 2 MB' })
  adjuntar(@Param('id', ParseIntPipe) id: number, @Body() dto: SubirDto, @UploadedFile() archivo: Express.Multer.File | undefined, @Usuario() usuario: UsuarioActual) {
    if (!archivo) throw new BadRequestException('Adjunte el archivo en el campo "archivo"');
    return this.subir.ejecutar(id, dto.tipo, dto.fechaEmision ? new Date(dto.fechaEmision) : null, { nombre: archivo.originalname, tipoMime: archivo.mimetype, contenido: archivo.buffer }, usuario);
  }

  @Get('expedientes/:id/documentos')
  @ApiOperation({ summary: 'Documentos del expediente y su estado' })
  listar(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.consultar.listar(id, usuario);
  }

  @Get('documentos/:id/archivo')
  @ApiOperation({ summary: 'Descargar el archivo (solo dueño o personal, EQ-02)' })
  async descargar(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual, @Res() res: Response) {
    const archivo = await this.consultar.archivo(id, usuario);
    res.setHeader('Content-Type', archivo.tipoMime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(archivo.nombre)}"`);
    res.send(archivo.contenido);
  }

  @Patch('documentos/:id/revision')
  @Roles(Rol.GESTOR)
  @ApiOperation({ summary: 'Aprobar u observar un documento (RF04, auditable). Con todos aprobados pasa a PAGO' })
  revisarDocumento(@Param('id', ParseIntPipe) id: number, @Body() dto: RevisionDto, @Usuario() gestor: UsuarioActual) {
    return this.revisar.ejecutar(id, dto.estado, dto.observacion ?? null, gestor);
  }
}
