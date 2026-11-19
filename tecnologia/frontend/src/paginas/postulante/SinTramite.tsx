import { Link } from 'react-router-dom';
import { Vacio } from '../../componentes/ui';

export const SinTramite = () => (
  <div className="space-y-4">
    <Vacio titulo="Aún no tienes un trámite" texto="Inícialo desde la pantalla de inicio eligiendo tu categoría." icono="assignment_add" />
    <div className="text-center"><Link to="/postulante" className="btn-primario">Ir al inicio</Link></div>
  </div>
);
