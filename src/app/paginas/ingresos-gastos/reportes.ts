import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ApiService } from '../../core/api.service';
import { ColumnaExport, TablaExport } from '../../core/exportar';
import { DineroPipe, formatoDinero, MESES } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { TEORIA_INGRESOS_GASTOS } from '../../core/teoria-modulos';
import { Exportar } from '../../shared/exportar';
import { TeoriaPanel } from '../../shared/teoria';
import { Categoria, hoy, Indicadores, pctTexto } from './modelos';

type Agrupar = 'dia' | 'mes' | 'anio';

interface Reporte {
  desde: string;
  hasta: string;
  agrupar: Agrupar;
  filas: ({ periodo: string; cantidad: number } & Indicadores)[];
  categorias: { nombre: string; tipo: string; periodos: Record<string, string>; total: string }[];
  totales: Indicadores;
  conciliacion: { anio: number; resultadoMovimientos: string; utilidadAntesImpuesto: string; diferencia: string }[];
}

const NOMBRE: Record<Agrupar, string> = { dia: 'diario', mes: 'mensual', anio: 'anual' };

@Component({
  selector: 'df-reportes-ig',
  imports: [FormsModule, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule, BaseChartDirective, DineroPipe, Exportar, TeoriaPanel],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Reportes de ingresos y gastos</h1>
          <div class="sub">Reporte {{ nombre() }} del {{ desde }} al {{ hasta }}</div>
        </div>
        <div class="acciones">
          <df-exportar [tablas]="exportar" [archivo]="'reporte-' + nombre()" />
          <df-teoria [temas]="teoria" fuente="Guía del proyecto" />
        </div>
      </div>

      <div class="filtros">
        <mat-button-toggle-group [(ngModel)]="agrupar" (change)="cargar()" hideSingleSelectionIndicator>
          <mat-button-toggle value="dia">Diario</mat-button-toggle>
          <mat-button-toggle value="mes">Mensual</mat-button-toggle>
          <mat-button-toggle value="anio">Anual</mat-button-toggle>
        </mat-button-toggle-group>
        <mat-form-field appearance="outline"><mat-label>Desde</mat-label><input matInput type="date" [(ngModel)]="desde" (change)="cargar()" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Hasta</mat-label><input matInput type="date" [(ngModel)]="hasta" (change)="cargar()" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Tipo</mat-label>
          <mat-select [(ngModel)]="tipo" (selectionChange)="categoriaId = null; cargar()">
            <mat-option value="">Todos</mat-option><mat-option value="INGRESO">Ingresos</mat-option><mat-option value="GASTO">Gastos</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Categoría</mat-label>
          <mat-select [(ngModel)]="categoriaId" (selectionChange)="cargar()">
            <mat-option [value]="null">Todas</mat-option>
            @for (c of categoriasFiltro(); track c.id) { <mat-option [value]="c.id">{{ c.nombre }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <span class="atajos">
          <button mat-button (click)="rango('hoy')">Hoy</button>
          <button mat-button (click)="rango('mes')">Este mes</button>
          <button mat-button (click)="rango('anio')">Este año</button>
          <button mat-button (click)="rango('tesis')">2008–2009 (tesis)</button>
        </span>
      </div>

      @if (cargando()) { <mat-progress-bar mode="indeterminate" /> }
      @if (error()) { <div class="aviso error">{{ error() }}</div> }

      @if (datos(); as d) {
        <div class="kpis">
          <div class="tarjeta kpi"><div class="etiqueta">Ingresos totales</div><div class="grande">{{ d.totales.ingresos | dinero: true }}</div></div>
          <div class="tarjeta kpi"><div class="etiqueta">Gastos totales</div><div class="grande">{{ d.totales.gastos | dinero: true }}</div></div>
          <div class="tarjeta kpi" [class.alerta]="+d.totales.resultado < 0"><div class="etiqueta">Resultado financiero</div><div class="grande">{{ d.totales.resultado | dinero: true }}</div></div>
          <div class="tarjeta kpi"><div class="etiqueta">% de gastos</div><div class="grande">{{ pct(d.totales.porcentajeGastos) }}</div></div>
        </div>

        @if (d.filas.length > 1) {
          <div class="tarjeta"><div class="lienzo"><canvas baseChart type="line" [data]="grafico()" [options]="opciones"></canvas></div></div>
        }

        <div class="tabla-scroll seccion">
          <table class="estado">
            <thead><tr><th>Período</th><th>Movimientos</th><th>Ingresos</th><th>Gastos</th><th>Resultado</th><th>% de gastos</th></tr></thead>
            <tbody>
              @for (f of d.filas; track f.periodo) {
                <tr><td>{{ etiqueta(f.periodo) }}</td><td class="num">{{ f.cantidad }}</td><td class="num">{{ f.ingresos | dinero }}</td>
                  <td class="num">{{ f.gastos | dinero }}</td><td class="num" [class.negativo]="+f.resultado < 0">{{ f.resultado | dinero }}</td><td class="num">{{ pct(f.porcentajeGastos) }}</td></tr>
              } @empty { <tr><td colspan="6" class="vacio">Sin movimientos en el rango</td></tr> }
              @if (d.filas.length) {
                <tr class="total"><td>Total</td><td class="num">{{ cantidad() }}</td><td class="num">{{ d.totales.ingresos | dinero }}</td><td class="num">{{ d.totales.gastos | dinero }}</td>
                  <td class="num">{{ d.totales.resultado | dinero }}</td><td class="num">{{ pct(d.totales.porcentajeGastos) }}</td></tr>
              }
            </tbody>
          </table>
        </div>

        @if (agrupar !== 'dia' && d.categorias.length) {
          <h2 class="titulo">Detalle por categoría</h2>
          <div class="tabla-scroll">
            <table class="estado">
              <thead><tr><th>Categoría</th>@for (f of d.filas; track f.periodo) { <th>{{ etiqueta(f.periodo) }}</th> }<th class="col-total">Total</th></tr></thead>
              <tbody>
                @for (c of d.categorias; track c.tipo + c.nombre) {
                  <tr><td><span class="punto" [class]="c.tipo === 'INGRESO' ? 'verde' : 'rojo'"></span> {{ c.nombre }}</td>
                    @for (f of d.filas; track f.periodo) { <td class="num">{{ c.periodos[f.periodo] | dinero }}</td> }
                    <td class="num col-total">{{ c.total | dinero }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (d.conciliacion.length) {
          <h2 class="titulo">Conciliación con el estado de resultados</h2>
          <div class="tabla-scroll">
            <table class="estado">
              <thead><tr><th>Año</th><th>Resultado de los movimientos</th><th>Utilidad antes de impuesto y reserva</th><th>Diferencia</th><th></th></tr></thead>
              <tbody>
                @for (c of d.conciliacion; track c.anio) {
                  <tr><td>{{ c.anio }}</td><td class="num">{{ c.resultadoMovimientos | dinero }}</td><td class="num">{{ c.utilidadAntesImpuesto | dinero }}</td>
                    <td class="num">{{ c.diferencia | dinero }}</td>
                    <td class="centro"><span class="chip" [class]="abs(c.diferencia) <= 0.05 ? 'verde' : 'amarillo'">{{ abs(c.diferencia) <= 0.05 ? 'Concilia' : 'Revisar' }}</span></td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .atajos { display: flex; gap: 2px; }
    .titulo { font-size: 15px; margin: 22px 0 10px; }
  `
})
export class ReportesIngresosGastos {
  private api = inject(ApiService);
  teoria = TEORIA_INGRESOS_GASTOS;
  pct = pctTexto;
  datos = signal<Reporte | null>(null);
  categorias = signal<Categoria[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
  agrupar: Agrupar = 'mes';
  desde = '2009-01-01';
  hasta = '2009-12-31';
  tipo = '';
  categoriaId: number | null = null;
  nombre = signal('mensual');

  categoriasFiltro = computed(() => this.categorias().filter((c) => !this.tipo || c.tipo === this.tipo));
  cantidad = computed(() => (this.datos()?.filas ?? []).reduce((s, f) => s + f.cantidad, 0));

  grafico = computed<ChartConfiguration<'line'>['data']>(() => {
    const d = this.datos();
    if (!d) return { datasets: [] };
    return {
      labels: d.filas.map((f) => this.etiqueta(f.periodo)),
      datasets: [
        { label: 'Ingresos', data: d.filas.map((f) => Number(f.ingresos)), borderColor: '#0f766e', backgroundColor: '#0f766e', tension: 0.25 },
        { label: 'Gastos', data: d.filas.map((f) => Number(f.gastos)), borderColor: '#b91c1c', backgroundColor: '#b91c1c', tension: 0.25 },
        { label: 'Resultado', data: d.filas.map((f) => Number(f.resultado)), borderColor: '#0f2a44', backgroundColor: '#0f2a44', borderDash: [5, 4], tension: 0.25 }
      ]
    };
  });

  opciones: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatoDinero(c.raw as number, true)}` } } },
    scales: { y: { ticks: { callback: (v) => formatoDinero(Number(v), true) } } }
  };

  constructor() {
    this.api.get<Categoria[]>('/categorias').then((c) => this.categorias.set(c)).catch(() => undefined);
    this.cargar();
  }

  abs(v: string) {
    return Math.abs(Number(v));
  }

  etiqueta(periodo: string) {
    if (periodo.length === 7) return `${MESES[Number(periodo.slice(5, 7)) - 1]} ${periodo.slice(0, 4)}`;
    return periodo;
  }

  rango(tipo: 'hoy' | 'mes' | 'anio' | 'tesis') {
    const h = hoy();
    if (tipo === 'hoy') { this.desde = h; this.hasta = h; this.agrupar = 'dia'; }
    if (tipo === 'mes') { this.desde = `${h.slice(0, 7)}-01`; this.hasta = h; this.agrupar = 'dia'; }
    if (tipo === 'anio') { this.desde = `${h.slice(0, 4)}-01-01`; this.hasta = `${h.slice(0, 4)}-12-31`; this.agrupar = 'mes'; }
    if (tipo === 'tesis') { this.desde = '2008-01-01'; this.hasta = '2009-12-31'; this.agrupar = 'anio'; }
    this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const d = await this.api.get<Reporte>('/movimientos/reporte', {
        desde: this.desde, hasta: this.hasta, agrupar: this.agrupar, tipo: this.tipo, categoria_id: this.categoriaId
      });
      this.datos.set(d);
      this.nombre.set(NOMBRE[d.agrupar]);
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  exportar = (): TablaExport[] => {
    const d = this.datos();
    if (!d) return [];
    const subtitulo = `Del ${d.desde} al ${d.hasta}${this.tipo ? ` · ${this.tipo === 'INGRESO' ? 'Ingresos' : 'Gastos'}` : ''}`;
    const tablas: TablaExport[] = [{
      titulo: `Reporte ${this.nombre()} de ingresos y gastos`, subtitulo,
      columnas: [
        { titulo: 'Período', clave: 'periodo' }, { titulo: 'Movimientos', clave: 'cantidad' }, { titulo: 'Ingresos', clave: 'ingresos', tipo: 'dinero' },
        { titulo: 'Gastos', clave: 'gastos', tipo: 'dinero' }, { titulo: 'Resultado', clave: 'resultado', tipo: 'dinero' }, { titulo: '% de gastos', clave: 'pct' }
      ],
      filas: [
        ...d.filas.map((f) => ({ ...f, periodo: this.etiqueta(f.periodo), pct: pctTexto(f.porcentajeGastos) })),
        { periodo: 'Total', cantidad: this.cantidad(), ...d.totales, pct: pctTexto(d.totales.porcentajeGastos) }
      ],
      resaltadas: [d.filas.length]
    }];
    if (this.agrupar !== 'dia' && d.categorias.length) {
      const columnas: ColumnaExport[] = [
        { titulo: 'Categoría', clave: 'nombre' }, { titulo: 'Tipo', clave: 'tipo' },
        ...d.filas.map((f) => ({ titulo: this.etiqueta(f.periodo), clave: f.periodo, tipo: 'dinero' as const })),
        { titulo: 'Total', clave: 'total', tipo: 'dinero' }
      ];
      tablas.push({ titulo: 'Detalle por categoría', subtitulo, columnas, filas: d.categorias.map((c) => ({ ...c.periodos, nombre: c.nombre, tipo: c.tipo, total: c.total })) });
    }
    return tablas;
  };
}
