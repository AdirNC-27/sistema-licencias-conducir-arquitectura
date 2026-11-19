// EQ-03 · Comparación con y sin caché de requisitos (ADR-009)
// 1) API con CACHE_REQUISITOS=true  → k6 run pruebas-calidad/k6/cache-requisitos.js
// 2) API con CACHE_REQUISITOS=false → k6 run pruebas-calidad/k6/cache-requisitos.js
// Compare el p95 y las peticiones por segundo de ambas corridas.
import http from 'k6/http';
import { check } from 'k6';

const BASE = __ENV.BASE || 'http://localhost:3000/api';

export const options = {
  vus: 200,
  duration: '1m',
  thresholds: { http_req_failed: ['rate<0.01'] },
};

export default function () {
  const categoria = Math.random() < 0.5 ? 'II-B' : 'II-C';
  check(http.get(`${BASE}/requisitos?categoria=${categoria}`), { 'requisitos 200': (r) => r.status === 200 });
}
