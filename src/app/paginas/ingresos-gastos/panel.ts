import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ApiService } from '../../core/api.service';
import { DineroPipe, formatoDinero, MESES } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { TEORIA_INGRESOS_GASTOS } from '../../core/teoria-modulos';
import { TeoriaPanel } from '../../shared/teoria';
import { Indicadores, Movimiento, pctTexto, rangoAnio } from './modelos';

interface Resumen {
  desde: string;
  hasta: string;
  anios: number[];
  cantidad: number;
  indicadores: Indicadores;
  porMes: ({ periodo: string } & Indicadores)[];
  porCategoria: { id: number; nombre: string; tipo: string; monto: string; cantidad: number; participacion: number | null }[];
  ultimos: Movimiento[];
}

const COLORES = ['#0f766e', '#2563eb', '#b45309', '#7c3aed', '#be123c', '#0891b2', '#65a30d', '#c2410c', '#4f46e5', '#64748b'];

@Component({
  selector: 'df-panel-ig',
  imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule, BaseChartDirective, TeoriaPanel, DineroPipe],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Panel de ingresos y gastos</h1>
          <div class="sub">Indicadores del período · {{ datos()?.desde }} al {{ datos()?.hasta }}</div>
        </div>
        <div class="acciones">
          <mat-form-field appearance="outline" class="compacto">
            <mat-label>Año</mat-label>
            <mat-select [ngModel]="anio()" (ngModelChange)="elegirAnio($event)">
              @for (a of datos()?.anios ?? []; track a) { <mat-option [value]="a">{{ a }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="compacto"><mat-label>Desde</mat-label><input matInput type="date" [(ngModel)]="desde" (change)="cargar()" /></mat-form-field>
          <mat-form-field appearance="outline" class="compacto"><mat-label>Hasta</mat-label><input matInput type="date" [(ngModel)]="hasta" (change)="cargar()" /></mat-form-field>
          <df-teoria [temas]="teoria" fuente="Guía del proyecto · Sección 7" />
        </div>
      </div>
      @if (cargando()) { <mat-progress-bar mode="indeterminate" /> }
      @if (error()) { <div class="aviso error">{{ error() }}</div> }

      @if (datos(); as d) {
        <div class="kpis">
          <div class="tarjeta kpi"><div class="etiqueta">Ingresos totales</div><div class="grande">{{ d.indicadores.ingresos | dinero: true }}</div><div class="nota">{{ d.cantidad }} movimientos en el período</div></div>
          <div class="tarjeta kpi"><div class="etiqueta">Gastos totales</div><div class="grande">{{ d.indicadores.gastos | dinero: true }}</div><div class="nota">Costos y gastos registrados</div></div>
          <div class="tarjeta kpi" [class.alerta]="+d.indicadores.resultado < 0" [class.bien]="+d.indicadores.resultado > 0">
            <div class="etiqueta">Resultado financiero</div><div class="grande">{{ d.indicadores.resultado | dinero: true }}</div><div class="nota">Ingresos totales − Gastos totales</div>
          </div>
          <div class="tarjeta kpi" [class.alerta]="(d.indicadores.porcentajeGastos ?? 0) > 100">
            <div class="etiqueta">Porcentaje de gastos</div><div class="grande">{{ pct(d.indicadores.porcentajeGastos) }}</div><div class="nota">Gastos / Ingresos × 100</div>
          </div>
        </div>

        <div class="dos-columnas">
          <div class="tarjeta">
            <h2>Ingresos y gastos por mes</h2>
            <div class="lienzo"><canvas baseChart type="bar" [data]="barras()" [options]="opcionesBarras"></canvas></div>
          </div>
          <div class="tarjeta">
            <h2>Gastos por categoría</h2>
            <div class="lienzo"><canvas baseChart type="doughnut" [data]="dona()" [options]="opcionesDona"></canvas></div>
          </div>
        </div>

        <div class="dos-columnas seccion">
          <div class="tabla-scroll">
            <table class="estado">
              <thead><tr><th>Categoría</th><th>Tipo</th><th>Movimientos</th><th>Monto</th><th>Participación</th></tr></thead>
              <tbody>
                @for (c of d.porCategoria; track c.id + c.tipo) {
                  <tr><td>{{ c.nombre }}</td><td class="num"><span class="chip" [class]="c.tipo === 'INGRESO' ? 'verde' : 'rojo'">{{ c.tipo === 'INGRESO' ? 'Ingreso' : 'Gasto' }}</span></td>
                    <td class="num">{{ c.cantidad }}</td><td class="num">{{ c.monto | dinero }}</td><td class="num">{{ pct(c.participacion) }}</td></tr>
                } @empty { <tr><td colspan="5" class="vacio">Sin movimientos en el período</td></tr> }
              </tbody>
            </table>
          </div>
          <div class="tarjeta">
            <div class="titulo-fila"><h2>Últimos movimientos</h2><a mat-button routerLink="/ingresos-gastos/movimientos">Ver todos</a></div>
            <table class="estado">
              <tbody>
                @for (m of d.ultimos; track m.id) {
                  <tr><td>{{ m.fecha }} · {{ m.concepto }}<div class="muted">{{ m.categoria }}</div></td>
                    <td class="num" [class.negativo]="m.tipo === 'GASTO'">{{ m.tipo === 'GASTO' ? '−' : '+' }}{{ m.monto | dinero }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .titulo-fila { display: flex; justify-content: space-between; align-items: center; h2 { margin: 0; } }
    .muted { font-size: 12px; color: var(--df-muted); }
    table.estado td:first-child { min-width: 200px; }
  `
})
export class PanelIngresosGastos {
  private api = inject(ApiService);
  teoria = TEORIA_INGRESOS_GASTOS;
  datos = signal<Resumen | null>(null);
  cargando = signal(false);
  error = signal<string | null>(null);
  anio = signal<number | null>(null);
  desde = '';
  hasta = '';
  pct = pctTexto;

  barras = computed<ChartConfiguration<'bar'>['data']>(() => {
    const d = this.datos();
    if (!d) return { datasets: [] };
    return {
      labels: d.porMes.map((m) => `${MESES[Number(m.periodo.slice(5, 7)) - 1]} ${m.periodo.slice(2, 4)}`),
      datasets: [
        { label: 'Ingresos', data: d.porMes.map((m) => Number(m.ingresos)), backgroundColor: '#0f766e' },
        { label: 'Gastos', data: d.porMes.map((m) => Number(m.gastos)), backgroundColor: '#b91c1c' }
      ]
    };
  });

  dona = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const gastos = (this.datos()?.porCategoria ?? []).filter((c) => c.tipo === 'GASTO');
    return {
      labels: gastos.map((c) => c.nombre),
      datasets: [{ data: gastos.map((c) => Number(c.monto)), backgroundColor: COLORES }]
    };
  });

  opcionesBarras: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatoDinero(c.raw as number, true)}` } } },
    scales: { y: { ticks: { callback: (v) => `$${Math.round(Number(v) / 1000)}k` } } }
  };

  opcionesDona: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { boxWidth: 12 } }, tooltip: { callbacks: { label: (c) => `${c.label}: ${formatoDinero(c.raw as number, true)}` } } }
  };

  constructor() {
    this.cargar();
  }

  elegirAnio(anio: number) {
    const r = rangoAnio(anio);
    this.desde = r.desde;
    this.hasta = r.hasta;
    this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const d = await this.api.get<Resumen>('/movimientos/resumen', { desde: this.desde, hasta: this.hasta });
      this.datos.set(d);
      this.desde = d.desde;
      this.hasta = d.hasta;
      this.anio.set(d.desde.slice(0, 4) === d.hasta.slice(0, 4) ? Number(d.desde.slice(0, 4)) : null);
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
