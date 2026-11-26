import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Categoria } from '../../../compartido/dominio/categoria';
import { TipoDocumento } from '../../documentos/dominio/documento';
import { Etapa } from '../../expedientes/dominio/etapa';
import { ResultadoVerificacion, TipoVerificacion, Verificacion } from '../../revision/dominio/verificacion';
import { LecturaPendientes } from '../dominio/contratos';
import { DatosPostulante, IndicadoresPersonal } from '../dominio/pendientes';

const DIAS_CUPOS = 7;
const dia = (d: Date) => d.toISOString().slice(0, 10);
const entero = (v: unknown) => Number(v ?? 0);

/**
 * Modelo de lectura de los pendientes (ADR-016). Solo SELECT y con conteos agregados: cada pantalla
 * del personal hace una consulta liviana en lugar de pedir listas completas a cada módulo.
 */
@Injectable()
export class LecturaPendientesSql implements LecturaPendientes {
  constructor(private readonly db: DataSource) {}

  async indicadoresPersonal(hoy: Date): Promise<IndicadoresPersonal> {
    const fecha = dia(hoy);
    const hasta = dia(new Date(hoy.getTime() + DIAS_CUPOS * 86_400_000));
    const [conteos] = await this.db.query(
      `SELECT
        (SELECT count(DISTINCT d.expediente_id) FROM documentos d JOIN expedientes e ON e.id = d.expediente_id
           WHERE d.estado = 'PENDIENTE' AND e.etapa = 'DOCUMENTOS') AS documentos,
        (SELECT count(*) FROM pagos WHERE estado = 'PENDIENTE') AS pagos,
        (SELECT count(*) FROM observaciones_expediente WHERE estado = 'ABIERTA') AS observaciones,
        (SELECT count(*) FROM expedientes e WHERE e.etapa = 'EMITIDA'
           AND NOT EXISTS (SELECT 1 FROM licencias_emitidas l WHERE l.expediente_id = e.id)) AS licencias,
        (SELECT count(*) FROM consultas_asistente WHERE origen = 'DERIVADA' AND creado_en > now() - interval '7 days') AS derivadas,
        (SELECT count(*) FROM evaluaciones WHERE estado = 'REGISTRADO') AS por_validar,
        (SELECT count(*) FROM citas c JOIN cupos u ON u.id = c.cupo_id WHERE u.fecha = $1) AS citas_hoy,
        (SELECT count(*) FROM citas c JOIN cupos u ON u.id = c.cupo_id JOIN expedientes e ON e.id = c.expediente_id
           WHERE u.fecha > $1 AND u.fecha <= $2 AND e.etapa::text = 'EXAMEN_' || u.tipo::text) AS citas_proximas,
        (SELECT count(DISTINCT e.id) FROM expedientes e
           JOIN citas c ON c.expediente_id = e.id JOIN cupos u ON u.id = c.cupo_id
           LEFT JOIN evaluaciones v ON v.expediente_id = e.id AND v.tipo::text = u.tipo::text
           WHERE u.fecha <= $1
             AND ((e.etapa = 'EXAMEN_CONOCIMIENTOS' AND u.tipo = 'CONOCIMIENTOS') OR (e.etapa = 'EXAMEN_MANEJO' AND u.tipo = 'MANEJO'))
             AND (v.id IS NULL OR v.estado = 'PENDIENTE')
             AND c.creado_en > coalesce(v.actualizado_en, '-infinity')) AS sin_resultado`,
      [fecha, hasta],
    );
    const consultas: { creado_en: Date }[] = await this.db.query(`SELECT creado_en FROM consultas_asistente WHERE origen = 'DERIVADA' AND respondida_en IS NULL`);
    const abiertos: { numero: string; creado_en: Date }[] = await this.db.query(`SELECT numero, creado_en FROM expedientes WHERE etapa <> 'EMITIDA'`);
    const emision: { id: number; numero: string; categoria: Categoria; abierta: boolean }[] = await this.db.query(
      `SELECT e.id, e.numero, e.categoria,
         EXISTS (SELECT 1 FROM observaciones_expediente o WHERE o.expediente_id = e.id AND o.estado = 'ABIERTA') AS abierta
       FROM expedientes e WHERE e.etapa = 'EMISION'`,
    );
    const verificaciones: { id: number; expediente_id: number; tipo: TipoVerificacion; resultado: ResultadoVerificacion; registrado_en: Date }[] = emision.length
      ? await this.db.query(`SELECT id, expediente_id, tipo, resultado, registrado_en FROM verificaciones_oficiales WHERE expediente_id = ANY($1)`, [emision.map((e) => e.id)])
      : [];
    const cupos: { fecha: string; tipo: 'CONOCIMIENTOS' | 'MANEJO'; libres: number }[] = await this.db.query(
      `SELECT to_char(fecha, 'YYYY-MM-DD') AS fecha, tipo, capacidad - ocupados AS libres FROM cupos WHERE fecha > $1 AND fecha <= $2`,
      [fecha, hasta],
    );

    return {
      documentosPorRevisar: entero(conteos.documentos),
      pagosPorVerificar: entero(conteos.pagos),
      observacionesAbiertas: entero(conteos.observaciones),
      licenciasPorRegistrar: entero(conteos.licencias),
      consultasPendientes: consultas.map((c) => new Date(c.creado_en)),
      derivadasUltimaSemana: entero(conteos.derivadas),
      examenesSinResultado: entero(conteos.sin_resultado),
      citasDeHoy: entero(conteos.citas_hoy),
      citasProximas: entero(conteos.citas_proximas),
      resultadosPorValidar: entero(conteos.por_validar),
      enEmision: emision.map((e) => ({
        numero: e.numero,
        categoria: e.categoria,
        observacionAbierta: e.abierta,
        verificaciones: verificaciones
          .filter((v) => v.expediente_id === e.id)
          .map((v): Verificacion => ({ id: v.id, expedienteId: v.expediente_id, tipo: v.tipo, resultado: v.resultado, detalle: null, gestorId: 0, registradoEn: v.registrado_en })),
      })),
      abiertos: abiertos.map((a) => ({ numero: a.numero, creadoEn: new Date(a.creado_en) })),
      cupos: cupos.map((c) => ({ fecha: c.fecha, tipo: c.tipo, libres: entero(c.libres) })),
    };
  }

