import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ApiService } from '../../core/api.service';
import { TablaExport } from '../../core/exportar';
import { DineroPipe, formatoDinero, MESES, MESES_LARGOS } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { TEORIA_CAJA } from '../../core/teoria-modulos';
import { Exportar } from '../../shared/exportar';
import { TeoriaPanel } from '../../shared/teoria';

interface MesCaja {
  mes: number; ventas: string; cobros: string; costo: string; gastosVenta: string; gastosAdministracion: string;
  gastosFinancieros: string; impuestos: string; totalSalidas: string; flujoNeto: string; saldoInicial: string; saldoFinal: string;
  financiamiento: string; excedente: string;
}
interface Metodo {
  metodo: 'promedio' | 'ratio'; nombre: string; crecimientoAnual: number | null;
  resumen: { ventas: string; cobros: string; salidas: string; flujoNeto: string; saldoFinal: string; saldoMinimoAlcanzado: string; mesesDeficit: number; mesesFinanciamiento: number; financiamientoMaximo: string };
  meses: MesCaja[];
}
interface Resultado { totalBase: string; promedioBase: string; ratioCalculado: number; ratioUsado: number; metodos: Metodo[] }

// Datos de la Guía práctica 1 (ventas 2023)
const GUIA_1 = {
  ventas: [98540.5, 125570.5, 60785.6, 30266, 75288, 40089.8, 95710, 78450.25, 277539.07, 213568.07, 299508, 145876],
  saldoInicial: 90723.36, costoPct: 42, gastosVentaPct: 38, gastosAdministracionPct: 7.5, gastosFinancierosMes: 6600, impuestosMes: 11973,
  contadoPct: 100, cobroMes1Pct: 0, cobroMes2Pct: 0, saldoMinimo: 0
};

const FILAS: { clave: keyof MesCaja; nombre: string; tipo?: string }[] = [
  { clave: 'saldoInicial', nombre: 'Saldo inicial de efectivo', tipo: 'subtotal' },
  { clave: 'ventas', nombre: 'Ventas proyectadas', tipo: 'sub' },
  { clave: 'cobros', nombre: '(+) Entradas: cobros' },
  { clave: 'costo', nombre: 'Costo de ventas', tipo: 'sub' },
  { clave: 'gastosVenta', nombre: 'Gastos de venta', tipo: 'sub' },
  { clave: 'gastosAdministracion', nombre: 'Gastos de administración', tipo: 'sub' },
  { clave: 'gastosFinancieros', nombre: 'Gastos financieros', tipo: 'sub' },
  { clave: 'impuestos', nombre: 'Impuestos', tipo: 'sub' },
  { clave: 'totalSalidas', nombre: '(−) Total de salidas' },
  { clave: 'flujoNeto', nombre: 'Flujo neto del mes', tipo: 'subtotal' },
  { clave: 'saldoFinal', nombre: 'Saldo final de efectivo', tipo: 'total' },
  { clave: 'financiamiento', nombre: 'Financiamiento requerido', tipo: 'sub' },
  { clave: 'excedente', nombre: 'Excedente de efectivo', tipo: 'sub' }
];

