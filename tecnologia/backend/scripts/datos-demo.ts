/**
 * Datos de demostración: 20 postulantes ficticios, cada uno en una etapa distinta del trámite,
 * para que el gestor, el evaluador, el supervisor y el administrador tengan trabajo a la vista.
 *
 * - Las cuentas de postulante se insertan por SQL (como la migración de datos iniciales), porque
 *   el registro público valida el DNI en API Perú y estos DNI son ficticios.
 * - Todo lo demás pasa por la API, con las mismas reglas de negocio y la misma auditoría que el portal.
 * - Es idempotente: si el DNI ya existe, ese postulante se omite.
 *
 * Uso (con docker compose levantado):  npm run datos:demo
 * Variables opcionales: API_URL, DB_HOST, DB_PUERTO, DB_USUARIO, DB_CLAVE, DB_NOMBRE.
 */
import { Client } from 'pg';

const API = process.env.API_URL ?? 'http://localhost:3000/api';
const CLAVE = 'demo123';
const CLAVE_CIFRADA = '$2a$10$mNPMhuBUTq6FXU/yUGQ2Pe5uvJXkSjYk2ZDIumph1xPNC2JOG6EVS'; // bcrypt de demo123

type Categoria = 'II-B' | 'II-C';
type Paso =
  | 'SIN_DOCUMENTOS'
  | 'DOCUMENTOS_POR_REVISAR'
  | 'DOCUMENTO_OBSERVADO'
  | 'SIN_PAGO'
  | 'PAGO_POR_VERIFICAR'
  | 'SIN_CITA'
  | 'CITA_CONOCIMIENTOS'
  | 'CONOCIMIENTOS_POR_VALIDAR'
  | 'CONOCIMIENTOS_DESAPROBADO'
  | 'CITA_MANEJO'
  | 'MANEJO_POR_VALIDAR'
  | 'MANEJO_FALTA_ELIMINATORIA'
  | 'EMISION_SIN_VERIFICAR'
  | 'EMISION_LISTA'
  | 'EMISION_SANCION'
  | 'EMISION_OBSERVADA'
  | 'EMITIDA_SIN_LICENCIA'
  | 'EMITIDA_CON_LICENCIA';

interface Persona {
  dni: string;
  nombres: string;
  apellidos: string;
  celular: string;
  categoria: Categoria;
  paso: Paso;
  dias: number; // antigüedad del expediente
  preguntas?: string[];
}

