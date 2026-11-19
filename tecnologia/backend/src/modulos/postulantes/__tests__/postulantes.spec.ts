import { ConflictoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { Rol } from '../../../compartido/dominio/rol';
import { ConsultarPostulantesUseCase } from '../aplicacion/consultar-postulantes.use-case';
import { RegistrarPostulanteUseCase } from '../aplicacion/registrar-postulante.use-case';
import { AccesoDenegadoError, RecursoNoEncontradoError } from '../../../compartido/dominio/errores';
import { RepositorioPostulantes, VerificadorIdentidad } from '../dominio/contratos';
import { Dni, Postulante } from '../dominio/postulante';

describe('Registro del postulante con DNI (RF03, RF04)', () => {
  const verificador: VerificadorIdentidad = {
    consultar: async (dni) => ({ dni, nombres: 'JUAN CARLOS', apellidoPaterno: 'QUISPE', apellidoMaterno: 'MENDOZA' }),
  };
  const crearRepos = () => {
    const postulantes: Postulante[] = [];
    const repo: RepositorioPostulantes = {
      existeDni: async (d) => postulantes.some((p) => p.dni === d),
      crear: async (d) => {
        const p = new Postulante(postulantes.length + 1, d.dni, d.nombres, d.apellidos, d.correo, d.celular);
        postulantes.push(p);
        return p;
      },
      buscarPorId: async (id) => postulantes.find((p) => p.id === id) ?? null,
      buscarVarios: async (ids) => postulantes.filter((p) => ids.includes(p.id)),
    };
    const usuarios = { crear: jest.fn(async (d) => d) } as never;
    return { repo, usuarios };
  };
  const cifrador = { cifrar: async (c: string) => `x${c}`, comparar: async () => true };

  it('valida el formato del DNI', () => {
    expect(() => new Dni('1234')).toThrow(ReglaNegocioError);
    expect(new Dni(' 45892014 ').valor).toBe('45892014');
  });

  it('crea el postulante con los nombres de API Perú y una cuenta con rol POSTULANTE', async () => {
    const { repo, usuarios } = crearRepos();
    const r = await new RegistrarPostulanteUseCase(verificador, repo, usuarios, cifrador).ejecutar({ dni: '45892014', correo: 'A@B.PE', celular: '987654321', clave: 'demo123' });
    expect(r.nombre).toBe('JUAN CARLOS QUISPE MENDOZA');
    expect(r.correo).toBe('a@b.pe');
    expect((usuarios as unknown as { crear: jest.Mock }).crear).toHaveBeenCalledWith(expect.objectContaining({ rol: Rol.POSTULANTE, usuario: '45892014' }));
  });

  it('no permite dos cuentas con el mismo DNI', async () => {
    const { repo, usuarios } = crearRepos();
    const caso = new RegistrarPostulanteUseCase(verificador, repo, usuarios, cifrador);
    await caso.ejecutar({ dni: '45892014', correo: 'a@b.pe', celular: '987654321', clave: 'demo123' });
    await expect(caso.ejecutar({ dni: '45892014', correo: 'a@b.pe', celular: '987654321', clave: 'demo123' })).rejects.toThrow(ConflictoError);
  });

  it('el personal consulta a cualquiera; el postulante solo a sí mismo (EQ-02)', async () => {
    const { repo, usuarios } = crearRepos();
    await new RegistrarPostulanteUseCase(verificador, repo, usuarios, cifrador).ejecutar({ dni: '45892014', correo: 'a@b.pe', celular: '987654321', clave: 'demo123' });
    const consultar = new ConsultarPostulantesUseCase(repo);
    const gestor = { id: 9, usuario: 'gestor', rol: Rol.GESTOR, postulanteId: null };
    expect((await consultar.uno(1, gestor)).dni).toBe('45892014');
    expect(await consultar.varios([1, 2])).toHaveLength(1);
    await expect(consultar.uno(1, { id: 5, usuario: 'x', rol: Rol.POSTULANTE, postulanteId: 2 })).rejects.toThrow(AccesoDenegadoError);
    await expect(consultar.uno(99, gestor)).rejects.toThrow(RecursoNoEncontradoError);
  });
});
