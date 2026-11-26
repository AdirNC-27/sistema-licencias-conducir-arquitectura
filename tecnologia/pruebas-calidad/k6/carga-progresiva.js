// EQ-03 · Rendimiento: carga progresiva hasta 2,000 usuarios virtuales en 9 minutos.
// Datos: 30 000 expedientes (postgres/analisis/01-volumen.sql) y 200 cuentas (k6/cuentas-carga.sql).
// Uso:  k6 run -e BASE=http://localhost:3000/api pruebas-calidad/k6/carga-progresiva.js
//       Sin las 200 cuentas, use -e CUENTAS=0 para cargar solo con el postulante de las migraciones.
import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';

const BASE = __ENV.BASE || 'http://localhost:3000/api';
const CUENTAS = Number(__ENV.CUENTAS ?? 200); // postulantes 70000001 … 70000200

// Etapas del perfil y el objetivo de cada una (escenario EQ-03).
const ETAPAS = [
  { nombre: 'e1_100', duracion: 60, objetivo: 100, p95: 1000 },
  { nombre: 'e2_500', duracion: 60, objetivo: 500, p95: 1000 },
  { nombre: 'e3_1000', duracion: 120, objetivo: 1000, p95: 1000 },
  { nombre: 'e4_subida_2000', duracion: 120, objetivo: 2000, p95: 3000 },
  { nombre: 'e5_pico_2000', duracion: 120, objetivo: 2000, p95: 3000 },
  { nombre: 'e6_bajada', duracion: 60, objetivo: 0, p95: 3000 },
];

const umbrales = {
  http_req_failed: ['rate<0.01'], // errores < 1 %
  http_req_duration: ['p(95)<3000'], // p95 ≤ 3 s con 2,000 usuarios
  'http_req_duration{consulta:requisitos}': ['p(95)<3000'],
  'http_req_duration{consulta:expediente}': ['p(95)<3000'],
  'http_req_duration{consulta:bandeja}': ['p(95)<3000'],
};
for (const e of ETAPAS) {
  umbrales[`http_req_duration{etapa:${e.nombre}}`] = [`p(95)<${e.p95}`]; // ≤ 1 s hasta 1,000 usuarios
  umbrales[`http_req_failed{etapa:${e.nombre}}`] = ['rate<0.01'];
  umbrales[`http_reqs{etapa:${e.nombre}}`] = ['count>0']; // para obtener peticiones por etapa
}

export const options = {
  stages: ETAPAS.map((e) => ({ duration: `${e.duracion}s`, target: e.objetivo })),
  thresholds: umbrales,
  setupTimeout: '3m',
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

/** Etapa en la que está la prueba según el tiempo transcurrido desde que terminó el setup. */
function etapaActual(inicio) {
  let segundos = (Date.now() - inicio) / 1000;
  for (const e of ETAPAS) {
    if (segundos < e.duracion) return e.nombre;
    segundos -= e.duracion;
  }
  return ETAPAS[ETAPAS.length - 1].nombre;
}

const json = { headers: { 'Content-Type': 'application/json' } };
const login = (usuario) => http.post(`${BASE}/auth/login`, JSON.stringify({ usuario, clave: 'demo123' }), json).json('token');

// Inicia sesión una vez por cuenta; cada usuario virtual usa una cuenta y su propio expediente.
export function setup() {
  const dnis = CUENTAS > 0 ? Array.from({ length: CUENTAS }, (_, i) => String(70000001 + i)) : ['45892014'];
  const cuentas = [];
  for (const dni of dnis) {
    const token = login(dni);
    if (!token) continue;
    const mios = http.get(`${BASE}/expedientes/mios`, { headers: { Authorization: `Bearer ${token}` } }).json();
    if (Array.isArray(mios) && mios.length) cuentas.push({ token, expedienteId: mios[0].id });
  }
  if (!cuentas.length) throw new Error('No hay cuentas de postulante con expediente para la carga');
  console.log(`Cuentas de postulante con expediente: ${cuentas.length}`);
  const gestor = login('gestor');
  return { cuentas, gestor, inicio: Date.now() }; // las etapas se cuentan desde aquí
}

export default function (datos) {
  const cuenta = datos.cuentas[exec.vu.idInTest % datos.cuentas.length];
  const etapa = etapaActual(datos.inicio);
  const categoria = Math.random() < 0.5 ? 'II-B' : 'II-C';

  const r1 = http.get(`${BASE}/requisitos?categoria=${categoria}`, { tags: { consulta: 'requisitos', etapa } });
  check(r1, { 'requisitos 200': (r) => r.status === 200 });
  sleep(1 + Math.random() * 2); // pausa de 1 a 3 s, como un usuario real

  const r2 = http.get(`${BASE}/expedientes/${cuenta.expedienteId}`, { headers: { Authorization: `Bearer ${cuenta.token}` }, tags: { consulta: 'expediente', etapa: etapaActual(datos.inicio) } });
  check(r2, { 'expediente 200': (r) => r.status === 200 });
  sleep(1 + Math.random() * 2);

  if (Math.random() < 0.2) {
    const r3 = http.get(`${BASE}/expedientes?etapa=DOCUMENTOS&tamano=20`, { headers: { Authorization: `Bearer ${datos.gestor}` }, tags: { consulta: 'bandeja', etapa: etapaActual(datos.inicio) } });
    check(r3, { 'bandeja 200': (r) => r.status === 200 });
    sleep(1 + Math.random() * 2);
  }
}
