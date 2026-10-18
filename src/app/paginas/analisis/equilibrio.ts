import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DineroPipe, formatoDinero, PctPipe } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { PeriodoService } from '../../core/periodo.service';
import { DatosEquilibrio, TEMA_EQUILIBRIO } from '../../core/temas';
import { SelectorPeriodo } from '../../shared/periodo';
import { QueSignifica } from '../../shared/que-significa';

@Component({
  selector: 'df-equilibrio',
  imports: [FormsModule, MatButtonModule, MatButtonToggleModule, MatProgressBarModule, BaseChartDirective, SelectorPeriodo, QueSignifica, DineroPipe, PctPipe],
  templateUrl: './equilibrio.html',
  styleUrl: './equilibrio.scss'
})
export class PuntoEquilibrio {
  private api = inject(ApiService);
  private aviso = inject(MatSnackBar);
  private periodo = inject(PeriodoService);
  auth = inject(AuthService);
  anio = this.periodo.anio;
  escenario = this.periodo.escenario;
  mes = this.periodo.mes;
  datos = signal<DatosEquilibrio | null>(null);
  error = signal<string | null>(null);
  cargando = signal(false);
  editando = signal(false);
  clasificacion = signal<{ rubro: string; nombre: string; comportamiento: 'FIJO' | 'VARIABLE' }[]>([]);
  tema = TEMA_EQUILIBRIO;

  grafico = computed<ChartConfiguration<'line'>['data']>(() => {
    const d = this.datos();
    if (!d || d.puntoEquilibrio === null) return { datasets: [] };
    const ventas = Number(d.ventas);
    const pe = Number(d.puntoEquilibrio);
    const fijos = Number(d.costosFijos);
    const r = d.razonVariable ?? 0;
    const max = Math.max(ventas, pe) * 1.25;
    return {
      datasets: [
        { label: 'Ingresos (ventas)', data: [{ x: 0, y: 0 }, { x: max, y: max }], borderColor: '#0f766e', backgroundColor: '#0f766e', pointRadius: 0 },
        { label: 'Costos totales', data: [{ x: 0, y: fijos }, { x: max, y: fijos + r * max }], borderColor: '#b91c1c', backgroundColor: '#b91c1c', pointRadius: 0 },
        { label: 'Costos fijos', data: [{ x: 0, y: fijos }, { x: max, y: fijos }], borderColor: '#94a3b8', backgroundColor: '#94a3b8', borderDash: [6, 4], pointRadius: 0 },
        { label: 'Punto de equilibrio', data: [{ x: pe, y: pe }], borderColor: '#f59e0b', backgroundColor: '#f59e0b', pointRadius: 7, showLine: false },
        { label: 'Ventas actuales', data: [{ x: ventas, y: ventas }], borderColor: '#0f2a44', backgroundColor: '#0f2a44', pointRadius: 6, pointStyle: 'rectRot', showLine: false }
      ]
    };
  });

  opciones: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12 } },
      tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatoDinero((c.raw as { y: number }).y, true)}` } }
    },
    scales: {
      x: { type: 'linear', title: { display: true, text: 'Ventas ($)' }, ticks: { callback: (v) => `$${Math.round(Number(v) / 1000)}k` }, grid: { color: '#eef1f5' } },
      y: { title: { display: true, text: 'Ingresos y costos ($)' }, ticks: { callback: (v) => `$${Math.round(Number(v) / 1000)}k` }, grid: { color: '#eef1f5' } }
    }
  };

  constructor() {
    effect(() => {
      const anio = this.anio();
      if (anio !== null) this.cargar(anio, this.escenario(), this.mes());
    });
  }

  async cargar(anio: number, escenario: string, mes: number | null) {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const d = await this.api.get<DatosEquilibrio>('/analisis/equilibrio', { anio, escenario, mes });
      this.datos.set(d);
      this.clasificacion.set(d.rubros.map((r) => ({ rubro: r.rubro, nombre: r.nombre, comportamiento: r.comportamiento })));
    } catch (e) {
      this.datos.set(null);
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  async guardar() {
    try {
      await this.api.put('/analisis/equilibrio/clasificacion', this.clasificacion().map((c) => ({ rubro: c.rubro, comportamiento: c.comportamiento })));
      this.editando.set(false);
      this.aviso.open('Clasificación guardada. Punto de equilibrio recalculado.', 'OK', { duration: 3000 });
      this.cargar(this.anio()!, this.escenario(), this.mes());
    } catch (e) {
      this.aviso.open(mensajeError(e), 'Cerrar', { duration: 6000 });
    }
  }
}
