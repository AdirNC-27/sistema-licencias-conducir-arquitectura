import { Usuario } from './usuario';
import { Rol } from '../../../compartido/dominio/rol';

export interface RepositorioUsuarios {
  buscarPorUsuario(usuario: string): Promise<Usuario | null>;
  buscarPorId(id: number): Promise<Usuario | null>;
  listar(): Promise<Usuario[]>;
  crear(datos: { usuario: string; nombre: string; claveCifrada: string; rol: Rol; postulanteId?: number | null }): Promise<Usuario>;
  guardarRol(usuario: Usuario): Promise<void>;
}

export interface CifradorClaves {
  cifrar(clave: string): Promise<string>;
  comparar(clave: string, cifrada: string): Promise<boolean>;
}

export interface EmisorTokens {
  emitir(usuario: Usuario): string;
}

export const REPOSITORIO_USUARIOS = Symbol('RepositorioUsuarios');
export const CIFRADOR_CLAVES = Symbol('CifradorClaves');
export const EMISOR_TOKENS = Symbol('EmisorTokens');