@Component({
  selector: 'df-caja',
  imports: [FormsModule, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule, MatProgressBarModule, BaseChartDirective, DineroPipe, Exportar, TeoriaPanel],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Presupuesto de caja</h1>
          <div class="sub">Pronóstico de ventas por el método promedio y por el método de ratio de incremento · Flujo de efectivo proyectado</div>
        </div>
        <div class="acciones">
          @if (resultado()) { <df-exportar [tablas]="exportar" archivo="presupuesto-caja" /> }
          <df-teoria [temas]="teoria" fuente="Unidad III · Guía práctica 1" />
        </div>
      </div>

      <div class="tarjeta">
        <div class="cabecera">
          <h2>Datos de entrada</h2>
          <span class="cargar">
            Cargar:
            <button mat-stroked-button (click)="cargarGuia()">Guía práctica 1 (ventas 2023)</button>
            <button mat-stroked-button (click)="cargarTesis(2009)">Tesis: ventas netas 2009</button>
          </span>
        </div>
        <div class="ventas">
          @for (m of meses; track m; let i = $index) {
            <mat-form-field appearance="outline"><mat-label>{{ largos[i] }}</mat-label><input matInput type="number" step="0.01" [(ngModel)]="ventas[i]" /></mat-form-field>
          }
        </div>
        <div class="supuestos">
          <mat-form-field appearance="outline"><mat-label>Saldo inicial de enero</mat-label><input matInput type="number" [(ngModel)]="s.saldoInicial" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Costo (% de ventas)</mat-label><input matInput type="number" [(ngModel)]="s.costoPct" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Gasto de ventas (%)</mat-label><input matInput type="number" [(ngModel)]="s.gastosVentaPct" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Gasto de administración (%)</mat-label><input matInput type="number" [(ngModel)]="s.gastosAdministracionPct" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Gastos financieros mensuales</mat-label><input matInput type="number" [(ngModel)]="s.gastosFinancierosMes" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Impuestos mensuales</mat-label><input matInput type="number" [(ngModel)]="s.impuestosMes" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Ventas al contado (%)</mat-label><input matInput type="number" [(ngModel)]="s.contadoPct" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Cobro al mes siguiente (%)</mat-label><input matInput type="number" [(ngModel)]="s.cobroMes1Pct" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Cobro a los dos meses (%)</mat-label><input matInput type="number" [(ngModel)]="s.cobroMes2Pct" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Saldo mínimo de efectivo</mat-label><input matInput type="number" [(ngModel)]="s.saldoMinimo" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Ratio de incremento (%) · vacío = calculado</mat-label><input matInput type="number" [(ngModel)]="ratioManual" /></mat-form-field>
          <button mat-flat-button (click)="calcular()"><span class="material-symbols-outlined">calculate</span> Calcular</button>
        </div>
      </div>

      @if (cargando()) { <mat-progress-bar mode="indeterminate" /> }

      @if (resultado(); as r) {
        <div class="aviso ok seccion">
          Ventas del año base: {{ r.totalBase | dinero: true }} · promedio mensual {{ r.promedioBase | dinero: true }} ·
          ratio de incremento calculado {{ (r.ratioCalculado * 100).toFixed(2) }}% (usado: {{ (r.ratioUsado * 100).toFixed(2) }}%)
        </div>
        <div class="dos-columnas">
          @for (m of r.metodos; track m.metodo) {
            <div class="tarjeta metodo" [class.elegido]="vista() === m.metodo" (click)="vista.set(m.metodo)">
              <h2>{{ m.nombre }}</h2>
              <table class="estado">
                <tbody>
                  <tr><td>Ventas proyectadas</td><td class="num">{{ m.resumen.ventas | dinero: true }}</td></tr>
                  <tr><td>Crecimiento frente al año base</td><td class="num">{{ ((m.crecimientoAnual ?? 0) * 100).toFixed(2) }}%</td></tr>
                  <tr><td>Flujo neto del año</td><td class="num" [class.negativo]="+m.resumen.flujoNeto < 0">{{ m.resumen.flujoNeto | dinero: true }}</td></tr>
                  <tr><td>Saldo final de diciembre</td><td class="num" [class.negativo]="+m.resumen.saldoFinal < 0">{{ m.resumen.saldoFinal | dinero: true }}</td></tr>
                  <tr><td>Saldo más bajo del año</td><td class="num" [class.negativo]="+m.resumen.saldoMinimoAlcanzado < 0">{{ m.resumen.saldoMinimoAlcanzado | dinero: true }}</td></tr>
                  <tr><td>Meses con saldo negativo</td><td class="num">{{ m.resumen.mesesDeficit }}</td></tr>
                  <tr><td>Financiamiento máximo requerido</td><td class="num">{{ m.resumen.financiamientoMaximo | dinero: true }}</td></tr>
                </tbody>
              </table>
            </div>
          }
        </div>
        <div class="aviso seccion">{{ analisis() }}</div>

        <div class="tarjeta seccion"><h2>Saldo final de efectivo por mes</h2><div class="lienzo"><canvas baseChart type="line" [data]="grafico()" [options]="opciones"></canvas></div></div>

        <div class="cabecera seccion">
          <h2>Flujo de efectivo proyectado</h2>
          <mat-button-toggle-group [ngModel]="vista()" (ngModelChange)="vista.set($event)" hideSingleSelectionIndicator>
            <mat-button-toggle value="promedio">Método promedio</mat-button-toggle>
            <mat-button-toggle value="ratio">Ratio de incremento</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
        <div class="tabla-scroll">
          <table class="estado">
            <thead><tr><th>Concepto</th>@for (m of meses; track m) { <th>{{ cortos[m - 1] }}</th> }<th class="col-total">Total</th></tr></thead>
            <tbody>
              @for (f of filas; track f.clave) {
                <tr [class]="f.tipo ?? ''">
                  <td>{{ f.nombre }}</td>
                  @for (mm of metodoVista()?.meses ?? []; track mm.mes) { <td class="num" [class.negativo]="+mm[f.clave] < 0">{{ mm[f.clave] | dinero }}</td> }
                  <td class="num col-total">{{ total(f.clave) | dinero }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: `
    .cabecera { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; h2 { margin: 0; } }
    .cargar { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--df-muted); }
    .ventas { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0 10px; margin-top: 14px; }
    .supuestos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0 10px; align-items: center; }
    .metodo { cursor: pointer; } .metodo.elegido { border-color: var(--df-accent); box-shadow: 0 0 0 1px var(--df-accent); }
    table.estado td:first-child { min-width: 220px; }
    @media (max-width: 1100px) { .ventas { grid-template-columns: repeat(3, 1fr); } .supuestos { grid-template-columns: repeat(2, 1fr); } }
  `
})
export class PresupuestoCaja {
  private api = inject(ApiService);
  private aviso = inject(MatSnackBar);
  teoria = TEORIA_CAJA;
  meses = Array.from({ length: 12 }, (_, i) => i + 1);
  largos = MESES_LARGOS;
  cortos = MESES;
  filas = FILAS;
  ventas: (number | null)[] = [...GUIA_1.ventas];
  s = { ...GUIA_1 };
  ratioManual: number | null = null;
  resultado = signal<Resultado | null>(null);
  cargando = signal(false);
  vista = signal<'promedio' | 'ratio'>('promedio');
  metodoVista = computed(() => this.resultado()?.metodos.find((m) => m.metodo === this.vista()) ?? null);

  grafico = computed<ChartConfiguration<'line'>['data']>(() => {
    const r = this.resultado();
    if (!r) return { datasets: [] };
    const colores = { promedio: '#0f766e', ratio: '#b45309' };
    return {
      labels: MESES,
      datasets: r.metodos.map((m) => ({ label: m.nombre, data: m.meses.map((x) => Number(x.saldoFinal)), borderColor: colores[m.metodo], backgroundColor: colores[m.metodo], tension: 0.2 }))
    };
  });

  opciones: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatoDinero(c.raw as number, true)}` } } },
    scales: { y: { ticks: { callback: (v) => formatoDinero(Number(v), true) } } }
  };

  analisis = computed(() => {
    const r = this.resultado();
    if (!r) return '';
    const [p, q] = r.metodos;
    const crec = (q.crecimientoAnual ?? 0) * 100;
    const base = `El método de ratio supone un crecimiento de ${crec.toFixed(1)} % sobre el año base, mientras el método promedio no supone crecimiento.`;
    if (crec > 25) return `${base} Ese crecimiento es muy alto para justificarlo ante el banco, por lo que la proyección más prudente es la del método promedio (saldo final ${formatoDinero(p.resumen.saldoFinal, true)}, ${p.resumen.mesesDeficit} meses con déficit).`;
    return `${base} El crecimiento es moderado; el método de ratio conserva la estacionalidad y muestra mejor los meses de mayor necesidad de efectivo (${q.resumen.mesesDeficit} meses con déficit frente a ${p.resumen.mesesDeficit} del promedio).`;
  });

  constructor() {
    this.calcular();
  }

  cargarGuia() {
    this.ventas = [...GUIA_1.ventas];
    this.s = { ...GUIA_1 };
    this.ratioManual = null;
    this.calcular();
  }

  async cargarTesis(anio: number) {
    try {
      const b = await this.api.get<{ ventas: string[]; saldoInicial: string | null; costoPct: number; gastosVentaPct: number; gastosAdministracionPct: number; gastosFinancierosMes: string; impuestosMes: string }>(`/planeacion/caja/base/${anio}`);
      this.ventas = b.ventas.map(Number);
      this.s = {
        ...this.s,
        saldoInicial: Number(b.saldoInicial ?? 0),
        costoPct: +(b.costoPct * 100).toFixed(2), gastosVentaPct: +(b.gastosVentaPct * 100).toFixed(2),
        gastosAdministracionPct: +(b.gastosAdministracionPct * 100).toFixed(2),
        gastosFinancierosMes: +Number(b.gastosFinancierosMes).toFixed(2), impuestosMes: +Number(b.impuestosMes).toFixed(2),
        contadoPct: 60, cobroMes1Pct: 40, cobroMes2Pct: 0
      };
      this.ratioManual = null;
      this.aviso.open(`Cargadas las ventas netas ${anio}; costos y gastos como % históricos. Contado 60 % según los supuestos de la tesis.`, 'OK', { duration: 5000 });
      this.calcular();
    } catch (e) {
      this.aviso.open(mensajeError(e), 'Cerrar', { duration: 6000 });
    }
  }

  async calcular() {
    this.cargando.set(true);
    try {
      const pct = (v: number) => Number(v) / 100;
      this.resultado.set(await this.api.post<Resultado>('/planeacion/caja', {
        ventasBase: this.ventas.map((v) => Number(v ?? 0)),
        ratio: this.ratioManual === null || (this.ratioManual as unknown) === '' ? null : pct(this.ratioManual),
        saldoInicial: Number(this.s.saldoInicial), costoPct: pct(this.s.costoPct), gastosVentaPct: pct(this.s.gastosVentaPct),
        gastosAdministracionPct: pct(this.s.gastosAdministracionPct), gastosFinancierosMes: Number(this.s.gastosFinancierosMes),
        impuestosMes: Number(this.s.impuestosMes), contadoPct: pct(this.s.contadoPct), cobroMes1Pct: pct(this.s.cobroMes1Pct),
        cobroMes2Pct: pct(this.s.cobroMes2Pct), saldoMinimo: Number(this.s.saldoMinimo)
      }));
    } catch (e) {
      this.aviso.open(mensajeError(e), 'Cerrar', { duration: 6000 });
    } finally {
      this.cargando.set(false);
    }
  }

  total(clave: keyof MesCaja) {
    const m = this.metodoVista()?.meses ?? [];
    if (!m.length) return null;
    if (clave === 'saldoInicial') return m[0].saldoInicial;
    if (clave === 'saldoFinal') return m[m.length - 1].saldoFinal;
    if (clave === 'financiamiento' || clave === 'excedente') return null;
    return m.reduce((s, x) => s + Number(x[clave]), 0);
  }

  exportar = (): TablaExport[] => (this.resultado()?.metodos ?? []).map((m) => ({
    titulo: `Presupuesto de caja · ${m.nombre}`,
    subtitulo: `Ventas proyectadas ${formatoDinero(m.resumen.ventas, true)} · Saldo final ${formatoDinero(m.resumen.saldoFinal, true)}`,
    columnas: [{ titulo: 'Concepto', clave: 'nombre' }, ...MESES.map((n, i) => ({ titulo: n, clave: `m${i + 1}`, tipo: 'dinero' as const }))],
    filas: FILAS.map((f) => ({ nombre: f.nombre, ...Object.fromEntries(m.meses.map((x) => [`m${x.mes}`, x[f.clave]])) })),
    resaltadas: FILAS.map((f, i) => (f.tipo === 'subtotal' || f.tipo === 'total' ? i : -1)).filter((i) => i >= 0)
  }));
}
