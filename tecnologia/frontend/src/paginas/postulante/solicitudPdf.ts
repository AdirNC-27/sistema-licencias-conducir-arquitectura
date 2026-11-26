import type { Expediente, PostulanteResumen } from '../../api/tipos';

/**
 * Solicitud con carácter de declaración jurada, con los datos del postulante ya llenos.
 * Modelo referencial armado con los requisitos del TUPA (PA6190033B): el postulante la imprime,
 * la firma, pone su huella, la escanea y la adjunta. pdf-lib se carga solo al descargar.
 */
export async function descargarSolicitud(expediente: Expediente, postulante: PostulanteResumen): Promise<void> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Solicitud y declaración jurada · ${expediente.numero}`);
  pdf.setAuthor(postulante.nombre);
  pdf.setCreator('Sistema de Licencias Clase B · MPH Huamanga');
  const pagina = pdf.addPage([595.28, 841.89]); // A4
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const azul = rgb(0.04, 0.16, 0.44);
  const gris = rgb(0.33, 0.36, 0.42);
  const margen = 56;
  const ancho = 595.28 - margen * 2;
  let y = 790;

  try {
    const escudo = await pdf.embedPng(await (await fetch('/escudo-huamanga.png')).arrayBuffer());
    pagina.drawImage(escudo, { x: margen, y: y - 46, width: 46, height: 46 });
  } catch {
    // sin escudo el documento sigue siendo válido
  }
  pagina.drawText('MUNICIPALIDAD PROVINCIAL DE HUAMANGA', { x: margen + 58, y: y - 14, size: 12, font: negrita, color: azul });
  pagina.drawText('Gerencia de Transporte · Subgerencia de Tránsito y Seguridad Vial', { x: margen + 58, y: y - 30, size: 9, font: normal, color: gris });
  y -= 78;

  const centrado = (texto: string, tamano: number, fuente = negrita) =>
    pagina.drawText(texto, { x: margen + (ancho - fuente.widthOfTextAtSize(texto, tamano)) / 2, y, size: tamano, font: fuente, color: azul });
  centrado('SOLICITUD DE LICENCIA DE CONDUCIR CLASE B', 14);
  y -= 18;
  centrado('CON CARÁCTER DE DECLARACIÓN JURADA', 11);
  y -= 30;

  /** Escribe un párrafo con salto de línea automático y devuelve la nueva altura. */
  const parrafo = (texto: string, tamano = 10.5, fuente = normal, sangria = 0) => {
    const palabras = texto.split(' ');
    let linea = '';
    for (const p of palabras) {
      const prueba = linea ? `${linea} ${p}` : p;
      if (fuente.widthOfTextAtSize(prueba, tamano) > ancho - sangria) {
        pagina.drawText(linea, { x: margen + sangria, y, size: tamano, font: fuente });
        y -= tamano * 1.45;
        linea = p;
      } else linea = prueba;
    }
    if (linea) pagina.drawText(linea, { x: margen + sangria, y, size: tamano, font: fuente });
    y -= tamano * 1.45;
  };

  pagina.drawText('Señor Alcalde de la Municipalidad Provincial de Huamanga:', { x: margen, y, size: 10.5, font: negrita });
  y -= 22;

  const categoria = expediente.categoria === 'II-C' ? 'II-C (mototaxi, servicio público)' : 'II-B (moto lineal, uso particular)';
  const datos: [string, string][] = [
    ['Nombres y apellidos', postulante.nombre],
    ['DNI', postulante.dni],
    ['Domicilio', ''],
    ['Correo electrónico', postulante.correo || ''],
    ['Celular', postulante.celular || ''],
    ['Categoría solicitada', categoria],
    ['N.° de expediente digital', expediente.numero],
  ];
  for (const [etiqueta, valor] of datos) {
    pagina.drawText(`${etiqueta}:`, { x: margen, y, size: 10, font: negrita, color: gris });
    if (valor) pagina.drawText(valor, { x: margen + 150, y, size: 10.5, font: normal });
    pagina.drawLine({ start: { x: margen + 148, y: y - 3 }, end: { x: margen + ancho, y: y - 3 }, thickness: 0.5, color: rgb(0.75, 0.78, 0.82) });
    y -= 20;
  }
  y -= 8;

  parrafo(`Solicito la emisión de mi licencia de conducir clase B, categoría ${categoria}, conforme al procedimiento PA6190033B del TUPA de la Municipalidad Provincial de Huamanga.`);
  y -= 6;
  pagina.drawText('DECLARO BAJO JURAMENTO:', { x: margen, y, size: 10.5, font: negrita, color: azul });
  y -= 18;
  const declaraciones = [
    'Tener 18 años de edad o más.',
    'No estar privado ni suspendido del derecho a conducir por resolución judicial firme.',
    ...(expediente.categoria === 'II-C' ? ['No tener multas ni sanciones pendientes de pago registradas en el Registro Nacional de Sanciones.'] : []),
    'Que los datos consignados y los documentos que adjunto son verdaderos. Conozco que esta declaración se sujeta a fiscalización posterior y que, de faltar a la verdad, me someto a las sanciones administrativas y penales que correspondan (Ley 27444, principio de presunción de veracidad).',
  ];
  declaraciones.forEach((d, i) => {
    pagina.drawText(`${i + 1}.`, { x: margen + 6, y, size: 10.5, font: negrita });
    parrafo(d, 10.5, normal, 22);
    y -= 2;
  });

  y -= 6;
  pagina.drawText('Adjunto: certificado médico registrado en el SNC, 2 fotografías tamaño carné a color' + (expediente.categoria === 'II-C' ? ' y constancia COFIPRO.' : '.'), { x: margen, y, size: 9.5, font: normal, color: gris });
  y -= 26;
  const hoy = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  pagina.drawText(`Ayacucho, ${hoy}`, { x: margen, y, size: 10.5, font: normal });

  // Firma y huella
  const baseFirma = 170;
  pagina.drawLine({ start: { x: margen, y: baseFirma }, end: { x: margen + 220, y: baseFirma }, thickness: 0.8 });
  pagina.drawText('Firma del solicitante', { x: margen + 60, y: baseFirma - 14, size: 9.5, font: normal, color: gris });
  pagina.drawText(`DNI ${postulante.dni}`, { x: margen + 78, y: baseFirma - 27, size: 9.5, font: normal, color: gris });
  pagina.drawRectangle({ x: margen + ancho - 80, y: baseFirma - 30, width: 80, height: 96, borderWidth: 0.8, borderColor: rgb(0.4, 0.44, 0.5) });
  pagina.drawText('Huella digital', { x: margen + ancho - 70, y: baseFirma - 44, size: 9, font: normal, color: gris });
  pagina.drawText('(índice derecho)', { x: margen + ancho - 72, y: baseFirma - 56, size: 8, font: normal, color: gris });

  // Pie
  pagina.drawLine({ start: { x: margen, y: 92 }, end: { x: margen + ancho, y: 92 }, thickness: 0.5, color: rgb(0.8, 0.82, 0.86) });
  const pie = [
    'Cómo usarla: imprímela, complétala con tu domicilio, fírmala, pon tu huella, escanéala o tómale una foto nítida y adjúntala',
    'en «Requisitos y documentos». Modelo referencial generado por el Sistema de Licencias Clase B con los requisitos del TUPA',
    '(PA6190033B); no reemplaza el formulario oficial que la municipalidad pueda entregar en ventanilla.',
  ];
  pie.forEach((t, i) => pagina.drawText(t, { x: margen, y: 78 - i * 11, size: 7.5, font: normal, color: gris }));

  const bytes = await pdf.save();
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `solicitud-declaracion-jurada-${expediente.numero}.pdf`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