const PERSONAS: Persona[] = [
  { dni: '72814305', nombres: 'Rosa Elena', apellidos: 'Huamán Quispe', celular: '966104215', categoria: 'II-B', paso: 'SIN_DOCUMENTOS', dias: 0, preguntas: ['¿Qué documentos necesito para la licencia?'] },
  { dni: '70461932', nombres: 'Luis Alberto', apellidos: 'Cárdenas Palomino', celular: '978320641', categoria: 'II-B', paso: 'DOCUMENTOS_POR_REVISAR', dias: 1 },
  { dni: '74120587', nombres: 'Edwin', apellidos: 'Gutiérrez Ccahuana', celular: '951277803', categoria: 'II-C', paso: 'DOCUMENTOS_POR_REVISAR', dias: 1, preguntas: ['¿Dónde saco la constancia COFIPRO?'] },
  { dni: '71938264', nombres: 'Milagros', apellidos: 'Pariona Tello', celular: '987451029', categoria: 'II-B', paso: 'DOCUMENTO_OBSERVADO', dias: 3, preguntas: ['Revisen otra vez mi foto, por favor'] },
  { dni: '73305816', nombres: 'Jhon Wilber', apellidos: 'Ayala Bautista', celular: '944812367', categoria: 'II-B', paso: 'SIN_PAGO', dias: 4, preguntas: ['¿Cuánto cuesta la licencia?'] },
  { dni: '70852419', nombres: 'Ruth Noemí', apellidos: 'Mendoza Allcca', celular: '962538714', categoria: 'II-C', paso: 'PAGO_POR_VERIFICAR', dias: 5 },
  { dni: '72690143', nombres: 'Fredy', apellidos: 'Sulca Yupanqui', celular: '935667120', categoria: 'II-B', paso: 'PAGO_POR_VERIFICAR', dias: 5, preguntas: ['Ya pagué, ¿pueden verificar mi pago hoy?'] },
  { dni: '75017328', nombres: 'Karina', apellidos: 'Tineo Romero', celular: '989204356', categoria: 'II-B', paso: 'SIN_CITA', dias: 6, preguntas: ['¿Qué días hay examen de conocimientos?'] },
  { dni: '71284650', nombres: 'Wilmer', apellidos: 'Quispe Huamaní', celular: '958013472', categoria: 'II-B', paso: 'CITA_CONOCIMIENTOS', dias: 8 },
  { dni: '74563091', nombres: 'Yeni Luz', apellidos: 'Ccorahua Prado', celular: '947390518', categoria: 'II-C', paso: 'CONOCIMIENTOS_POR_VALIDAR', dias: 9 },
  { dni: '70239874', nombres: 'Abel', apellidos: 'Janampa Vargas', celular: '965821403', categoria: 'II-B', paso: 'CONOCIMIENTOS_DESAPROBADO', dias: 10, preguntas: ['¿Cuántos intentos tengo para los exámenes?'] },
  { dni: '73748125', nombres: 'Sonia', apellidos: 'Huancahuari Lapa', celular: '976145230', categoria: 'II-B', paso: 'CITA_MANEJO', dias: 11 },
  { dni: '72051386', nombres: 'Percy', apellidos: 'Arango Ventura', celular: '943507861', categoria: 'II-C', paso: 'MANEJO_POR_VALIDAR', dias: 12 },
  { dni: '71607429', nombres: 'Gladys', apellidos: 'Ore Chávez', celular: '981630274', categoria: 'II-B', paso: 'MANEJO_FALTA_ELIMINATORIA', dias: 13, preguntas: ['¿Pueden cambiar la nota de mi examen de manejo?'] },
  { dni: '74890532', nombres: 'Rubén Darío', apellidos: 'Contreras Bendezú', celular: '954218097', categoria: 'II-C', paso: 'EMISION_SIN_VERIFICAR', dias: 15 },
  { dni: '70714863', nombres: 'Lizbeth', apellidos: 'Rojas Huaytalla', celular: '968742105', categoria: 'II-B', paso: 'EMISION_LISTA', dias: 16, preguntas: ['¿Cómo va mi trámite?'] },
  { dni: '72436918', nombres: 'Hugo', apellidos: 'Pillaca Ñaupa', celular: '937281654', categoria: 'II-C', paso: 'EMISION_SANCION', dias: 17 },
  { dni: '73129604', nombres: 'Nancy', apellidos: 'Velarde Curo', celular: '986503217', categoria: 'II-C', paso: 'EMISION_OBSERVADA', dias: 18 },
  { dni: '75281047', nombres: 'César Augusto', apellidos: 'Lozano Mitma', celular: '945176382', categoria: 'II-B', paso: 'EMITIDA_SIN_LICENCIA', dias: 20 },
  { dni: '70985236', nombres: 'Marleny', apellidos: 'Cisneros Auccasi', celular: '972814560', categoria: 'II-C', paso: 'EMITIDA_CON_LICENCIA', dias: 22, preguntas: ['¿Cuándo recojo mi licencia?'] },
];