  async datosPostulante(postulanteId: number, hoy: Date): Promise<DatosPostulante | null> {
    const [e]: { id: number; numero: string; categoria: Categoria; etapa: Etapa; creado_en: Date }[] = await this.db.query(
      `SELECT id, numero, categoria, etapa, creado_en FROM expedientes WHERE postulante_id = $1 ORDER BY id DESC LIMIT 1`,
      [postulanteId],
    );
    if (!e) return null;
    const documentos: { tipo: TipoDocumento; estado: string; observacion: string | null; fecha_emision: string | null }[] = await this.db.query(
      `SELECT DISTINCT ON (tipo) tipo, estado, observacion, to_char(fecha_emision, 'YYYY-MM-DD') AS fecha_emision
       FROM documentos WHERE expediente_id = $1 ORDER BY tipo, id DESC`,
      [e.id],
    );
    const [pago]: { estado: string; observacion: string | null }[] = await this.db.query(`SELECT estado, observacion FROM pagos WHERE expediente_id = $1 ORDER BY id DESC LIMIT 1`, [e.id]);
    const citas: { tipo: 'CONOCIMIENTOS' | 'MANEJO'; fecha: string; hora: string }[] = await this.db.query(
      // Una cita reservada antes del último resultado de ese examen ya se usó.
      `SELECT u.tipo, to_char(u.fecha, 'YYYY-MM-DD') AS fecha, u.hora FROM citas c JOIN cupos u ON u.id = c.cupo_id
       LEFT JOIN evaluaciones v ON v.expediente_id = c.expediente_id AND v.tipo::text = u.tipo::text
       WHERE c.expediente_id = $1 AND u.fecha >= $2 AND (v.id IS NULL OR v.intentos = 0 OR c.creado_en > v.actualizado_en)
       ORDER BY u.fecha, u.hora`,
      [e.id, dia(hoy)],
    );
    const evaluaciones: { tipo: 'CONOCIMIENTOS' | 'MANEJO'; estado: string; intentos: number }[] = await this.db.query(`SELECT tipo, estado, intentos FROM evaluaciones WHERE expediente_id = $1`, [e.id]);
    const [respuestas] = await this.db.query(
      `SELECT count(*) AS total FROM consultas_asistente WHERE postulante_id = $1 AND respondida_en > now() - interval '7 days'`,
      [postulanteId],
    );
    const [licencia]: { numero: string }[] = await this.db.query(`SELECT numero FROM licencias_emitidas WHERE expediente_id = $1`, [e.id]);

    return {
      numero: e.numero,
      categoria: e.categoria,
      etapa: e.etapa,
      creadoEn: new Date(e.creado_en),
      documentos: documentos.map((d) => ({ tipo: d.tipo, estado: d.estado, observacion: d.observacion, fechaEmision: d.fecha_emision ? new Date(`${d.fecha_emision}T00:00:00Z`) : null })),
      ultimoPago: pago ?? null,
      proximasCitas: citas,
      evaluaciones: evaluaciones.map((v) => ({ ...v, intentos: entero(v.intentos) })),
      respuestasNuevas: entero(respuestas.total),
      licencia: licencia?.numero ?? null,
    };
  }
}
