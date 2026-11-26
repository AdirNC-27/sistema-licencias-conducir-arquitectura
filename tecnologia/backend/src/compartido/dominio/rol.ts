export enum Rol {
  POSTULANTE = 'POSTULANTE',
  GESTOR = 'GESTOR',
  EVALUADOR = 'EVALUADOR',
  SUPERVISOR = 'SUPERVISOR',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

/** Usuario autenticado tal como lo ven los casos de uso (sin detalles de JWT). */
export interface UsuarioActual {
  id: number;
  usuario: string;
  rol: Rol;
  postulanteId: number | null;
  /** Nombre para mostrar (lo usa la asistente para saludar). */
  nombre?: string;
}

export const ROLES_PERSONAL = [Rol.GESTOR, Rol.EVALUADOR, Rol.SUPERVISOR, Rol.ADMINISTRADOR];

export function esPersonal(usuario: UsuarioActual): boolean {
  return ROLES_PERSONAL.includes(usuario.rol);
}
