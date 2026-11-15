export type TipoMovimiento = 'INGRESO' | 'GASTO';

export interface Categoria {
  id: number;
  nombre: string;
  tipo: TipoMovimiento;
  cuenta_codigo: string | null;
  cuenta_nombre?: string | null;
  descripcion: string | null;
  activa: boolean;
  movimientos?: number;
}

export interface Movimiento {
  id: number;
  fecha: string;
  tipo: TipoMovimiento;
  categoria_id: number;
  categoria: string;
  concepto: string;
  monto: string;
  forma_pago: string;
  referencia: string | null;
  anulado: boolean;
  motivo_anulacion: string | null;
  usuario: string | null;
}

export interface Indicadores {
  ingresos: string;
  gastos: string;
  resultado: string;
  porcentajeGastos: number | null;
}

export const FORMAS_PAGO = [
  { valor: 'EFECTIVO', texto: 'Efectivo' },
  { valor: 'TRANSFERENCIA', texto: 'Transferencia' },
  { valor: 'CHEQUE', texto: 'Cheque' },
  { valor: 'TARJETA', texto: 'Tarjeta' },
  { valor: 'CREDITO', texto: 'Crédito' }
];

export const pctTexto = (p: number | null) => (p === null ? '—' : `${p.toFixed(2)}%`);

export function rangoAnio(anio: number) {
  return { desde: `${anio}-01-01`, hasta: `${anio}-12-31` };
}

export function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