/** Orden en que avanza el trámite; cada persona se detiene en su paso. */
const ORDEN: Paso[] = [
  'SIN_DOCUMENTOS',
  'DOCUMENTOS_POR_REVISAR',
  'SIN_PAGO',
  'PAGO_POR_VERIFICAR',
  'SIN_CITA',
  'CITA_CONOCIMIENTOS',
  'CONOCIMIENTOS_POR_VALIDAR',
  'CITA_MANEJO',
  'MANEJO_POR_VALIDAR',
  'EMISION_SIN_VERIFICAR',
  'EMISION_LISTA',
  'EMITIDA_SIN_LICENCIA',
  'EMITIDA_CON_LICENCIA',
];
/** Pasos que se desvían del camino normal y en qué punto lo hacen. */
const DESVIO: Partial<Record<Paso, Paso>> = {
  DOCUMENTO_OBSERVADO: 'DOCUMENTOS_POR_REVISAR',
  CONOCIMIENTOS_DESAPROBADO: 'CITA_CONOCIMIENTOS',
  MANEJO_FALTA_ELIMINATORIA: 'CITA_MANEJO',
  EMISION_SANCION: 'EMISION_SIN_VERIFICAR',
  EMISION_OBSERVADA: 'EMISION_LISTA',
};

const tokens: Record<string, string> = {};
const fecha = (diasAtras: number) => new Date(Date.now() - diasAtras * 86_400_000).toISOString().slice(0, 10);

async function llamar<T = any>(metodo: string, ruta: string, usuario: string, cuerpo?: unknown): Promise<T> {
  const formulario = cuerpo instanceof FormData;
  const r = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${tokens[usuario]}`, ...(cuerpo && !formulario ? { 'Content-Type': 'application/json' } : {}) },
    body: cuerpo === undefined ? undefined : formulario ? cuerpo : JSON.stringify(cuerpo),
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${metodo} ${ruta} (${usuario}) → ${r.status}: ${texto}`);
  return (texto ? JSON.parse(texto) : null) as T;
}

async function iniciarSesion(usuario: string): Promise<void> {
  const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario, clave: CLAVE }) });
  if (!r.ok) throw new Error(`No se pudo iniciar sesión como ${usuario} (${r.status}). ¿Está la API en ${API}?`);
  tokens[usuario] = ((await r.json()) as { token: string }).token;
}

/** RF21: devuelve un horario futuro con cupos libres; si no hay, el administrador habilita uno. */
async function cupoLibre(tipo: 'CONOCIMIENTOS' | 'MANEJO'): Promise<number> {
  const cupos = await llamar<{ id: number; fecha: string; disponibles: number }[]>('GET', `/cupos?tipo=${tipo}`, 'admin');
  const libre = cupos.find((c) => c.fecha > fecha(0) && c.disponibles > 0);
  if (libre) return libre.id;
  const dias = tipo === 'CONOCIMIENTOS' ? [1, 2, 3] : [2, 3, 4, 5];
  for (let i = 1; i <= 21; i++) {
    const dia = new Date(Date.now() + i * 86_400_000);
    if (!dias.includes(dia.getUTCDay())) continue;
    try {
      return (await llamar<{ id: number }>('POST', '/cupos', 'admin', { fecha: dia.toISOString().slice(0, 10), hora: '09:00', tipo, capacidad: 20 })).id;
    } catch {
      /* ya existe ese horario: se prueba el día siguiente */
    }
  }
  throw new Error(`No se pudo habilitar un horario de ${tipo}`);
}

function archivo(tipo: string): Blob {
  return new Blob([`%PDF-1.4\n% ${tipo} (documento de demostración)\n`], { type: 'application/pdf' });
}

