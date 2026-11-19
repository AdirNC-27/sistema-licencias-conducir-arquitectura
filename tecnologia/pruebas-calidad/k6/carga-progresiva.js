// EQ-03 · Rendimiento: carga progresiva hasta 2,000 usuarios virtuales (sprint 2, actividad 8)
// Uso:  k6 run pruebas-calidad/k6/carga-progresiva.js
//       k6 run -e BASE=http://localhost:3000/api --summary-export=resultado.json pruebas-calidad/k6/carga-progresiva.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE || 'http://localhost:3000/api';

export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '1m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '2m', target: 2000 },
    { duration: '2m', target: 2000 }, // se mantiene el pico
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // errores < 1 %
    http_req_duration: ['p(95)<3000'], // p95 ≤ 3 s con 2,000 usuarios
    'http_req_duration{consulta:requisitos}': ['p(95)<3000'],
    'http_req_duration{consulta:expediente}': ['p(95)<3000'],
    'http_req_duration{consulta:bandeja}': ['p(95)<3000'],
  },
};

// Inicia sesión una sola vez y comparte los tokens con todos los usuarios virtuales
export function setup() {
  const login = (usuario) => http.post(`${BASE}/auth/login`, JSON.stringify({ usuario, clave: 'demo123' }), { headers: { 'Content-Type': 'application/json' } }).json('token');
  const postulante = login('45892014');
  const gestor = login('gestor');
  const mios = http.get(`${BASE}/expedientes/mios`, { headers: { Authorization: `Bearer ${postulante}` } }).json();
  return { postulante, gestor, expedienteId: mios.length ? mios[0].id : 1 };
}

export default function (datos) {
  const categoria = Math.random() < 0.5 ? 'II-B' : 'II-C';
  const r1 = http.get(`${BASE}/requisitos?categoria=${categoria}`, { tags: { consulta: 'requisitos' } });
  check(r1, { 'requisitos 200': (r) => r.status === 200 });
  sleep(1 + Math.random() * 2); // pausa de 1 a 3 s, como un usuario real

  const r2 = http.get(`${BASE}/expedientes/${datos.expedienteId}`, { headers: { Authorization: `Bearer ${datos.postulante}` }, tags: { consulta: 'expediente' } });
  check(r2, { 'expediente 200': (r) => r.status === 200 });
  sleep(1 + Math.random() * 2);

  if (Math.random() < 0.2) {
    const r3 = http.get(`${BASE}/expedientes?etapa=DOCUMENTOS&tamano=20`, { headers: { Authorization: `Bearer ${datos.gestor}` }, tags: { consulta: 'bandeja' } });
    check(r3, { 'bandeja 200': (r) => r.status === 200 });
    sleep(1 + Math.random() * 2);
  }
}
