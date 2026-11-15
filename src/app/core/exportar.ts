import { formatoDinero, MESES } from './formato';

export type TipoColumna = 'texto' | 'dinero' | 'pct' | 'numero';

export interface ColumnaExport {
  titulo: string;
  clave: string;
  tipo?: TipoColumna;
}

export interface TablaExport {
  titulo: string;
  subtitulo?: string;
  columnas: ColumnaExport[];
  filas: Record<string, unknown>[];
  // filas resaltadas (subtotales y totales) por índice
  resaltadas?: number[];
}

const EMPRESA = 'Distribuidora Farmacéutica, S.A. de C.V.';

function celda(valor: unknown, tipo: TipoColumna = 'texto'): string {
  if (valor === null || valor === undefined || valor === '') return '';
  if (tipo === 'dinero') return formatoDinero(valor as string, false);
  if (tipo === 'pct') return `${(Number(valor) * 100).toFixed(2)}%`;
  if (tipo === 'numero') return Number(valor).toFixed(2);
  return String(valor);
}

function fecha() {
  return new Date().toLocaleString('es-SV', { dateStyle: 'medium', timeStyle: 'short' });
}

export async function exportarPdf(tablas: TablaExport[], archivo: string) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const anchas = tablas.some((t) => t.columnas.length > 7);
  const doc = new jsPDF({ orientation: anchas ? 'landscape' : 'portrait', unit: 'pt', format: 'letter' });
  const ancho = doc.internal.pageSize.getWidth();
  tablas.forEach((t, i) => {
    if (i > 0) doc.addPage();
    doc.setFontSize(12).setFont('helvetica', 'bold').text(EMPRESA, ancho / 2, 36, { align: 'center' });
    doc.setFontSize(11).text(t.titulo, ancho / 2, 52, { align: 'center' });
    doc.setFontSize(9).setFont('helvetica', 'normal');
    if (t.subtitulo) doc.text(t.subtitulo, ancho / 2, 66, { align: 'center' });
    autoTable(doc, {
      startY: 78,
      head: [t.columnas.map((c) => c.titulo)],
      body: t.filas.map((f) => t.columnas.map((c) => celda(f[c.clave], c.tipo))),
      styles: { fontSize: anchas ? 7 : 8, cellPadding: 3 },
      headStyles: { fillColor: [15, 42, 68] },
      columnStyles: Object.fromEntries(t.columnas.map((c, j) => [j, { halign: c.tipo && c.tipo !== 'texto' ? 'right' : 'left' }])),
      didParseCell: (h) => {
        if (h.section === 'body' && t.resaltadas?.includes(h.row.index)) h.cell.styles.fontStyle = 'bold';
      },
      didDrawPage: () => {
        doc.setFontSize(7).text(`DistriFarma ERP · Generado el ${fecha()}`, 40, doc.internal.pageSize.getHeight() - 20);
      }
    });
  });
  doc.save(`${archivo}.pdf`);
}

export async function exportarExcel(tablas: TablaExport[], archivo: string) {
  const ExcelJS = (await import('exceljs')).default;
  const libro = new ExcelJS.Workbook();
  libro.creator = 'DistriFarma ERP';
  const usados = new Set<string>();
  for (const t of tablas) {
    let nombre = t.titulo.replace(/[\\/?*[\]:]/g, '').slice(0, 28) || 'Hoja';
    while (usados.has(nombre)) nombre = `${nombre.slice(0, 26)}_${usados.size}`;
    usados.add(nombre);
    const hoja = libro.addWorksheet(nombre);
    hoja.addRow([EMPRESA]).font = { bold: true, size: 12 };
    hoja.addRow([t.titulo]).font = { bold: true };
    if (t.subtitulo) hoja.addRow([t.subtitulo]);
    hoja.addRow([]);
    const encabezado = hoja.addRow(t.columnas.map((c) => c.titulo));
    encabezado.eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A44' } };
    });
    t.filas.forEach((f, i) => {
      const fila = hoja.addRow(t.columnas.map((c) => {
        const v = f[c.clave];
        if (v === null || v === undefined || v === '') return null;
        return c.tipo && c.tipo !== 'texto' ? Number(v) : String(v);
      }));
      t.columnas.forEach((c, j) => {
        const cel = fila.getCell(j + 1);
        if (c.tipo === 'dinero') cel.numFmt = '#,##0.00;(#,##0.00)';
        if (c.tipo === 'pct') cel.numFmt = '0.00%';
        if (c.tipo === 'numero') cel.numFmt = '0.00';
      });
      if (t.resaltadas?.includes(i)) fila.font = { bold: true };
    });
    hoja.columns.forEach((col, j) => (col.width = j === 0 ? 42 : 16));
  }
  const buffer = await libro.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${archivo}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// Convierte las filas de una tabla mensual (estados financieros) al formato de exportación
export function tablaMensual(
  titulo: string, subtitulo: string,
  filas: { nombre: string; tipo?: string; codigo?: string; valores: string[]; total?: string; porcentaje?: number | null }[],
  meses: number[], opciones: { total?: string; porcentaje?: string } = {}
): TablaExport {
  const columnas: ColumnaExport[] = [
    { titulo: 'Concepto', clave: 'nombre' },
    ...meses.map((m) => ({ titulo: MESES[m - 1], clave: `m${m}`, tipo: 'dinero' as const }))
  ];
  if (opciones.total) columnas.push({ titulo: opciones.total, clave: 'total', tipo: 'dinero' });
  if (opciones.porcentaje) columnas.push({ titulo: opciones.porcentaje, clave: 'porcentaje', tipo: 'pct' });
  return {
    titulo, subtitulo, columnas,
    filas: filas.map((f) => ({
      nombre: f.codigo ? `${f.codigo} ${f.nombre}` : f.nombre,
      ...Object.fromEntries(meses.map((m, i) => [`m${m}`, f.valores[i]])),
      total: f.total, porcentaje: f.porcentaje
    })),
    resaltadas: filas.map((f, i) => (f.tipo === 'subtotal' || f.tipo === 'total' || f.tipo === 'nivel-1' ? i : -1)).filter((i) => i >= 0)
  };
}
