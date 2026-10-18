import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ApiService } from '../../core/api.service';
import { DineroPipe, esNegativo, MESES, MESES_LARGOS, PctPipe } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { PeriodoService } from '../../core/periodo.service';
import { DatosFuentesUsos, TEMA_FUENTES_USOS } from '../../core/temas';
import { QueSignifica } from '../../shared/que-significa';

interface Periodo { anio: number; escenario: string; ultimo_mes: number }

@Component({
  selector: 'df-fuentes-usos',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatProgressBarModule, BaseChartDirective, QueSignifica, DineroPipe, PctPipe],
  templateUrl: './fuentes-usos.html',
  styleUrl: './fuentes-usos.scss'
})
export class FuentesUsos {
  private api = inject(ApiService);
  private periodo = inject(PeriodoService);
  anio = this.periodo.anio;
  mes = this.periodo.mes;
  baseAnio = signal<number | null>(null);
  baseMes = signal<number | null>(null);
  periodos = signal<Periodo[]>([]);
  datos = signal<DatosFuentesUsos | null>(null);
  error = signal<string | null>(null);
  cargando = signal(false);
  tema = TEMA_FUENTES_USOS;
  meses = MESES_LARGOS;
  neg = esNegativo;

  anios = computed(() => this.periodos().filter((p) => p.escenario === 'REAL').map((p) => p.anio).sort((a, b) => b - a));

  grafico = computed<ChartConfiguration<'bar'>['data']>(() => {
    const m = this.datos()?.capitalTrabajo.meses ?? [];
    return {
      labels: m.map((x) => MESES[x.mes - 1]),
      datasets: [
        { label: 'Activo corriente', data: m.map((x) => Number(x.activoCorriente)), backgroundColor: '#0f766e', borderRadius: 4 },
        { label: 'Pasivo corriente', data: m.map((x) => Number(x.pasivoCorriente)), backgroundColor: '#94a3b8', borderRadius: 4 },
        { label: 'Capital de trabajo neto', data: m.map((x) => Number(x.neto)), backgroundColor: '#f59e0b', borderRadius: 4 }
      ]
    };
  });
  opciones: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
    scales: { y: { ticks: { callback: (v) => `$${Number(v) / 1000}k` }, grid: { color: '#eef1f5' } }, x: { grid: { display: false } } }
  };

  constructor() {
    this.api.get<Periodo[]>('/estados/periodos').then((p) => {
      this.periodos.set(p);
      const anios = this.anios();
      if (this.anio() === null || !anios.includes(this.anio()!)) this.anio.set(anios[0] ?? null);
      this.baseAnio.set(anios.find((a) => a < this.anio()!) ?? anios[0] ?? null);
    });
    effect(() => {
      const anio = this.anio();
      const base = this.baseAnio();
      if (anio !== null && base !== null) this.cargar(anio, this.mes(), base, this.baseMes());
    });
  }

  mesesDe(anio: number | null) {
    const p = this.periodos().find((x) => x.escenario === 'REAL' && x.anio === anio);
    return p ? Array.from({ length: p.ultimo_mes }, (_, i) => i + 1) : [];
  }

  fecha(p: { anio: number; mes: number }) {
    return `${MESES_LARGOS[p.mes - 1]} ${p.anio}`;
  }

  private async cargar(anio: number, mes: number | null, baseAnio: number, baseMes: number | null) {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.datos.set(await this.api.get<DatosFuentesUsos>('/analisis/fuentes-usos', { anio, mes, base_anio: baseAnio, base_mes: baseMes }));
    } catch (e) {
      this.datos.set(null);
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
