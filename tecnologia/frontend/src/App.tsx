import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { Rol } from './api/tipos';
import { Layout } from './componentes/Layout';
import { Usuarios } from './paginas/admin/Usuarios';
import { Cupos } from './paginas/admin/Cupos';
import { Contenidos } from './paginas/admin/Contenidos';
import { Auditoria } from './paginas/compartido/Auditoria';
import { Examenes } from './paginas/evaluador/Examenes';
import { Bandeja } from './paginas/gestor/Bandeja';
import { Consultas } from './paginas/gestor/Consultas';
import { Detalle } from './paginas/gestor/Detalle';
import { Asistente } from './paginas/postulante/Asistente';
import { Avisos } from './paginas/postulante/Avisos';
import { Cita } from './paginas/postulante/Cita';
import { Documentos } from './paginas/postulante/Documentos';
import { Inicio } from './paginas/postulante/Inicio';
import { Pago } from './paginas/postulante/Pago';
import { Resultados } from './paginas/postulante/Resultados';
import { Login } from './paginas/publico/Login';
import { Registro } from './paginas/publico/Registro';
import { Emision } from './paginas/supervisor/Emision';
import { PorValidar } from './paginas/supervisor/PorValidar';
import { Revision } from './paginas/supervisor/Revision';
import { INICIO_POR_ROL, ProveedorSesion, useSesion } from './sesion/sesion';

/** Protege cada área por rol. La API vuelve a validar el rol en cada petición (EQ-01, EQ-02). */
function SoloRol({ rol, children }: { rol: Rol; children: ReactNode }) {
  const { usuario } = useSesion();
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.rol !== rol) return <Navigate to={INICIO_POR_ROL[usuario.rol]} replace />;
  return <>{children}</>;
}

function Raiz() {
  const { usuario } = useSesion();
  return <Navigate to={usuario ? INICIO_POR_ROL[usuario.rol] : '/login'} replace />;
}

const area = (rol: Rol) => <SoloRol rol={rol}><Layout /></SoloRol>;

export default function App() {
  return (
    <ProveedorSesion>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/postulante" element={area('POSTULANTE')}>
            <Route index element={<Inicio />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="pago" element={<Pago />} />
            <Route path="cita" element={<Cita />} />
            <Route path="resultados" element={<Resultados />} />
            <Route path="avisos" element={<Avisos />} />
            <Route path="asistente" element={<Asistente />} />
          </Route>
          <Route path="/gestor" element={area('GESTOR')}>
            <Route index element={<Bandeja />} />
            <Route path="expedientes/:id" element={<Detalle />} />
            <Route path="consultas" element={<Consultas />} />
          </Route>
          <Route path="/evaluador" element={area('EVALUADOR')}>
            <Route index element={<Examenes />} />
          </Route>
          <Route path="/supervisor" element={area('SUPERVISOR')}>
            <Route index element={<PorValidar />} />
            <Route path="emision" element={<Emision />} />
            <Route path="expedientes/:id" element={<Revision />} />
            <Route path="auditoria" element={<Auditoria />} />
          </Route>
          <Route path="/admin" element={area('ADMINISTRADOR')}>
            <Route index element={<Usuarios />} />
            <Route path="cupos" element={<Cupos />} />
            <Route path="contenidos" element={<Contenidos />} />
            <Route path="auditoria" element={<Auditoria />} />
          </Route>
          <Route path="*" element={<Raiz />} />
        </Routes>
      </BrowserRouter>
    </ProveedorSesion>
  );
}
