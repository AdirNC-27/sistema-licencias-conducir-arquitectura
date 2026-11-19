import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mensajeError } from '../../componentes/useDatos';
import { Aviso, Icono } from '../../componentes/ui';
import { INICIO_POR_ROL, useSesion } from '../../sesion/sesion';

/** Un solo login para todos (RF01): el rol lo define la cuenta y el sistema lleva al panel correspondiente. */
export function Login() {
  const { iniciar } = useSesion();
  const navegar = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const u = await iniciar(usuario, clave);
      navegar(INICIO_POR_ROL[u.rol], { replace: true });
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-marca-oscuro to-marca p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><Icono nombre="account_balance" className="text-2xl" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Municipalidad Provincial de Huamanga</p>
            <p className="font-semibold">Subgerencia de Tránsito y Seguridad Vial</p>
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">Tu licencia clase B,<br />paso a paso y en línea</h1>
          <p className="mt-4 max-w-md text-blue-100">Motos (II-B) y mototaxis (II-C). Consulta tu etapa, tu plazo y tu cita sin ir en persona.</p>
          <div className="mt-8 grid max-w-md grid-cols-3 gap-3 text-center text-sm">
            {[['description', 'Requisitos TUPA'], ['event', 'Cita con cupo'], ['notifications', 'Avisos por correo']].map(([i, t]) => (
              <div key={t} className="rounded-2xl bg-white/10 p-4"><Icono nombre={i} className="mb-1 text-2xl text-orange-300" /><p>{t}</p></div>
            ))}
          </div>
        </div>
        <p className="text-xs text-blue-200">Prototipo académico · IS-488 Arquitectura de Software · UNSCH</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-marca text-white"><Icono nombre="two_wheeler" className="text-2xl" /></div>
            <p className="text-xs font-semibold uppercase tracking-wider text-marca">MPH Huamanga</p>
            <h1 className="text-2xl font-extrabold text-marca-oscuro">Licencias Clase B</h1>
          </div>
          <h2 className="text-2xl font-bold text-marca-oscuro">Ingresa a tu cuenta</h2>
          <p className="subtitulo">Ciudadanos con su DNI; personal con su usuario de la MPH.</p>
          <form onSubmit={enviar} className="mt-6 space-y-4">
            <div>
              <label className="etiqueta" htmlFor="usuario">DNI o usuario</label>
              <input id="usuario" className="campo" autoComplete="username" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Ej. 45892014 o gestor" required />
            </div>
            <div>
              <label className="etiqueta" htmlFor="clave">Contraseña</label>
              <input id="clave" type="password" className="campo" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} required />
            </div>
            {error && <Aviso tipo="error">{error}</Aviso>}
            <button className="btn-acento w-full py-3" disabled={enviando}>{enviando ? 'Ingresando…' : 'Iniciar sesión'}</button>
          </form>
          <div className="mt-6 rounded-xl border border-dashed border-orange-300 bg-acento-claro p-4 text-xs leading-relaxed text-orange-900">
            <p className="font-bold">Cuentas de demostración · clave demo123</p>
            <p>Postulante: <b>45892014</b> · Personal: <b>gestor</b>, <b>evaluador</b>, <b>supervisor</b>, <b>admin</b></p>
          </div>
          <p className="mt-6 text-center text-sm text-slate-600">
            ¿Primera vez? <Link to="/registro" className="font-semibold text-marca hover:underline">Crea tu cuenta con tu DNI</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
