import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ApiService } from '../../core/api.service';
import { TablaExport } from '../../core/exportar';
import { DineroPipe, formatoDinero } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { TEORIA_PROYECTOS } from '../../core/teoria-modulos';
import { Exportar } from '../../shared/exportar';
import { TeoriaPanel } from '../../shared/teoria';

interface Evaluacion {
  periodoRecuperacion: number | null; aceptaPR: boolean | null; vpn: string; aceptaVPN: boolean | null; tir: number | null; aceptaTIR: boolean | null;
  eva: { porAnio: string[]; valorPresente: string; perpetuidad: string | null };
  detalle: { periodo: number; flujo: string; acumulado: string; valorPresente: string }[];
  valorPresenteEntradas: string;
}
interface Proyecto {
  id?: number; nombre: string; descripcion: string | null; inversion_inicial: number; flujos: number[];
  costo_capital: number; periodo_maximo: number | null; evaluacion?: Evaluacion;
}

@Component({
  selector: 'df-proyectos',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressBarModule, BaseChartDirective, DineroPipe, Exportar, TeoriaPanel],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Evaluación de proyectos de inversión</h1>
          <div class="sub">Presupuesto de capital: periodo de recuperación, VPN, TIR y EVA · Clasificación por VPN</div>
        </div>
        <div class="acciones">
          <df-exportar [tablas]="exportar" archivo="evaluacion-proyectos" />
          <df-teoria [temas]="teoria" fuente="Unidad III · videos 5 a 7" />
          <button mat-flat-button (click)="nuevo()"><span class="material-symbols-outlined">add</span> Nuevo proyecto</button>
        </div>
      </div>
      @if (cargando()) { <mat-progress-bar mode="indeterminate" /> }
      @if (error()) { <div class="aviso error">{{ error() }}</div> }

      <div class="tabla-scroll">
        <table class="estado">
          <thead><tr><th>Proyecto</th><th>Inversión</th><th>k</th><th>PR (períodos)</th><th>VPN</th><th>TIR</th><th>VP del EVA</th><th>Decisión</th><th></th></tr></thead>
          <tbody>
            @for (p of ordenados(); track p.id; let i = $index) {
              <tr [class.elegido]="seleccion()?.id === p.id" (click)="seleccion.set(p)">
                <td><span class="rango">{{ i + 1 }}</span> {{ p.nombre }}</td>
                <td class="num">{{ p.inversion_inicial | dinero: true }}</td>
                <td class="num">{{ (p.costo_capital * 100).toFixed(2) }}%</td>
                <td class="num"><span [class]="clase(p.evaluacion!.aceptaPR)">{{ p.evaluacion!.periodoRecuperacion?.toFixed(2) ?? 'No recupera' }}</span></td>
                <td class="num"><span [class]="clase(p.evaluacion!.aceptaVPN)">{{ p.evaluacion!.vpn | dinero: true }}</span></td>
                <td class="num"><span [class]="clase(p.evaluacion!.aceptaTIR)">{{ p.evaluacion!.tir === null ? '—' : (p.evaluacion!.tir * 100).toFixed(2) + '%' }}</span></td>
                <td class="num">{{ p.evaluacion!.eva.valorPresente | dinero: true }}</td>
                <td class="centro"><span class="chip" [class]="p.evaluacion!.aceptaVPN ? 'verde' : 'rojo'">{{ p.evaluacion!.aceptaVPN ? 'Aceptar' : 'Rechazar' }}</span></td>
                <td class="centro">
                  <button mat-icon-button (click)="editar(p); $event.stopPropagation()" aria-label="Editar"><span class="material-symbols-outlined">edit</span></button>
                  <button mat-icon-button (click)="eliminar(p); $event.stopPropagation()" aria-label="Eliminar"><span class="material-symbols-outlined">delete</span></button>
                </td>
              </tr>
            } @empty { <tr><td colspan="9" class="vacio">Registre un proyecto para evaluarlo</td></tr> }
          </tbody>
        </table>
      </div>
      <div class="conteo">Ordenados de mayor a menor VPN (enfoque de clasificación). Verde: cumple el criterio; rojo: no cumple.</div>

      @if (seleccion(); as p) {
        <div class="dos-columnas seccion">
          <div class="tarjeta">
            <h2>{{ p.nombre }}</h2>
            <p class="muted">{{ p.descripcion }}</p>
            <ul class="criterios">
              <li><b>Periodo de recuperación:</b> {{ p.evaluacion!.periodoRecuperacion?.toFixed(2) ?? 'no se recupera' }} períodos
                @if (p.periodo_maximo) { (máximo aceptable {{ p.periodo_maximo }}) → {{ p.evaluacion!.aceptaPR ? 'se acepta' : 'se rechaza' }} }</li>
              <li><b>VPN:</b> {{ p.evaluacion!.valorPresenteEntradas | dinero: true }} − {{ p.inversion_inicial | dinero: true }} = {{ p.evaluacion!.vpn | dinero: true }} → {{ p.evaluacion!.aceptaVPN ? 'VPN > 0, se acepta' : 'VPN ≤ 0, se rechaza' }}</li>
              <li><b>TIR:</b> {{ p.evaluacion!.tir === null ? 'no existe' : (p.evaluacion!.tir * 100).toFixed(2) + '%' }} frente a k = {{ (p.costo_capital * 100).toFixed(2) }}% → {{ p.evaluacion!.aceptaTIR ? 'TIR > k, se acepta' : 'se rechaza' }}</li>
              <li><b>EVA:</b> cargo anual por capital = {{ p.inversion_inicial * p.costo_capital | dinero: true }}; VP de los EVA = {{ p.evaluacion!.eva.valorPresente | dinero: true }}
                @if (p.evaluacion!.eva.perpetuidad) { · a perpetuidad = {{ p.evaluacion!.eva.perpetuidad | dinero: true }} }</li>
            </ul>
            <table class="estado">
              <thead><tr><th>Período</th><th>Flujo</th><th>Acumulado</th><th>Valor presente</th><th>EVA</th></tr></thead>
              <tbody>
                <tr><td>0 (inversión)</td><td class="num negativo">({{ p.inversion_inicial | dinero }})</td><td></td><td class="num negativo">({{ p.inversion_inicial | dinero }})</td><td></td></tr>
                @for (d of p.evaluacion!.detalle; track d.periodo; let i = $index) {
                  <tr><td>{{ d.periodo }}</td><td class="num">{{ d.flujo | dinero }}</td><td class="num">{{ d.acumulado | dinero }}</td><td class="num">{{ d.valorPresente | dinero }}</td><td class="num">{{ p.evaluacion!.eva.porAnio[i] | dinero }}</td></tr>
                }
              </tbody>
            </table>
          </div>
          <div class="tarjeta">
            <h2>Perfil del VPN según la tasa de descuento</h2>
            <div class="lienzo"><canvas baseChart type="line" [data]="perfil()" [options]="opciones"></canvas></div>
            <p class="muted">La TIR es la tasa donde la curva cruza el cero.</p>
          </div>
        </div>
      }
    </div>

    @if (edicion(); as e) {
      <div class="fondo" (click)="edicion.set(null)"></div>
      <div class="dialogo" role="dialog">
        <h2>{{ e.id ? 'Editar' : 'Nuevo' }} proyecto</h2>
        <form class="campos" (ngSubmit)="guardar()">
          <mat-form-field appearance="outline" class="completo"><mat-label>Nombre</mat-label><input matInput [(ngModel)]="e.nombre" name="nombre" required /></mat-form-field>
          <mat-form-field appearance="outline" class="completo"><mat-label>Descripción</mat-label><input matInput [(ngModel)]="e.descripcion" name="descripcion" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Inversión inicial (FE0)</mat-label><input matInput type="number" [(ngModel)]="e.inversion_inicial" name="inv" required /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Costo de capital k (%)</mat-label><input matInput type="number" [(ngModel)]="kPct" name="k" required /></mat-form-field>
          <mat-form-field appearance="outline" class="completo"><mat-label>Flujos por período separados por coma (negativo = inversión durante la operación)</mat-label>
            <input matInput [(ngModel)]="flujosTexto" name="flujos" required /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Periodo máximo de recuperación</mat-label><input matInput type="number" [(ngModel)]="e.periodo_maximo" name="max" /></mat-form-field>
          <div></div>
          <div class="botones">
            <button mat-button type="button" (click)="edicion.set(null)">Cancelar</button>
            <button mat-flat-button type="submit">Guardar y evaluar</button>
          </div>
        </form>
      </div>
    }
  `,
  styles: `
    tr.elegido td { background: var(--df-accent-soft) !important; } tbody tr { cursor: pointer; }
    .rango { display: inline-block; width: 22px; color: var(--df-muted); font-variant-numeric: tabular-nums; }
    .si { color: var(--df-verde); font-weight: 600; } .no { color: var(--df-rojo); font-weight: 600; }
    .muted { color: var(--df-muted); font-size: 13px; }
    .criterios { padding-left: 18px; display: grid; gap: 6px; font-size: 13px; line-height: 1.5; }
    table.estado td:first-child { min-width: 120px; }
  `
})
export class EvaluacionProyectos {
  private api = inject(ApiService);
  private aviso = inject(MatSnackBar);
  teoria = TEORIA_PROYECTOS;
  proyectos = signal<Proyecto[]>([]);
  ranking = signal<number[]>([]);
  seleccion = signal<Proyecto | null>(null);
  edicion = signal<Proyecto | null>(null);
  cargando = signal(false);
  error = signal<string | null>(null);
  kPct = 10;
  flujosTexto = '';

  ordenados = computed(() => this.ranking().map((id) => this.proyectos().find((p) => p.id === id)!).filter(Boolean));

  perfil = computed<ChartConfiguration<'line'>['data']>(() => {
    const p = this.seleccion();
    if (!p) return { datasets: [] };
    const tasas = Array.from({ length: 21 }, (_, i) => i * Math.max(0.05, Math.min(1, (p.evaluacion?.tir ?? 0.3) * 2)) / 20);
    const vpn = (k: number) => p.flujos.reduce((s, f, t) => s + f / Math.pow(1 + k, t + 1), 0) - p.inversion_inicial;
    return {
      labels: tasas.map((t) => `${(t * 100).toFixed(1)}%`),
      datasets: [{ label: 'VPN', data: tasas.map(vpn), borderColor: '#0f766e', backgroundColor: '#0f766e', tension: 0.3 }]
    };
  });

  opciones: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `VPN: ${formatoDinero(c.raw as number, true)}` } } },
    scales: { x: { title: { display: true, text: 'Tasa de descuento' } }, y: { ticks: { callback: (v) => formatoDinero(Number(v), true) } } }
  };

  constructor() {
    this.cargar();
  }

  clase(acepta: boolean | null) {
    return acepta === null ? '' : acepta ? 'si' : 'no';
  }

  async cargar() {
    this.cargando.set(true);
    try {
      const r = await this.api.get<{ proyectos: Proyecto[]; ranking: number[] }>('/planeacion/proyectos');
      this.proyectos.set(r.proyectos);
      this.ranking.set(r.ranking);
      const actual = this.seleccion()?.id;
      this.seleccion.set(r.proyectos.find((p) => p.id === actual) ?? r.proyectos.find((p) => p.id === r.ranking[0]) ?? null);
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  nuevo() {
    this.kPct = 10;
    this.flujosTexto = '';
    this.edicion.set({ nombre: '', descripcion: '', inversion_inicial: 0, flujos: [], costo_capital: 0.1, periodo_maximo: null });
  }

  editar(p: Proyecto) {
    this.kPct = +(p.costo_capital * 100).toFixed(4);
    this.flujosTexto = p.flujos.join(', ');
    this.edicion.set({ ...p });
  }

  async guardar() {
    const e = this.edicion()!;
    const flujos = this.flujosTexto.split(/[,;\s]+/).filter(Boolean).map(Number);
    if (!flujos.length || flujos.some((f) => Number.isNaN(f))) {
      this.aviso.open('Escriba los flujos como números separados por coma', 'Cerrar', { duration: 4000 });
      return;
    }
    const cuerpo = { nombre: e.nombre, descripcion: e.descripcion, inversion_inicial: Number(e.inversion_inicial), flujos, costo_capital: Number(this.kPct) / 100, periodo_maximo: e.periodo_maximo || null };
    try {
      const guardado = e.id ? await this.api.put<Proyecto>(`/planeacion/proyectos/${e.id}`, cuerpo) : await this.api.post<Proyecto>('/planeacion/proyectos', cuerpo);
      this.edicion.set(null);
      this.seleccion.set(guardado);
      this.cargar();
    } catch (err) {
      this.aviso.open(mensajeError(err), 'Cerrar', { duration: 6000 });
    }
  }

  async eliminar(p: Proyecto) {
    try {
      await this.api.delete(`/planeacion/proyectos/${p.id}`);
      if (this.seleccion()?.id === p.id) this.seleccion.set(null);
      this.cargar();
    } catch (err) {
      this.aviso.open(mensajeError(err), 'Cerrar', { duration: 6000 });
    }
  }

  exportar = (): TablaExport[] => [{
    titulo: 'Evaluación de proyectos de inversión',
    subtitulo: 'Ordenados por VPN (enfoque de clasificación)',
    columnas: [
      { titulo: 'Proyecto', clave: 'nombre' }, { titulo: 'Inversión', clave: 'inversion', tipo: 'dinero' }, { titulo: 'k', clave: 'k', tipo: 'pct' },
      { titulo: 'PR', clave: 'pr', tipo: 'numero' }, { titulo: 'VPN', clave: 'vpn', tipo: 'dinero' }, { titulo: 'TIR', clave: 'tir', tipo: 'pct' },
      { titulo: 'VP EVA', clave: 'eva', tipo: 'dinero' }, { titulo: 'Decisión', clave: 'decision' }
    ],
    filas: this.ordenados().map((p) => ({
      nombre: p.nombre, inversion: p.inversion_inicial, k: p.costo_capital, pr: p.evaluacion!.periodoRecuperacion, vpn: p.evaluacion!.vpn,
      tir: p.evaluacion!.tir, eva: p.evaluacion!.eva.valorPresente, decision: p.evaluacion!.aceptaVPN ? 'Aceptar' : 'Rechazar'
    }))
  }];
}
