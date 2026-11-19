import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/cliente';
import { mensajeError } from '../../componentes/useDatos';
import { Aviso, Icono } from '../../componentes/ui';
import { useSesion } from '../../sesion/sesion';

/** RF03 y RF04: registro con DNI validado en API Perú. */
export function Registro() {
  const { iniciar } = useSesion();
  const navegar = useNavigate();
  const [f, setF] = useState({ dni: '', correo: '', celular: '', clave: '' });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const campo = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.post('/postulantes', f);
      await iniciar(f.dni, f.clave);
      navegar('/postulante', { replace: true });
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-marca-oscuro to-marca p-4">
      <form onSubmit={enviar} className="tarjeta w-full max-w-lg space-y-4 p-7">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-marca-claro text-marca"><Icono nombre="person_add" /></div>
          <div>
            <h1 className="text-xl font-extrabold text-marca-oscuro">Crear cuenta de postulante</h1>
            <p className="text-sm text-slate-500">Tus nombres se completan con tu DNI (API Perú).</p>
          </div>
        </div>
        <div>
          <label className="etiqueta" htmlFor="dni">DNI</label>
          <input id="dni" className="campo" inputMode="numeric" maxLength={8} pattern="\d{8}" value={f.dni} onChange={campo('dni')} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="correo">Correo (recibirás recordatorios)</label>
            <input id="correo" type="email" className="campo" value={f.correo} onChange={campo('correo')} required />
          </div>
          <div>
            <label className="etiqueta" htmlFor="celular">Celular</label>
            <input id="celular" className="campo" inputMode="numeric" maxLength={9} pattern="\d{9}" value={f.celular} onChange={campo('celular')} required />
          </div>
        </div>
        <div>
          <label className="etiqueta" htmlFor="clave">Contraseña (mínimo 6 caracteres)</label>
          <input id="clave" type="password" minLength={6} className="campo" value={f.clave} onChange={campo('clave')} required />
        </div>
        {error && <Aviso tipo="error">{error}</Aviso>}
        <button className="btn-acento w-full py-3" disabled={enviando}>{enviando ? 'Validando DNI…' : 'Crear cuenta'}</button>
        <p className="text-center text-sm text-slate-600">¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-marca hover:underline">Inicia sesión</Link></p>
      </form>
    </div>
  );
}
