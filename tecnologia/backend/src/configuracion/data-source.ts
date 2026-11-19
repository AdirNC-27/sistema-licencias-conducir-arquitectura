import 'dotenv/config';
import { DataSource } from 'typeorm';
import { opcionesBaseDeDatos } from './base-de-datos';

/** Usado por la CLI de TypeORM: npm run migracion:generar / migracion:ejecutar */
export default new DataSource(opcionesBaseDeDatos());
