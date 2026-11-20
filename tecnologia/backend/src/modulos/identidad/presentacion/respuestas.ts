import { ApiProperty } from '@nestjs/swagger';
import { Rol } from '../../../compartido/dominio/rol';

export class UsuarioSesionRespuesta {
  @ApiProperty({ example: 5 }) id!: number;
  @ApiProperty({
    example: '45892014',
    description: 'DNI del postulante o usuario del personal',
  })
  usuario!: string;
  @ApiProperty({ example: 'Juan Carlos Quispe Mendoza' }) nombre!: string;
  @ApiProperty({ enum: Rol, enumName: 'Rol' }) rol!: Rol;
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 1,
    description: 'Solo para postulantes',
  })
  postulanteId!: number | null;
}

export class SesionRespuesta {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…',
    description: 'JWT para el encabezado Authorization: Bearer',
  })
  token!: string;
  @ApiProperty({ type: UsuarioSesionRespuesta })
  usuario!: UsuarioSesionRespuesta;
}

export class UsuarioTokenRespuesta {
  @ApiProperty({ example: 5 }) id!: number;
  @ApiProperty({ example: '45892014' }) usuario!: string;
  @ApiProperty({ enum: Rol, enumName: 'Rol' }) rol!: Rol;
  @ApiProperty({ type: Number, nullable: true, example: 1 }) postulanteId!:
    number | null;
}

export class CuentaRespuesta {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'gestor' }) usuario!: string;
  @ApiProperty({ example: 'Carlos Mendoza' }) nombre!: string;
  @ApiProperty({ enum: Rol, enumName: 'Rol' }) rol!: Rol;
  @ApiProperty({ example: true }) activo!: boolean;
}

export class RolCambiadoRespuesta {
  @ApiProperty({ example: 2 }) id!: number;
  @ApiProperty({ example: 'evaluador' }) usuario!: string;
  @ApiProperty({ enum: Rol, enumName: 'Rol' }) rol!: Rol;
}
