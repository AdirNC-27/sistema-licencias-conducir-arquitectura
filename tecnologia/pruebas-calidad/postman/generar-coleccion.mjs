/**
 * Genera la colección de Postman a partir del contrato OpenAPI (docs/07-contrato-api/openapi.json).
 * Cada solicitud comprueba su código HTTP y que el JSON cumpla exactamente el esquema documentado
 * (validación del contrato). Uso: node generar-coleccion.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const contrato = JSON.parse(readFileSync(join(aqui, '..', '..', '..', 'docs', '07-contrato-api', 'openapi.json'), 'utf8'));

// ---------- OpenAPI 3.0 → JSON Schema (lo que valida Postman) ----------
const CLAVES = new Set(['type', 'properties', 'required', 'items', 'enum', 'additionalProperties']);

function aJsonSchema(nodo) {
  if (nodo.$ref) return aJsonSchema(contrato.components.schemas[nodo.$ref.split('/').pop()]);
  if (nodo.allOf?.length === 1) {
    const interno = aJsonSchema(nodo.allOf[0]);
    return nodo.nullable ? { anyOf: [interno, { type: 'null' }] } : interno;
  }
  const salida = {};
  for (const [clave, valor] of Object.entries(nodo)) {
    if (!CLAVES.has(clave)) continue;
    if (clave === 'properties') salida.properties = Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, aJsonSchema(v)]));
    else if (clave === 'items') salida.items = aJsonSchema(valor);
    else salida[clave] = valor;
  }
  if (salida.type === 'object' && salida.properties && salida.additionalProperties === undefined) salida.additionalProperties = false;
  if (nodo.nullable) {
    if (salida.enum) salida.enum = [...salida.enum, null];
    salida.type = [salida.type, 'null'];
  }
  return salida;
}

function esquemaDe(metodo, ruta, estado) {
  const op = contrato.paths[ruta]?.[metodo];
  if (!op) throw new Error(`El contrato no tiene ${metodo.toUpperCase()} ${ruta}`);
  const respuesta = op.responses[String(estado)];
  if (!respuesta) throw new Error(`El contrato de ${metodo.toUpperCase()} ${ruta} no documenta el ${estado}`);
  const json = respuesta.content?.['application/json']?.schema;
  return json ? aJsonSchema(json) : null;
}

// ---------- Construcción de solicitudes ----------
const TOKENS = {
  postulante: 'tokenPostulante',
  postulante2: 'tokenPostulante2',
  gestor: 'tokenGestor',
  evaluador: 'tokenEvaluador',
  supervisor: 'tokenSupervisor',
  admin: 'tokenAdmin',
};

/**
 * s(nombre, 'METODO /ruta/del/contrato', estado, opciones)
 * opciones: url (si difiere de la ruta), como (rol), json, form, consulta, cabeceras, pruebas (código JS), previo (código JS)
 */
function s(nombre, operacion, estado, o = {}) {
  const [metodo, ruta] = operacion.split(' ');
  const esquema = esquemaDe(metodo.toLowerCase(), ruta, estado);
  const url = `{{baseUrl}}${o.url ?? ruta.replace(/^\/api/, '')}`;
  const pruebas = [
    `pm.test('Responde ${estado}', () => pm.response.to.have.status(${estado}));`,
    `pm.test('Responde en menos de 1 s (EQ-03)', () => pm.expect(pm.response.responseTime).to.be.below(1000));`,
  ];
  if (esquema) {
    pruebas.push(`const esquema = ${JSON.stringify(esquema)};`);
    pruebas.push(`pm.test('Cumple el contrato OpenAPI (${estado})', () => pm.response.to.have.jsonSchema(esquema));`);
    pruebas.push(`const cuerpo = pm.response.json();`);
  }
  if (o.pruebas) pruebas.push(o.pruebas.trim());

  const solicitud = { method: metodo, header: [], url: crearUrl(url, o.consulta) };
  if (o.como) solicitud.auth = { type: 'bearer', bearer: [{ key: 'token', value: `{{${TOKENS[o.como]}}}`, type: 'string' }] };
  else solicitud.auth = { type: 'noauth' };
  for (const [key, value] of Object.entries(o.cabeceras ?? {})) solicitud.header.push({ key, value });
  if (o.json) {
    solicitud.header.push({ key: 'Content-Type', value: 'application/json' });
    // '#{{variable}}' marca un número: se escribe sin comillas para que el JSON lleve un número, no un texto
    const raw = JSON.stringify(o.json, null, 2).replace(/"#(\{\{\w+\}\})"/g, '$1');
    solicitud.body = { mode: 'raw', raw, options: { raw: { language: 'json' } } };
  }
  if (o.form) solicitud.body = { mode: 'formdata', formdata: o.form };
  const eventos = [{ listen: 'test', script: { type: 'text/javascript', exec: pruebas.join('\n').split('\n') } }];
  if (o.previo) eventos.unshift({ listen: 'prerequest', script: { type: 'text/javascript', exec: o.previo.trim().split('\n') } });
  return { name: nombre, event: eventos, request: solicitud };
}

function crearUrl(url, consulta = {}) {
  const pares = Object.entries(consulta);
  const raw = pares.length ? `${url}?${pares.map(([k, v]) => `${k}=${v}`).join('&')}` : url;
  const sinBase = url.replace('{{baseUrl}}/', '');
  return { raw, host: ['{{baseUrl}}'], path: sinBase.split('/'), ...(pares.length && { query: pares.map(([key, value]) => ({ key, value: String(value) })) }) };
}

const archivo = (tipo, ruta = 'archivos/documento.pdf', fecha) => [
  { key: 'tipo', value: tipo, type: 'text' },
  ...(fecha ? [{ key: 'fechaEmision', value: fecha, type: 'text' }] : []),
  { key: 'archivo', type: 'file', src: ruta },
];
const etapa = (esperada) => `pm.test('El expediente está en ${esperada}', () => pm.expect(cuerpo.etapa).to.eql('${esperada}'));`;
const mensaje = (texto) => `pm.test('Mensaje: ${texto.replace(/'/g, '')}', () => pm.expect(cuerpo.mensaje).to.include('${texto}'));`;

