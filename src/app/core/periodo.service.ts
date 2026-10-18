import { Injectable, signal } from '@angular/core';

// Período compartido entre las pantallas de estados y análisis
@Injectable({ providedIn: 'root' })
export class PeriodoService {
  anio = signal<number | null>(null);
  escenario = signal<'REAL' | 'PRESUPUESTO'>('REAL');
  mes = signal<number | null>(null);
}
