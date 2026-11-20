import { ApiProperty } from '@nestjs/swagger';

export class PostulanteCreadoRespuesta {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: '45892014' }) dni!: string;
  @ApiProperty({
    example: 'JUAN CARLOS QUISPE MENDOZA',
    description: 'Nombre obtenido de API Perú',
  })
  nombre!: string;
  @ApiProperty({ example: 'postulante@correo.com' }) correo!: string;
}

export class PostulanteRespuesta extends PostulanteCreadoRespuesta {
  @ApiProperty({ example: '987654321' }) celular!: string;
}
