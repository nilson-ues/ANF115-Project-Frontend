import { NgTemplateOutlet } from '@angular/common';
import { Component, computed } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { DineroPipe, esNegativo, PctPipe } from '../../core/formato';
import { SelectorPeriodo } from '../../shared/periodo';
import { Teoria, TeoriaPanel } from '../../shared/teoria';
import { PaginaPeriodo } from '../estados/base';

interface Fila {
  nombre: string; tipo?: string; nivel?: number; real: string; presupuesto: string; variacion: string;
  variacionPct: number | null; estado: 'favorable' | 'desfavorable'; alerta: boolean;
}
interface Control {
  anio: number;
  hastaMes: number;
  tolerancia: number;
  resultados: Fila[];
  balance: Fila[];
  variacionUtilidadBruta: { margenReal: number; margenPresupuesto: number; porVentaNoLograda: string; porMargenNoLogrado: string; total: string };
  teoria: { comparativo: Teoria; variacionUtilidadBruta: Teoria };
}

@Component({
  selector: 'df-control',
  imports: [SelectorPeriodo, TeoriaPanel, MatProgressBarModule, MatTabsModule, NgTemplateOutlet, DineroPipe, PctPipe],
  templateUrl: './control.html',
  styleUrl: './control.scss'
})
export class ControlPresupuestario extends PaginaPeriodo<Control> {
  ruta = '/analisis/comparativo';
  neg = esNegativo;
  alertas = computed(() => (this.datos()?.resultados ?? []).filter((f) => f.alerta).length + (this.datos()?.balance ?? []).filter((f) => f.alerta).length);
  teorias = computed(() => {
    const d = this.datos();
    return d ? [d.teoria.comparativo, d.teoria.variacionUtilidadBruta] : [];
  });
}