async function avanzar(p: Persona, expedienteId: number) {
  const u = p.dni;
  const destino = DESVIO[p.paso] ?? p.paso;
  const hasta = ORDEN.indexOf(destino);
  const llega = (paso: Paso) => ORDEN.indexOf(paso) <= hasta;

  if (llega('DOCUMENTOS_POR_REVISAR')) {
    const tipos = ['DECLARACION_JURADA', 'CERTIFICADO_MEDICO', 'FOTOGRAFIA', ...(p.categoria === 'II-C' ? ['CONSTANCIA_COFIPRO'] : [])];
    for (const tipo of tipos) {
      const f = new FormData();
      f.append('tipo', tipo);
      f.append('fechaEmision', fecha(p.dias + 10));
      f.append('archivo', archivo(tipo), `${tipo.toLowerCase()}.pdf`);
      await llamar('POST', `/expedientes/${expedienteId}/documentos`, u, f);
    }
  }
  if (p.paso === 'DOCUMENTO_OBSERVADO' || llega('SIN_PAGO')) {
    const docs = await llamar<{ id: number; tipo: string }[]>('GET', `/expedientes/${expedienteId}/documentos`, 'gestor');
    for (const d of docs) {
      const observar = p.paso === 'DOCUMENTO_OBSERVADO' && d.tipo === 'FOTOGRAFIA';
      await llamar('PATCH', `/documentos/${d.id}/revision`, 'gestor', observar ? { estado: 'OBSERVADO', observacion: 'La foto no es a color ni tiene fondo blanco' } : { estado: 'APROBADO' });
    }
  }
  if (llega('PAGO_POR_VERIFICAR')) {
    const pago = await llamar<{ id: number }>('POST', `/expedientes/${expedienteId}/pagos`, u, {
      numeroOperacion: `SAT-${p.dni.slice(2)}`,
      monto: p.categoria === 'II-B' ? 69.9 : 69.4,
      fechaPago: fecha(Math.max(p.dias - 2, 0)),
    });
    if (llega('SIN_CITA')) await llamar('PATCH', `/pagos/${pago.id}/verificacion`, 'gestor', { estado: 'VERIFICADO' });
  }
  if (llega('CITA_CONOCIMIENTOS')) await llamar('POST', `/expedientes/${expedienteId}/citas`, u, { cupoId: await cupoLibre('CONOCIMIENTOS') });

  const examen = async (tipo: 'CONOCIMIENTOS' | 'MANEJO', puntaje: number, validar: boolean, faltaEliminatoria = false) => {
    const e = await llamar<{ id: number }>('POST', `/expedientes/${expedienteId}/evaluaciones/${tipo}/resultado`, 'evaluador', {
      puntaje,
      ...(tipo === 'MANEJO' ? { faltaEliminatoria } : {}),
      ...(faltaEliminatoria ? { observaciones: 'No respetó la señal de PARE' } : {}),
    });
    if (validar) await llamar('POST', `/evaluaciones/${e.id}/validacion`, 'supervisor');
  };
  if (p.paso === 'CONOCIMIENTOS_DESAPROBADO') await examen('CONOCIMIENTOS', 11, true);
  else if (llega('CONOCIMIENTOS_POR_VALIDAR')) await examen('CONOCIMIENTOS', 15 + (Number(p.dni[7]) % 5), llega('CITA_MANEJO'));

  if (llega('CITA_MANEJO')) await llamar('POST', `/expedientes/${expedienteId}/citas`, u, { cupoId: await cupoLibre('MANEJO') });
  if (p.paso === 'MANEJO_FALTA_ELIMINATORIA') await examen('MANEJO', 15, true, true);
  else if (llega('MANEJO_POR_VALIDAR')) await examen('MANEJO', 14 + (Number(p.dni[6]) % 6), llega('EMISION_SIN_VERIFICAR'));

  const verificar = (tipo: string, resultado = 'CONFORME', detalle?: string) =>
    llamar('POST', `/expedientes/${expedienteId}/verificaciones`, 'gestor', { tipo, resultado, detalle });
  if (p.paso === 'EMISION_SANCION') {
    await verificar('SNC_CERTIFICADO_MEDICO', 'CONFORME', 'Certificado registrado en el SNC');
    await verificar('SNC_COFIPRO');
    await verificar('SANCIONES', 'NO_CONFORME', 'Papeleta G-40 pendiente de pago en el récord del conductor');
  } else if (llega('EMISION_LISTA')) {
    await verificar('SNC_CERTIFICADO_MEDICO', 'CONFORME', 'Certificado registrado en el SNC');
    if (p.categoria === 'II-C') {
      await verificar('SNC_COFIPRO');
      await verificar('SANCIONES', 'CONFORME', 'Récord sin multas pendientes');
    }
  }
  if (p.paso === 'EMISION_OBSERVADA') {
    await llamar('POST', `/expedientes/${expedienteId}/observaciones`, 'supervisor', { motivo: 'La fecha del certificado médico no coincide con la registrada en el SNC' });
  }
  if (llega('EMITIDA_SIN_LICENCIA')) await llamar('PATCH', `/expedientes/${expedienteId}/emision`, 'supervisor');
  if (llega('EMITIDA_CON_LICENCIA')) await llamar('POST', `/expedientes/${expedienteId}/licencia`, 'gestor', { numero: `Q${p.dni}` });
}