// ---------- Colección ----------
const carpetas = [
  {
    name: '01 · Inicio de sesión (RF01)',
    description: 'Obtiene el token de cada rol. Ejecutar primero.',
    item: [
      s('Postulante 45892014', 'POST /api/auth/login', 200, {
        json: { usuario: '45892014', clave: 'demo123' },
        previo: `
// Fechas que usa la colección (UTC, como el servidor)
const d = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
pm.collectionVariables.set('ayer', d(-1));
pm.collectionVariables.set('numeroOperacion', String(Date.now()).slice(-10));`,
        pruebas: `
pm.collectionVariables.set('tokenPostulante', cuerpo.token);
pm.collectionVariables.set('postulanteId', cuerpo.usuario.postulanteId);
pm.test('Rol POSTULANTE', () => pm.expect(cuerpo.usuario.rol).to.eql('POSTULANTE'));`,
      }),
      s('Postulante 70123456', 'POST /api/auth/login', 200, {
        json: { usuario: '70123456', clave: 'demo123' },
        pruebas: `pm.collectionVariables.set('tokenPostulante2', cuerpo.token);\npm.collectionVariables.set('postulante2Id', cuerpo.usuario.postulanteId);`,
      }),
      ...['gestor', 'evaluador', 'supervisor', 'admin'].map((u) =>
        s(`Personal: ${u}`, 'POST /api/auth/login', 200, {
          json: { usuario: u, clave: 'demo123' },
          pruebas: `pm.collectionVariables.set('${TOKENS[u]}', cuerpo.token);`,
        }),
      ),
      s('Clave incorrecta', 'POST /api/auth/login', 401, { json: { usuario: 'gestor', clave: 'incorrecta' }, pruebas: mensaje('Usuario o contraseña incorrectos') }),
      s('Sin datos', 'POST /api/auth/login', 400, { json: {}, pruebas: `pm.test('Explica cada dato faltante', () => pm.expect(cuerpo.detalles).to.include('usuario es obligatorio'));` }),
      s('Usuario del token', 'GET /api/auth/yo', 200, { como: 'postulante', pruebas: `pm.test('Es el postulante', () => pm.expect(cuerpo.usuario).to.eql('45892014'));` }),
    ],
  },
  {
    name: '02 · Requisitos del TUPA (RF22)',
    item: [
      s('Moto II-B', 'GET /api/requisitos', 200, { consulta: { categoria: 'II-B' }, pruebas: `pm.test('Tasa S/ 69.90', () => pm.expect(cuerpo.tasa).to.eql(69.9));` }),
      s('Mototaxi II-C', 'GET /api/requisitos', 200, {
        consulta: { categoria: 'II-C' },
        pruebas: `
pm.test('Tasa S/ 69.40', () => pm.expect(cuerpo.tasa).to.eql(69.4));
pm.test('Pide la constancia COFIPRO', () => pm.expect(cuerpo.requisitos.map((r) => r.documento)).to.include('CONSTANCIA_COFIPRO'));`,
      }),
      s('Categoría inexistente', 'GET /api/requisitos', 400, { consulta: { categoria: 'II-X' } }),
    ],
  },
  {
    name: '03 · Expediente y seguimiento (RF02, RF10)',
    item: [
      s('Iniciar trámite II-C', 'POST /api/expedientes', 201, {
        como: 'postulante',
        json: { tipoTramite: 'EMISION', categoria: 'II-C' },
        pruebas: `pm.collectionVariables.set('expedienteId', cuerpo.id);\n${etapa('DOCUMENTOS')}\npm.test('Plazo de 10 días hábiles', () => pm.expect(cuerpo.plazo.diasRestantes).to.be.at.most(10));`,
      }),
      s('Segundo trámite en curso', 'POST /api/expedientes', 409, { como: 'postulante', json: { tipoTramite: 'EMISION', categoria: 'II-C' }, pruebas: mensaje('Ya tiene un trámite en curso') }),
      s('Categoría inválida', 'POST /api/expedientes', 400, {
        como: 'postulante',
        json: { tipoTramite: 'EMISION', categoria: 'II-X' },
        pruebas: `pm.test('Explica el error en español', () => pm.expect(cuerpo.detalles).to.include('categoria debe ser uno de estos valores: II-B, II-C'));`,
      }),
      s('Mis trámites', 'GET /api/expedientes/mios', 200, { como: 'postulante', pruebas: `pm.test('Incluye el trámite', () => pm.expect(cuerpo.map((e) => e.id)).to.include(pm.collectionVariables.get('expedienteId')));` }),
      s('Detalle del expediente', 'GET /api/expedientes/{id}', 200, { url: '/expedientes/{{expedienteId}}', como: 'postulante', pruebas: etapa('DOCUMENTOS') }),
      s('Expediente inexistente', 'GET /api/expedientes/{id}', 404, { url: '/expedientes/999999', como: 'gestor' }),
      s('Identificador no numérico', 'GET /api/expedientes/{id}', 400, { url: '/expedientes/abc', como: 'gestor' }),
      s('Postulante 2 inicia su trámite II-B', 'POST /api/expedientes', 201, {
        como: 'postulante2',
        json: { tipoTramite: 'EMISION', categoria: 'II-B' },
        pruebas: `pm.collectionVariables.set('expediente2Id', cuerpo.id);`,
      }),
      s('Postulante 2 adjunta su fotografía', 'POST /api/expedientes/{id}/documentos', 201, {
        url: '/expedientes/{{expediente2Id}}/documentos',
        como: 'postulante2',
        form: archivo('FOTOGRAFIA'),
        pruebas: `pm.collectionVariables.set('documento2Id', cuerpo.id);`,
      }),
      s('Bandeja del gestor', 'GET /api/expedientes', 200, {
        como: 'gestor',
        consulta: { etapa: 'DOCUMENTOS', pagina: 1, tamano: 20 },
        pruebas: `pm.test('Muestra los dos trámites', () => pm.expect(cuerpo.total).to.be.at.least(2));`,
      }),
    ],
  },
  {
    name: '04 · Documentos (RF03, RF04)',
    item: [
      s('Formato no permitido', 'POST /api/expedientes/{id}/documentos', 422, {
        url: '/expedientes/{{expedienteId}}/documentos',
        como: 'postulante',
        form: archivo('FOTOGRAFIA', 'archivos/nota.txt'),
        pruebas: mensaje('Solo se aceptan PDF, JPG o PNG'),
      }),
      s('Certificado sin fecha de emisión', 'POST /api/expedientes/{id}/documentos', 422, {
        url: '/expedientes/{{expedienteId}}/documentos',
        como: 'postulante',
        form: archivo('CERTIFICADO_MEDICO'),
        pruebas: mensaje('Indique la fecha de emisión'),
      }),
      ...['DECLARACION_JURADA', 'CERTIFICADO_MEDICO', 'FOTOGRAFIA', 'CONSTANCIA_COFIPRO'].map((tipo) =>
        s(`Adjuntar ${tipo}`, 'POST /api/expedientes/{id}/documentos', 201, {
          url: '/expedientes/{{expedienteId}}/documentos',
          como: 'postulante',
          form: archivo(tipo, 'archivos/documento.pdf', tipo === 'CERTIFICADO_MEDICO' ? '{{ayer}}' : undefined),
          pruebas: `pm.collectionVariables.set('documento_${tipo}', cuerpo.id);\npm.test('Queda PENDIENTE', () => pm.expect(cuerpo.estado).to.eql('PENDIENTE'));`,
        }),
      ),
      s('Documentos del expediente', 'GET /api/expedientes/{id}/documentos', 200, {
        url: '/expedientes/{{expedienteId}}/documentos',
        como: 'postulante',
        pruebas: `pm.test('Los 4 documentos', () => pm.expect(cuerpo).to.have.length(4));`,
      }),
      s('El gestor abre el archivo', 'GET /api/documentos/{id}/archivo', 200, {
        url: '/documentos/{{documento_CERTIFICADO_MEDICO}}/archivo',
        como: 'gestor',
        pruebas: `pm.test('Es un PDF', () => pm.response.to.have.header('Content-Type', 'application/pdf'));`,
      }),
      s('Observar sin motivo', 'PATCH /api/documentos/{id}/revision', 422, {
        url: '/documentos/{{documento_FOTOGRAFIA}}/revision',
        como: 'gestor',
        json: { estado: 'OBSERVADO' },
        pruebas: mensaje('Indique el motivo'),
      }),
      s('Un postulante no puede revisar', 'PATCH /api/documentos/{id}/revision', 403, {
        url: '/documentos/{{documento_FOTOGRAFIA}}/revision',
        como: 'postulante',
        json: { estado: 'APROBADO' },
      }),
      ...['DECLARACION_JURADA', 'CERTIFICADO_MEDICO', 'FOTOGRAFIA', 'CONSTANCIA_COFIPRO'].map((tipo, i) =>
        s(`Aprobar ${tipo}`, 'PATCH /api/documentos/{id}/revision', 200, {
          url: `/documentos/{{documento_${tipo}}}/revision`,
          como: 'gestor',
          json: { estado: 'APROBADO' },
          pruebas: `pm.test('${i === 3 ? 'Con el último aprobado, el expediente queda completo' : 'Aprobado'}', () => pm.expect(cuerpo.expedienteCompleto).to.eql(${i === 3}));`,
        }),
      ),
      s('El expediente pasa a PAGO', 'GET /api/expedientes/{id}', 200, { url: '/expedientes/{{expedienteId}}', como: 'postulante', pruebas: etapa('PAGO') }),
    ],
  },
  {
    name: '05 · Pagos (RF05, RF06)',
    item: [
      s('Monto que no es la tasa', 'POST /api/expedientes/{id}/pagos', 422, {
        url: '/expedientes/{{expedienteId}}/pagos',
        como: 'postulante',
        json: { numeroOperacion: '{{numeroOperacion}}', monto: 69.9, fechaPago: '{{ayer}}' },
      }),
      s('Registrar el recibo', 'POST /api/expedientes/{id}/pagos', 201, {
        url: '/expedientes/{{expedienteId}}/pagos',
        como: 'postulante',
        json: { numeroOperacion: '{{numeroOperacion}}', monto: 69.4, fechaPago: '{{ayer}}' },
        pruebas: `pm.collectionVariables.set('pagoId', cuerpo.id);\npm.test('Queda PENDIENTE', () => pm.expect(cuerpo.estado).to.eql('PENDIENTE'));`,
      }),
      s('Segundo recibo pendiente', 'POST /api/expedientes/{id}/pagos', 409, {
        url: '/expedientes/{{expedienteId}}/pagos',
        como: 'postulante',
        json: { numeroOperacion: '9{{numeroOperacion}}', monto: 69.4, fechaPago: '{{ayer}}' },
      }),
      s('El gestor verifica el pago', 'PATCH /api/pagos/{id}/verificacion', 200, {
        url: '/pagos/{{pagoId}}/verificacion',
        como: 'gestor',
        json: { estado: 'VERIFICADO' },
        pruebas: `pm.test('VERIFICADO', () => pm.expect(cuerpo.estado).to.eql('VERIFICADO'));`,
      }),
      s('El expediente pasa a CITA', 'GET /api/expedientes/{id}', 200, { url: '/expedientes/{{expedienteId}}', como: 'postulante', pruebas: etapa('CITA') }),
    ],
  },
  {
    name: '06 · Cupos y citas (RF07, RF21)',
    item: [
      s('El gestor no habilita cupos', 'POST /api/cupos', 403, { como: 'gestor', json: { fecha: '2030-01-07', hora: '08:00', tipo: 'CONOCIMIENTOS', capacidad: 5 } }),
      s('Habilitar horario de conocimientos', 'POST /api/cupos', 201, {
        como: 'admin',
        previo: `
// Próximo día permitido a partir de pasado mañana (conocimientos: lunes a miércoles; manejo: martes a viernes)
const siguiente = (dias) => { for (let n = 2; ; n++) { const f = new Date(Date.now() + n * 864e5); if (dias.includes(f.getUTCDay())) return f.toISOString().slice(0, 10); } };
pm.collectionVariables.set('fechaConocimientos', siguiente([1, 2, 3]));
pm.collectionVariables.set('fechaManejo', siguiente([2, 3, 4, 5]));
pm.collectionVariables.set('fechaJueves', siguiente([4]));
// Hora poco común y variable, para poder repetir la colección sin chocar con un horario existente
pm.collectionVariables.set('horaCupo', '19:' + String(Math.floor(Math.random() * 60)).padStart(2, '0'));`,
        json: { fecha: '{{fechaConocimientos}}', hora: '{{horaCupo}}', tipo: 'CONOCIMIENTOS', capacidad: 10 },
        pruebas: `pm.collectionVariables.set('cupoConocimientosId', cuerpo.id);\npm.test('Con 10 cupos libres', () => pm.expect(cuerpo.disponibles).to.eql(10));`,
      }),
      s('Horario repetido', 'POST /api/cupos', 409, {
        como: 'admin',
        json: { fecha: '{{fechaConocimientos}}', hora: '{{horaCupo}}', tipo: 'CONOCIMIENTOS', capacidad: 10 },
        pruebas: mensaje('Ya existe un horario de conocimientos'),
      }),
      s('Conocimientos en jueves', 'POST /api/cupos', 422, { como: 'admin', json: { fecha: '{{fechaJueves}}', hora: '08:30', tipo: 'CONOCIMIENTOS', capacidad: 10 } }),
      s('Horarios disponibles', 'GET /api/cupos', 200, {
        como: 'postulante',
        consulta: { tipo: 'CONOCIMIENTOS' },
        pruebas: `pm.test('Incluye el horario nuevo', () => pm.expect(cuerpo.map((c) => c.id)).to.include(pm.collectionVariables.get('cupoConocimientosId')));`,
      }),
      s('Reservar la cita de conocimientos', 'POST /api/expedientes/{id}/citas', 201, {
        url: '/expedientes/{{expedienteId}}/citas',
        como: 'postulante',
        json: { cupoId: '#{{cupoConocimientosId}}' },
      }),
      s('Citas del expediente', 'GET /api/expedientes/{id}/citas', 200, { url: '/expedientes/{{expedienteId}}/citas', como: 'postulante', pruebas: `pm.test('Una cita', () => pm.expect(cuerpo).to.have.length(1));` }),
      s('El expediente pasa a EXAMEN_CONOCIMIENTOS', 'GET /api/expedientes/{id}', 200, { url: '/expedientes/{{expedienteId}}', como: 'postulante', pruebas: etapa('EXAMEN_CONOCIMIENTOS') }),
    ],
  },
  {
    name: '07 · Evaluaciones (RF08, RF09, EQ-09)',
    item: [
      s('Un postulante no registra notas', 'POST /api/expedientes/{id}/evaluaciones/{tipo}/resultado', 403, {
        url: '/expedientes/{{expedienteId}}/evaluaciones/CONOCIMIENTOS/resultado',
        como: 'postulante',
        json: { puntaje: 20 },
      }),
      s('Nota fuera de rango', 'POST /api/expedientes/{id}/evaluaciones/{tipo}/resultado', 400, {
        url: '/expedientes/{{expedienteId}}/evaluaciones/CONOCIMIENTOS/resultado',
        como: 'evaluador',
        json: { puntaje: 25 },
        pruebas: `pm.test('Explica el rango', () => pm.expect(cuerpo.detalles).to.include('puntaje debe ser menor o igual que 20'));`,
      }),
      s('Registrar conocimientos: 16', 'POST /api/expedientes/{id}/evaluaciones/{tipo}/resultado', 201, {
        url: '/expedientes/{{expedienteId}}/evaluaciones/CONOCIMIENTOS/resultado',
        como: 'evaluador',
        json: { puntaje: 16 },
        pruebas: `pm.collectionVariables.set('evaluacionId', cuerpo.id);\npm.test('REGISTRADO, aún sin bloquear', () => { pm.expect(cuerpo.estado).to.eql('REGISTRADO'); pm.expect(cuerpo.bloqueada).to.eql(false); });`,
      }),
      s('Corregir antes de validar', 'PATCH /api/evaluaciones/{id}/resultado', 200, {
        url: '/evaluaciones/{{evaluacionId}}/resultado',
        como: 'evaluador',
        json: { puntaje: 17, motivo: 'Error de digitación' },
        pruebas: `pm.test('Nota corregida', () => pm.expect(cuerpo.resultadoActual.puntaje).to.eql(17));`,
      }),
      s('Resultados por validar', 'GET /api/evaluaciones/por-validar', 200, {
        como: 'supervisor',
        pruebas: `pm.test('Incluye la evaluación', () => pm.expect(cuerpo.map((e) => e.id)).to.include(pm.collectionVariables.get('evaluacionId')));`,
      }),
      s('Validar y bloquear', 'POST /api/evaluaciones/{id}/validacion', 200, {
        url: '/evaluaciones/{{evaluacionId}}/validacion',
        como: 'supervisor',
        pruebas: `pm.test('Queda bloqueada', () => pm.expect(cuerpo.bloqueada).to.eql(true));`,
      }),
      s('Corregir un resultado validado (EQ-09)', 'PATCH /api/evaluaciones/{id}/resultado', 409, {
        url: '/evaluaciones/{{evaluacionId}}/resultado',
        como: 'evaluador',
        json: { puntaje: 20, motivo: 'Intento de cambio' },
      }),
      s('Validar dos veces (EQ-09)', 'POST /api/evaluaciones/{id}/validacion', 409, { url: '/evaluaciones/{{evaluacionId}}/validacion', como: 'supervisor' }),
      s('El postulante ve su historial, no el resultado interno (RF19)', 'GET /api/expedientes/{id}/evaluaciones', 200, {
        url: '/expedientes/{{expedienteId}}/evaluaciones',
        como: 'postulante',
        pruebas: `pm.test('resultadoActual oculto', () => pm.expect(cuerpo[0].resultadoActual).to.eql(null));`,
      }),
      s('Habilitar horario de manejo', 'POST /api/cupos', 201, {
        como: 'admin',
        json: { fecha: '{{fechaManejo}}', hora: '{{horaCupo}}', tipo: 'MANEJO', capacidad: 8 },
        pruebas: `pm.collectionVariables.set('cupoManejoId', cuerpo.id);`,
      }),
      s('Reservar la cita de manejo', 'POST /api/expedientes/{id}/citas', 201, {
        url: '/expedientes/{{expedienteId}}/citas',
        como: 'postulante',
        json: { cupoId: '#{{cupoManejoId}}' },
      }),
      s('Registrar manejo: 15', 'POST /api/expedientes/{id}/evaluaciones/{tipo}/resultado', 201, {
        url: '/expedientes/{{expedienteId}}/evaluaciones/MANEJO/resultado',
        como: 'evaluador',
        json: { puntaje: 15, faltaEliminatoria: false },
        pruebas: `pm.collectionVariables.set('evaluacionManejoId', cuerpo.id);`,
      }),
      s('Validar manejo', 'POST /api/evaluaciones/{id}/validacion', 200, { url: '/evaluaciones/{{evaluacionManejoId}}/validacion', como: 'supervisor' }),
      s('El expediente pasa a EMISION', 'GET /api/expedientes/{id}', 200, { url: '/expedientes/{{expedienteId}}', como: 'postulante', pruebas: etapa('EMISION') }),
    ],
  },
  {
    name: '08 · Revisión, emisión, avisos y auditoría (RF11, RF12, RF13, RF16, RF17, RF24, RF27, EQ-07)',
    item: [
      s('Revisión: faltan las verificaciones', 'GET /api/expedientes/{id}/revision', 200, {
        url: '/expedientes/{{expedienteId}}/revision',
        como: 'supervisor',
        pruebas: `
pm.test('II-C: certificado, COFIPRO y sanciones', () => pm.expect(cuerpo.verificacionesObligatorias).to.eql(['SNC_CERTIFICADO_MEDICO', 'SNC_COFIPRO', 'SANCIONES']));
pm.test('Aún no se puede emitir', () => pm.expect(cuerpo.listoParaEmitir).to.eql(false));`,
      }),
      s('El postulante no ve la revisión interna', 'GET /api/expedientes/{id}/revision', 403, { url: '/expedientes/{{expedienteId}}/revision', como: 'postulante' }),
      s('Emitir sin verificaciones (RF24)', 'PATCH /api/expedientes/{id}/emision', 422, { url: '/expedientes/{{expedienteId}}/emision', como: 'supervisor', pruebas: mensaje('Falta verificar') }),
      s('Certificado médico en el SNC: conforme', 'POST /api/expedientes/{id}/verificaciones', 201, {
        url: '/expedientes/{{expedienteId}}/verificaciones',
        como: 'gestor',
        json: { tipo: 'SNC_CERTIFICADO_MEDICO', resultado: 'CONFORME', detalle: 'Registrado en el SNC por la clínica' },
      }),
      s('COFIPRO en el SNC: conforme', 'POST /api/expedientes/{id}/verificaciones', 201, { url: '/expedientes/{{expedienteId}}/verificaciones', como: 'gestor', json: { tipo: 'SNC_COFIPRO', resultado: 'CONFORME' } }),
      s('No conforme sin detalle', 'POST /api/expedientes/{id}/verificaciones', 422, { url: '/expedientes/{{expedienteId}}/verificaciones', como: 'gestor', json: { tipo: 'SANCIONES', resultado: 'NO_CONFORME' } }),
      s('Sanciones: papeleta pendiente (RF27)', 'POST /api/expedientes/{id}/verificaciones', 201, {
        url: '/expedientes/{{expedienteId}}/verificaciones',
        como: 'gestor',
        json: { tipo: 'SANCIONES', resultado: 'NO_CONFORME', detalle: 'Papeleta pendiente en el récord del conductor' },
      }),
      s('Con sanción pendiente no se emite (RF27)', 'PATCH /api/expedientes/{id}/emision', 422, { url: '/expedientes/{{expedienteId}}/emision', como: 'supervisor', pruebas: mensaje('No conforme') }),
      s('Sanciones: papeleta pagada', 'POST /api/expedientes/{id}/verificaciones', 201, {
        url: '/expedientes/{{expedienteId}}/verificaciones',
        como: 'gestor',
        json: { tipo: 'SANCIONES', resultado: 'CONFORME', detalle: 'Récord sin pendientes' },
      }),
      s('El supervisor no registra verificaciones', 'POST /api/expedientes/{id}/verificaciones', 403, { url: '/expedientes/{{expedienteId}}/verificaciones', como: 'supervisor', json: { tipo: 'SANCIONES', resultado: 'CONFORME' } }),
      s('El supervisor observa el expediente (RF11)', 'POST /api/expedientes/{id}/observaciones', 201, {
        url: '/expedientes/{{expedienteId}}/observaciones',
        como: 'supervisor',
        json: { motivo: 'La constancia COFIPRO del SNC no coincide con el DNI' },
        pruebas: `pm.collectionVariables.set('observacionId', cuerpo.id);
pm.test('Queda ABIERTA', () => pm.expect(cuerpo.estado).to.eql('ABIERTA'));`,
      }),
      s('Segunda observación abierta', 'POST /api/expedientes/{id}/observaciones', 409, { url: '/expedientes/{{expedienteId}}/observaciones', como: 'supervisor', json: { motivo: 'Otra observación del mismo expediente' } }),
      s('Expedientes devueltos al gestor', 'GET /api/observaciones/abiertas', 200, {
        como: 'gestor',
        pruebas: `pm.test('Aparece el expediente observado', () => pm.expect(cuerpo.map((o) => o.id)).to.include(pm.collectionVariables.get('observacionId')));`,
      }),
      s('Con observación abierta no se emite', 'PATCH /api/expedientes/{id}/emision', 422, { url: '/expedientes/{{expedienteId}}/emision', como: 'supervisor', pruebas: mensaje('observación') }),
      s('El gestor atiende la observación', 'PATCH /api/observaciones/{id}/atencion', 200, {
        url: '/observaciones/{{observacionId}}/atencion',
        como: 'gestor',
        json: { respuesta: 'Se volvió a consultar el SNC: la constancia es correcta' },
        pruebas: `pm.test('Queda ATENDIDA', () => pm.expect(cuerpo.estado).to.eql('ATENDIDA'));`,
      }),
      s('Atender dos veces', 'PATCH /api/observaciones/{id}/atencion', 409, { url: '/observaciones/{{observacionId}}/atencion', como: 'gestor', json: { respuesta: 'Segunda atención de la misma' } }),
      s('Revisión: lista para emitir', 'GET /api/expedientes/{id}/revision', 200, {
        url: '/expedientes/{{expedienteId}}/revision',
        como: 'supervisor',
        pruebas: `pm.test('Sin pendientes', () => { pm.expect(cuerpo.pendientes).to.eql([]); pm.expect(cuerpo.listoParaEmitir).to.eql(true); });`,
      }),
      s('El gestor no autoriza la emisión', 'PATCH /api/expedientes/{id}/emision', 403, { url: '/expedientes/{{expedienteId}}/emision', como: 'gestor' }),
      s('Autorizar la emisión', 'PATCH /api/expedientes/{id}/emision', 200, { url: '/expedientes/{{expedienteId}}/emision', como: 'supervisor', pruebas: etapa('EMITIDA') }),
      s('Autorizar dos veces', 'PATCH /api/expedientes/{id}/emision', 409, { url: '/expedientes/{{expedienteId}}/emision', como: 'supervisor' }),
      s('Licencia aún no registrada', 'GET /api/expedientes/{id}/licencia', 404, { url: '/expedientes/{{expedienteId}}/licencia', como: 'postulante' }),
      s('Registrar la licencia para el SNC (RF24)', 'POST /api/expedientes/{id}/licencia', 201, {
        url: '/expedientes/{{expedienteId}}/licencia',
        como: 'gestor',
        json: { numero: 'q{{numeroOperacion}}' },
        pruebas: `pm.test('Número en mayúsculas', () => pm.expect(cuerpo.numero).to.eql('Q' + pm.collectionVariables.get('numeroOperacion')));`,
      }),
      s('Registrar la licencia dos veces', 'POST /api/expedientes/{id}/licencia', 409, { url: '/expedientes/{{expedienteId}}/licencia', como: 'gestor', json: { numero: 'Q00000001' } }),
      s('El postulante ve su licencia', 'GET /api/expedientes/{id}/licencia', 200, { url: '/expedientes/{{expedienteId}}/licencia', como: 'postulante' }),
      s('Otro postulante no ve la licencia (EQ-02)', 'GET /api/expedientes/{id}/licencia', 403, { url: '/expedientes/{{expedienteId}}/licencia', como: 'postulante2' }),
      s('Avisos del postulante', 'GET /api/notificaciones/mias', 200, {
        como: 'postulante',
        pruebas: `
pm.test('Recibió avisos del avance', () => pm.expect(cuerpo.length).to.be.at.least(5));
pm.test('El último es el de la licencia', () => pm.expect(cuerpo[0].asunto).to.include('fue registrada'));`,
      }),
      s('Auditoría de evaluaciones', 'GET /api/auditoria', 200, {
        como: 'supervisor',
        consulta: { entidad: 'evaluacion' },
        pruebas: `pm.test('La corrección quedó con su motivo (EQ-07)', () => pm.expect(cuerpo.map((r) => r.motivo)).to.include('Error de digitación'));`,
      }),
      s('Cuentas del sistema', 'GET /api/usuarios', 200, {
        como: 'admin',
        pruebas: `
const evaluador = cuerpo.find((c) => c.usuario === 'evaluador');
const postulante = cuerpo.find((c) => c.usuario === '45892014');
pm.collectionVariables.set('usuarioEvaluadorId', evaluador.id);
pm.collectionVariables.set('usuarioPostulanteId', postulante.id);`,
      }),
      s('Cambiar el rol del evaluador', 'PATCH /api/usuarios/{id}/rol', 200, {
        url: '/usuarios/{{usuarioEvaluadorId}}/rol',
        como: 'admin',
        json: { rol: 'SUPERVISOR' },
        pruebas: `pm.test('Ahora es SUPERVISOR', () => pm.expect(cuerpo.rol).to.eql('SUPERVISOR'));`,
      }),
      s('Devolver el rol de evaluador', 'PATCH /api/usuarios/{id}/rol', 200, { url: '/usuarios/{{usuarioEvaluadorId}}/rol', como: 'admin', json: { rol: 'EVALUADOR' } }),
      s('Un postulante no pasa a personal', 'PATCH /api/usuarios/{id}/rol', 422, { url: '/usuarios/{{usuarioPostulanteId}}/rol', como: 'admin', json: { rol: 'GESTOR' } }),
    ],
  },
  {
    name: '09 · Seguridad: autenticación y roles (EQ-01)',
    item: [
      s('Bandeja sin token', 'GET /api/expedientes', 401),
      s('Auditoría sin token', 'GET /api/auditoria', 401),
      s('Habilitar cupos sin token', 'POST /api/cupos', 401, { json: { fecha: '2030-01-07', hora: '08:00', tipo: 'CONOCIMIENTOS', capacidad: 5 } }),
      s('Token falso', 'GET /api/expedientes/mios', 401, { cabeceras: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjF9.firma-falsa' } }),
      s('Postulante en la bandeja del personal', 'GET /api/expedientes', 403, { como: 'postulante' }),
      s('Postulante en la auditoría', 'GET /api/auditoria', 403, { como: 'postulante' }),
      s('Postulante en las cuentas', 'GET /api/usuarios', 403, { como: 'postulante' }),
      s('Evaluador valida resultados', 'POST /api/evaluaciones/{id}/validacion', 403, { url: '/evaluaciones/{{evaluacionId}}/validacion', como: 'evaluador' }),
    ],
  },
  {
    name: '10 · Privacidad entre postulantes: 20 accesos ajenos (EQ-02)',
    description: 'Cada postulante intenta 10 operaciones sobre el trámite del otro. Las 20 deben responder 403.',
    item: [
      ...[
        ['ve el expediente', 'GET /api/expedientes/{id}', '/expedientes/{{ajeno}}'],
        ['ve los documentos', 'GET /api/expedientes/{id}/documentos', '/expedientes/{{ajeno}}/documentos'],
        ['ve los pagos', 'GET /api/expedientes/{id}/pagos', '/expedientes/{{ajeno}}/pagos'],
        ['ve las citas', 'GET /api/expedientes/{id}/citas', '/expedientes/{{ajeno}}/citas'],
        ['ve las evaluaciones', 'GET /api/expedientes/{id}/evaluaciones', '/expedientes/{{ajeno}}/evaluaciones'],
        ['ve los datos personales', 'GET /api/postulantes/{id}', '/postulantes/{{postulanteAjeno}}'],
        ['adjunta un documento', 'POST /api/expedientes/{id}/documentos', '/expedientes/{{ajeno}}/documentos', { form: archivo('FOTOGRAFIA') }],
        ['registra un pago', 'POST /api/expedientes/{id}/pagos', '/expedientes/{{ajeno}}/pagos', { json: { numeroOperacion: '7{{numeroOperacion}}', monto: 69.4, fechaPago: '{{ayer}}' } }],
        ['reserva una cita', 'POST /api/expedientes/{id}/citas', '/expedientes/{{ajeno}}/citas', { json: { cupoId: '#{{cupoConocimientosId}}' } }],
        ['descarga un archivo', 'GET /api/documentos/{id}/archivo', '/documentos/{{documentoAjeno}}/archivo'],
      ].flatMap(([accion, operacion, url, extra = {}]) =>
        [
          ['Postulante 1', 'postulante', '{{expediente2Id}}', '{{postulante2Id}}', '{{documento2Id}}'],
          ['Postulante 2', 'postulante2', '{{expedienteId}}', '{{postulanteId}}', '{{documento_CERTIFICADO_MEDICO}}'],
        ].map(([quien, como, ajeno, postulanteAjeno, documentoAjeno]) =>
          s(`${quien} ${accion} del otro`, operacion, 403, {
            ...extra,
            como,
            url: url.replace('{{ajeno}}', ajeno).replace('{{postulanteAjeno}}', postulanteAjeno).replace('{{documentoAjeno}}', documentoAjeno),
          }),
        ),
      ),
    ],
  },
  {
    name: '11 · Asistente virtual con la IA de orientación (RF14, RF15, HU25, EQ-08)',
    description: 'Sin IA_API_KEY el asistente responde con el texto aprobado (origen CONTENIDO); con la clave, la IA lo redacta (origen IA). En ambos casos, un pedido de acción o una pregunta ajena se deriva al gestor.',
    item: [
      s('Pregunta del trámite', 'POST /api/asistente/consultas', 201, {
        como: 'postulante',
        json: { pregunta: '¿Cuánto cuesta la licencia de mototaxi?' },
        pruebas: `
pm.test('Responde con contenido aprobado', () => { pm.expect(['IA', 'CONTENIDO']).to.include(cuerpo.origen); pm.expect(cuerpo.derivada).to.eql(false); });
pm.test('Menciona la tasa de la II-C', () => pm.expect(cuerpo.respuesta).to.include('69.40'));`,
      }),
      s('Estado del propio trámite', 'POST /api/asistente/consultas', 201, {
        como: 'postulante2',
        json: { pregunta: '¿Cómo va mi trámite?' },
        pruebas: `pm.test('Responde con su expediente', () => { pm.expect(cuerpo.origen).to.eql('ESTADO'); pm.expect(cuerpo.respuesta).to.include('revisión de documentos'); });`,
      }),
      s('Pedido de acción: se deriva (0 acciones)', 'POST /api/asistente/consultas', 201, {
        como: 'postulante',
        json: { pregunta: 'Aprueba mi expediente por favor' },
        pruebas: `pm.test('Derivada al gestor', () => { pm.expect(cuerpo.origen).to.eql('DERIVADA'); pm.expect(cuerpo.respuesta).to.include('no apruebo'); });`,
      }),
      s('Pregunta ajena al trámite: se deriva', 'POST /api/asistente/consultas', 201, {
        como: 'postulante',
        json: { pregunta: '¿Quién ganó el partido de fútbol ayer?' },
        pruebas: `pm.collectionVariables.set('consultaDerivadaId', cuerpo.id);
pm.test('Derivada al gestor', () => pm.expect(cuerpo.derivada).to.eql(true));`,
      }),
      s('Pregunta vacía', 'POST /api/asistente/consultas', 400, { como: 'postulante', json: { pregunta: '' } }),
      s('El personal no usa el chat del postulante', 'POST /api/asistente/consultas', 403, { como: 'gestor', json: { pregunta: '¿Cuánto cuesta?' } }),
      s('Consultas derivadas al gestor', 'GET /api/asistente/derivadas', 200, {
        como: 'gestor',
        pruebas: `pm.test('Incluye la consulta', () => pm.expect(cuerpo.map((c) => c.id)).to.include(pm.collectionVariables.get('consultaDerivadaId')));`,
      }),
      s('El postulante no ve la bandeja del gestor', 'GET /api/asistente/derivadas', 403, { como: 'postulante' }),
      s('El gestor responde (RF15)', 'PATCH /api/asistente/consultas/{id}/respuesta', 200, {
        url: '/asistente/consultas/{{consultaDerivadaId}}/respuesta',
        como: 'gestor',
        json: { respuesta: 'Solo atendemos consultas sobre la licencia de conducir.' },
      }),
      s('Responder dos veces', 'PATCH /api/asistente/consultas/{id}/respuesta', 409, { url: '/asistente/consultas/{{consultaDerivadaId}}/respuesta', como: 'gestor', json: { respuesta: 'Otra respuesta' } }),
      s('Mi conversación', 'GET /api/asistente/consultas/mias', 200, {
        como: 'postulante',
        pruebas: `pm.test('Ve la respuesta del gestor', () => pm.expect(cuerpo.map((c) => c.respuestaGestor)).to.include('Solo atendemos consultas sobre la licencia de conducir.'));`,
      }),
      s('Contenido aprobado (HU25)', 'GET /api/asistente/contenidos', 200, { como: 'admin', pruebas: `pm.test('25 contenidos iniciales o más', () => pm.expect(cuerpo.length).to.be.at.least(25));` }),
      s('Agregar contenido', 'POST /api/asistente/contenidos', 201, {
        como: 'admin',
        json: { tema: 'CITAS', pregunta: '¿Hay exámenes en días feriados?', respuesta: 'No, en los feriados no se toman exámenes.', palabrasClave: 'feriado' },
        pruebas: `pm.collectionVariables.set('contenidoId', cuerpo.id);`,
      }),
      s('Desactivar el contenido', 'PUT /api/asistente/contenidos/{id}', 200, {
        url: '/asistente/contenidos/{{contenidoId}}',
        como: 'admin',
        json: { tema: 'CITAS', pregunta: '¿Hay exámenes en días feriados?', respuesta: 'No, en los feriados no se toman exámenes.', activo: false },
        pruebas: `pm.test('Inactivo', () => pm.expect(cuerpo.activo).to.eql(false));`,
      }),
      s('El gestor no modifica el contenido', 'POST /api/asistente/contenidos', 403, { como: 'gestor', json: { tema: 'CITAS', pregunta: '¿Algo nuevo?', respuesta: 'Texto de prueba suficiente' } }),
      s('Pendientes del gestor', 'GET /api/asistente/pendientes', 200, {
        como: 'gestor',
        pruebas: `pm.test('Lista con texto, ruta y urgencia', () => cuerpo.forEach((p) => pm.expect(p).to.include.keys('codigo', 'texto', 'cantidad', 'urgente', 'ruta')));`,
      }),
      s('Recordatorios del postulante', 'GET /api/asistente/pendientes', 200, { como: 'postulante', pruebas: `pm.test('Es una lista', () => pm.expect(cuerpo).to.be.an('array'));` }),
      s('Sin sesión no hay pendientes', 'GET /api/asistente/pendientes', 401),
      s('El supervisor pregunta qué tiene pendiente', 'POST /api/asistente/personal/consultas', 201, {
        como: 'supervisor',
        json: { pregunta: '¿Qué tengo pendiente?' },
        pruebas: `pm.test('Responde con datos del sistema', () => pm.expect(cuerpo.origen).to.eql('ESTADO'));`,
      }),
      s('El gestor consulta un procedimiento', 'POST /api/asistente/personal/consultas', 201, {
        como: 'gestor',
        json: { pregunta: '¿Cómo verifico un pago?' },
        pruebas: `pm.test('Procedimiento aprobado', () => pm.expect(['CONTENIDO', 'IA']).to.include(cuerpo.origen));`,
      }),
      s('Pedido de acción del personal: no se ejecuta', 'POST /api/asistente/personal/consultas', 201, {
        como: 'supervisor',
        json: { pregunta: 'Autoriza la emisión del expediente 1' },
        pruebas: `pm.test('Explica que no ejecuta acciones', () => pm.expect(cuerpo.respuesta).to.include('No ejecuto acciones'));`,
      }),
      s('El postulante no usa el chat del personal', 'POST /api/asistente/personal/consultas', 403, { como: 'postulante', json: { pregunta: '¿Qué tengo pendiente?' } }),
    ],
  },
];

const coleccion = {
  info: {
    name: 'Sistema de Licencias Clase B · API',
    description:
      'Pruebas funcionales y de contrato de la API. Recorre el trámite completo con los 5 roles y comprueba seguridad (EQ-01), privacidad (EQ-02), trazabilidad (EQ-07), integridad (EQ-09) y el asistente (EQ-08). ' +
      'Requiere la base recién migrada. Generada desde docs/07-contrato-api/openapi.json con generar-coleccion.mjs.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: carpetas,
  variable: [],
};

const entorno = {
  name: 'Licencias · local',
  values: [{ key: 'baseUrl', value: 'http://localhost:3000/api', type: 'default', enabled: true }],
  _postman_variable_scope: 'environment',
};

writeFileSync(join(aqui, 'licencias-clase-b.postman_collection.json'), `${JSON.stringify(coleccion, null, 2)}\n`);
writeFileSync(join(aqui, 'local.postman_environment.json'), `${JSON.stringify(entorno, null, 2)}\n`);
const total = carpetas.reduce((n, c) => n + c.item.length, 0);
console.log(`Colección generada: ${carpetas.length} carpetas, ${total} solicitudes.`);
