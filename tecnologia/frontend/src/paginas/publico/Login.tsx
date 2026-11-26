import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mensajeError } from '../../componentes/useDatos';
import { Aviso, Icono } from '../../componentes/ui';
import { INICIO_POR_ROL, useSesion } from '../../sesion/sesion';
import portada from '../../assets/portada-licencias.webp';

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
    <div className="grid min-h-screen lg:h-screen lg:grid-cols-[1.15fr_1fr]">
      <section className="relative hidden h-full flex-col overflow-hidden bg-gradient-to-br from-[#0b2a8a] via-marca-oscuro to-marca px-10 pt-[3vh] text-white lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <svg aria-hidden="true" viewBox="0 0 60 800" preserveAspectRatio="none" className="pointer-events-none absolute inset-y-0 right-0 z-20 h-full w-16 text-white">
          <path d="M60 0 H40 C10 200 55 420 22 620 C10 700 30 760 38 800 H60 Z" fill="currentColor" />
        </svg>
        <Encabezado />
        <div className="relative z-10 mx-auto mt-[3vh] max-w-xl text-center">
          <h1 className="text-[clamp(1.9rem,4.2vh,2.6rem)] font-extrabold leading-tight">
            <span aria-hidden="true" className="mr-2 inline-block -skew-x-12 text-red-500">/</span>Tu licencia clase B,
            <span className="mt-2 flex w-fit -skew-x-6 items-center gap-2 rounded-xl bg-white px-5 py-1 text-marca-oscuro shadow-lg sm:mx-auto">
              <span className="skew-x-6">paso a paso y en línea</span>
              <Icono nombre="chevrons_right" className="skew-x-6 text-3xl text-red-600" />
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-blue-100">Motos (II-B) y mototaxis (II-C). Consulta tu etapa, tu plazo y tu cita sin ir en persona.</p>
          <div className="mx-auto mt-[2.5vh] grid max-w-lg grid-cols-3 gap-3 text-sm">
            {[['description', 'Requisitos TUPA'], ['event', 'Cita con cupo'], ['notifications', 'Avisos por correo']].map(([i, t]) => (
              <div key={t} className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                <Icono nombre={i} className="mx-auto mb-1 text-2xl text-amber-300" />
                <p className="font-medium">{t}</p>
              </div>
            ))}
          </div>
        </div>
        {/* La imagen ocupa el espacio que queda: a zoom 100 % se ve completa, sin desplazarse. */}
        <div className="relative z-0 -mx-10 mt-[2vh] flex min-h-0 flex-1 items-end justify-center">
          <img
            src={portada}
            alt="Conductor mostrando su licencia junto a una mototaxi y una moto, con la Catedral y la plaza de Huamanga al fondo"
            className="portada-mascara block h-auto max-h-full w-auto max-w-full"
          />
        </div>
      </section>

      <section className="flex items-center justify-center bg-gradient-to-b from-white to-fondo p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Escudo className="h-16 w-auto" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-marca">Municipalidad Provincial de Huamanga</p>
              <h1 className="text-xl font-extrabold text-marca-oscuro">Licencias Clase B</h1>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-marca-claro text-marca"><Icono nombre="person" className="text-2xl" /></div>
            <div>
              <h2 className="text-2xl font-extrabold text-marca-oscuro sm:text-3xl">Ingresa a tu cuenta</h2>
              <p className="subtitulo">Ciudadanos con su DNI; personal con su usuario de la MPH.</p>
            </div>
          </div>
          <form onSubmit={enviar} className="mt-8 space-y-5">
            <div>
              <label className="etiqueta" htmlFor="usuario">DNI o usuario</label>
              <div className="relative">
                <Icono nombre="badge" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-500" />
                <input id="usuario" className="campo pl-11" autoComplete="username" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Ej. 45892014 o gestor" required />
              </div>
            </div>
            <div>
              <label className="etiqueta" htmlFor="clave">Contraseña</label>
              <div className="relative">
                <Icono nombre="lock" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-500" />
                <input id="clave" type="password" className="campo pl-11" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} required />
              </div>
            </div>
            {error && <Aviso tipo="error">{error}</Aviso>}
            <button className="btn-acento w-full py-3.5 text-base shadow-lg shadow-orange-600/25" disabled={enviando}>
              <Icono nombre="login" className="text-xl" />{enviando ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>
          <p className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-600">
            ¿Primera vez?
            <Link to="/registro" className="inline-flex items-center gap-1.5 font-semibold text-marca hover:underline">
              <Icono nombre="person_add" className="text-lg" />Crea tu cuenta con tu DNI
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

/** Escudo de la MPH: si aún no está en public/escudo-huamanga.png, se muestra el ícono institucional. */
function Escudo({ className }: { className: string }) {
  const [falta, setFalta] = useState(false);
  if (falta) return <div className={`grid shrink-0 place-items-center rounded-2xl bg-marca text-white ${className}`}><Icono nombre="account_balance" className="text-2xl" /></div>;
  return <img src="/escudo-huamanga.png" alt="Escudo de la Municipalidad Provincial de Huamanga" className={`shrink-0 object-contain ${className}`} onError={() => setFalta(true)} />;
}

function Encabezado() {
  return (
    <div className="relative z-10 mx-auto flex items-center gap-4">
      <Escudo className="h-[clamp(4rem,10vh,6rem)] w-auto drop-shadow-lg" />
      <div className="h-16 w-px bg-white/40" aria-hidden="true" />
      <div>
        <p className="text-sm font-bold uppercase tracking-wide">Municipalidad Provincial de</p>
        <p className="text-[clamp(2rem,4.6vh,2.75rem)] font-black uppercase leading-none tracking-tight">Huamanga</p>
        <p className="mt-2 w-fit rounded-full bg-marca px-3 py-1 text-xs font-semibold ring-1 ring-white/30">Subgerencia de Tránsito y Seguridad Vial</p>
      </div>
    </div>
  );
}
