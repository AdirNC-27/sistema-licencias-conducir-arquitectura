import { CredencialesInvalidasError, RecursoNoEncontradoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { esPersonal, Rol } from '../../../compartido/dominio/rol';
import { eventosFalsos, usuario } from '../../../test-utils/fakes';
import { CambiarRolUseCase } from '../aplicacion/cambiar-rol.use-case';
import { IniciarSesionUseCase } from '../aplicacion/iniciar-sesion.use-case';
import { RepositorioUsuarios } from '../dominio/contratos';
import { Usuario } from '../dominio/usuario';

class RepoUsuarios implements RepositorioUsuarios {
  datos = [new Usuario(1, 'gestor', 'Gestor', 'cifrada:demo123', Rol.GESTOR), new Usuario(2, '45892014', 'Juan', 'cifrada:demo123', Rol.POSTULANTE, 10)];
  async buscarPorUsuario(u: string) {
    return this.datos.find((x) => x.usuario === u) ?? null;
  }
  async buscarPorId(id: number) {
    return this.datos.find((x) => x.id === id) ?? null;
  }
  async listar() {
    return this.datos;
  }
  async crear(): Promise<Usuario> {
    throw new Error('no usado');
  }
  async guardarRol() {}
}

const cifrador = { cifrar: async (c: string) => `cifrada:${c}`, comparar: async (c: string, h: string) => h === `cifrada:${c}` };
const tokens = { emitir: (u: Usuario) => `token-${u.rol}` };

describe('Identidad y acceso (RF01)', () => {
  it('inicia sesión y el rol sale de la cuenta', async () => {
    const s = await new IniciarSesionUseCase(new RepoUsuarios(), cifrador, tokens).ejecutar(' Gestor ', 'demo123');
    expect(s.token).toBe('token-GESTOR');
    expect(s.usuario.rol).toBe(Rol.GESTOR);
  });

  it('rechaza clave incorrecta o usuario inexistente', async () => {
    const caso = new IniciarSesionUseCase(new RepoUsuarios(), cifrador, tokens);
    await expect(caso.ejecutar('gestor', 'otra')).rejects.toThrow(CredencialesInvalidasError);
    await expect(caso.ejecutar('nadie', 'demo123')).rejects.toThrow(CredencialesInvalidasError);
  });

  it('el administrador cambia el rol del personal y queda auditado', async () => {
    const eventos = eventosFalsos();
    const r = await new CambiarRolUseCase(new RepoUsuarios(), eventos).ejecutar(1, Rol.SUPERVISOR, usuario(Rol.ADMINISTRADOR));
    expect(r.rol).toBe(Rol.SUPERVISOR);
    expect(eventos.emit).toHaveBeenCalledWith('auditoria.operacion', expect.objectContaining({ accion: 'CAMBIAR_ROL' }));
  });

  it('no convierte postulantes en personal y valida que exista el usuario', async () => {
    const caso = new CambiarRolUseCase(new RepoUsuarios(), eventosFalsos());
    await expect(caso.ejecutar(2, Rol.GESTOR, usuario(Rol.ADMINISTRADOR))).rejects.toThrow(ReglaNegocioError);
    await expect(caso.ejecutar(99, Rol.GESTOR, usuario(Rol.ADMINISTRADOR))).rejects.toThrow(RecursoNoEncontradoError);
  });

  it('distingue al personal del postulante', () => {
    expect(esPersonal(usuario(Rol.EVALUADOR))).toBe(true);
    expect(esPersonal(usuario(Rol.POSTULANTE))).toBe(false);
  });
});