async function main() {
  const db = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PUERTO ?? 5433),
    user: process.env.DB_USUARIO ?? 'licencias',
    password: process.env.DB_CLAVE ?? 'licencias',
    database: process.env.DB_NOMBRE ?? 'licencias',
  });
  await db.connect();
  for (const rol of ['gestor', 'evaluador', 'supervisor', 'admin']) await iniciarSesion(rol);

  let creados = 0;
  for (const p of PERSONAS) {
    const existe = await db.query('SELECT 1 FROM usuarios WHERE usuario = $1', [p.dni]);
    if (existe.rowCount) {
      console.log(`  omitido  ${p.dni}  ya existe`);
      continue;
    }
    const nombre = `${p.nombres} ${p.apellidos}`.toUpperCase();
    const correo = `${p.nombres.split(' ')[0]}.${p.apellidos.split(' ')[0]}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() + '@example.com';
    const { rows } = await db.query('INSERT INTO postulantes (dni, nombres, apellidos, correo, celular) VALUES ($1, $2, $3, $4, $5) RETURNING id', [p.dni, p.nombres.toUpperCase(), p.apellidos.toUpperCase(), correo, p.celular]);
    await db.query(`INSERT INTO usuarios (usuario, nombre, clave_cifrada, rol, postulante_id) VALUES ($1, $2, $3, 'POSTULANTE', $4)`, [p.dni, nombre, CLAVE_CIFRADA, rows[0].id]);
    await iniciarSesion(p.dni);

    const exp = await llamar<{ id: number; numero: string }>('POST', '/expedientes', p.dni, { tipoTramite: 'EMISION', categoria: p.categoria });
    await avanzar(p, exp.id);
    for (const pregunta of p.preguntas ?? []) await llamar('POST', '/asistente/consultas', p.dni, { pregunta });
    // Antigüedad realista para la bandeja (solo la fecha de creación; el historial queda como ocurrió).
    await db.query(`UPDATE expedientes SET creado_en = now() - make_interval(days => $2) WHERE id = $1`, [exp.id, p.dias]);

    const { etapa } = await llamar<{ etapa: string }>('GET', `/expedientes/${exp.id}`, 'gestor');
    console.log(`  creado   ${p.dni}  ${exp.numero}  ${p.categoria}  ${etapa.padEnd(20)} ${p.paso}`);
    creados++;
  }

  // El gestor responde una de las consultas derivadas; las demás quedan pendientes en su bandeja.
  const derivadas = await llamar<{ id: number; pregunta: string }[]>('GET', '/asistente/derivadas?estado=PENDIENTE', 'gestor');
  const pago = derivadas.find((d) => d.pregunta.startsWith('Ya pagué'));
  if (pago) {
    await llamar('PATCH', `/asistente/consultas/${pago.id}/respuesta`, 'gestor', { respuesta: 'Hola, Fredy. Verificamos los pagos en el SAT de lunes a viernes; el tuyo se revisa hoy antes de las 4 p. m.' });
  }

  await db.end();
  console.log(`\n${creados} postulantes creados. Contraseña de todos: ${CLAVE}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
