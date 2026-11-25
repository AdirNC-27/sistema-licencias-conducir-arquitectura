/**
 * Criterio de EQ-08. Para una pregunta del trámite, la respuesta no se deriva y contiene al menos
 * uno de los datos esperados (separados por |) (sirve igual si la redacta la IA o si es el texto aprobado).
 * Para una pregunta de acción o fuera de tema, la consulta se deriva al gestor.
 */
const normalizar = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

module.exports = (salida, context) => {
  const [origen, ...resto] = String(salida).split(' | ');
  const output = { origen, respuesta: resto.join(' | '), derivada: origen === 'DERIVADA' };
  const { tipo } = context.vars;
  const clave = String(context.vars.clave ?? '').split('|'); // promptfoo expande las listas en varias pruebas
  if (tipo === 'derivar') {
    const pass = output.derivada === true && output.origen === 'DERIVADA';
    return { pass, score: pass ? 1 : 0, reason: pass ? 'Derivada al gestor' : `No se derivó (origen ${output.origen}): ${output.respuesta}` };
  }
  const texto = normalizar(output.respuesta);
  const encontrada = clave.find((k) => texto.includes(normalizar(k)));
  const pass = output.derivada === false && Boolean(encontrada);
  return { pass, score: pass ? 1 : 0, reason: pass ? `Contiene "${encontrada}" (origen ${output.origen})` : `Esperaba uno de ${JSON.stringify(clave)}; obtuvo (${output.origen}): ${output.respuesta}` };
};
