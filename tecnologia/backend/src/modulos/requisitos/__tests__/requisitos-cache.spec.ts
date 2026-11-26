import { Categoria, TipoTramite } from '../../../compartido/dominio/categoria';
import { RepositorioRequisitosCacheado, TTL_REQUISITOS_MS } from '../infraestructura/repositorios';

/** SDD-03 CA2 · patrón Decorator (ADR-009): la segunda consulta se responde desde la memoria. */
describe('Requisitos con caché (RF22, EQ-03)', () => {
  const crear = () => {
    const memoria = new Map<string, unknown>();
    const cache = {
      get: jest.fn(async (clave: string) => memoria.get(clave)),
      set: jest.fn(async (clave: string, valor: unknown) => void memoria.set(clave, valor)),
    };
    const real = { listar: jest.fn(async () => [{ orden: 1, descripcion: 'Constancia COFIPRO', documento: 'CONSTANCIA_COFIPRO' }]) };
    return { cache, real, repositorio: new RepositorioRequisitosCacheado(real as never, cache as never) };
  };

  it('consulta PostgreSQL una sola vez y repite la respuesta desde la memoria por 10 minutos', async () => {
    const { cache, real, repositorio } = crear();
    const primera = await repositorio.listar(TipoTramite.EMISION, Categoria.II_C);
    const segunda = await repositorio.listar(TipoTramite.EMISION, Categoria.II_C);
    expect(segunda).toEqual(primera);
    expect(real.listar).toHaveBeenCalledTimes(1);
    expect(cache.set).toHaveBeenCalledWith('requisitos:EMISION:II-C', primera, TTL_REQUISITOS_MS);
    expect(TTL_REQUISITOS_MS).toBe(10 * 60 * 1000);
  });

  it('cada categoría tiene su propia entrada en la caché', async () => {
    const { real, repositorio } = crear();
    await repositorio.listar(TipoTramite.EMISION, Categoria.II_B);
    await repositorio.listar(TipoTramite.EMISION, Categoria.II_C);
    expect(real.listar).toHaveBeenCalledTimes(2);
  });
});
