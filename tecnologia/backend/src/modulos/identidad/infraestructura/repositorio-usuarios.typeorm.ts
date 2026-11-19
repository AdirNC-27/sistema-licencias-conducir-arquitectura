import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '../../../compartido/dominio/rol';
import { RepositorioUsuarios } from '../dominio/contratos';
import { Usuario } from '../dominio/usuario';
import { UsuarioOrmEntity } from './usuario.orm-entity';

@Injectable()
export class RepositorioUsuariosTypeOrm implements RepositorioUsuarios {
  constructor(@InjectRepository(UsuarioOrmEntity) private readonly orm: Repository<UsuarioOrmEntity>) {}

  async buscarPorUsuario(usuario: string): Promise<Usuario | null> {
    return (await this.orm.findOneBy({ usuario }))?.aDominio() ?? null;
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    return (await this.orm.findOneBy({ id }))?.aDominio() ?? null;
  }

  async listar(): Promise<Usuario[]> {
    return (await this.orm.find({ order: { id: 'ASC' } })).map((u) => u.aDominio());
  }

  async crear(datos: { usuario: string; nombre: string; claveCifrada: string; rol: Rol; postulanteId?: number | null }): Promise<Usuario> {
    const fila = await this.orm.save(this.orm.create({ ...datos, postulanteId: datos.postulanteId ?? null }));
    return fila.aDominio();
  }

  async guardarRol(usuario: Usuario): Promise<void> {
    await this.orm.update({ id: usuario.id }, { rol: usuario.rol });
  }
}
