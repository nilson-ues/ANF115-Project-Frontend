import { Pipe, PipeTransform } from '@angular/core';

const dinero = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const entero = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const dec2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct1 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const MESES_LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function formatoDinero(valor: string | number | null | undefined, simbolo = false): string {
  if (valor === '') return '';
  if (valor === null || valor === undefined) return '—';
  const n = Number(valor);
  const texto = dinero.format(Math.abs(n));
  const conSimbolo = simbolo ? `$${texto}` : texto;
  return n < 0 ? `(${conSimbolo})` : conSimbolo;
}

export function formatoRazon(valor: number | null | undefined, unidad: string): string {
  if (valor === null || valor === undefined) return '—';
  switch (unidad) {
    case 'porcentaje': return `${pct1.format(valor * 100)}%`;
    case 'dias': return `${entero.format(valor)} días`;
    case 'dinero': return formatoDinero(valor, true);
    default: return dec2.format(valor);
  }
}

export function formatoPct(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? '—' : `${pct1.format(valor * 100)}%`;
}

@Pipe({ name: 'dinero' })
export class DineroPipe implements PipeTransform {
  transform(valor: string | number | null | undefined, simbolo = false) {
    return formatoDinero(valor, simbolo);
  }
}

@Pipe({ name: 'razon' })
export class RazonPipe implements PipeTransform {
  transform(valor: number | null | undefined, unidad: string) {
    return formatoRazon(valor, unidad);
  }
}

@Pipe({ name: 'pct' })
export class PctPipe implements PipeTransform {
  transform(valor: number | null | undefined) {
    return formatoPct(valor);
  }
}

@Pipe({ name: 'mes' })
export class MesPipe implements PipeTransform {
  transform(valor: number, largo = false) {
    return (largo ? MESES_LARGOS : MESES)[valor - 1] ?? '';
  }
}

export function esNegativo(valor: string | number | null | undefined) {
  return valor !== null && valor !== undefined && Number(valor) < 0;
}
