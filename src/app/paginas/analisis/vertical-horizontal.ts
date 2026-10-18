import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/api.service';
import { DineroPipe, esNegativo, MESES_LARGOS, MesPipe, PctPipe } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { PeriodoService } from '../../core/periodo.service';
import { DatosHorizontal, DatosVertical, TEMA_HORIZONTAL, TEMA_VERTICAL } from '../../core/temas';
import { SelectorPeriodo } from '../../shared/periodo';
import { QueSignifica } from '../../shared/que-significa';

interface Periodo { anio: number; escenario: string; ultimo_mes: number }

@Component({
  selector: 'df-vertical-horizontal',
  imports: [FormsModule, NgTemplateOutlet, MatTabsModule, MatProgressBarModule, MatButtonToggleModule, MatFormFieldModule, MatSelectModule,
    SelectorPeriodo, QueSignifica, DineroPipe, PctPipe, MesPipe],
  templateUrl: './vertical-horizontal.html',
  styleUrl: './vertical-horizontal.scss'
})
export class VerticalHorizontal {
  private api = inject(ApiService);
  private periodo = inject(PeriodoService);
  anio = this.periodo.anio;
  escenario = this.periodo.escenario;
  mes = this.periodo.mes;
  pestana = signal(0);
  vertical = signal<DatosVertical | null>(null);
  horizontal = signal<DatosHorizontal | null>(null);
  error = signal<string | null>(null);
  cargando = signal(false);
  periodos = signal<Periodo[]>([]);
  tipo = signal<'acumulado' | 'mes'>('acumulado');
  actualAnio = signal<number | null>(null);
  actualMes = signal<number | null>(null);
  baseAnio = signal<number | null>(null);
  baseMes = signal<number | null>(null);
  temaVertical = TEMA_VERTICAL;
  temaHorizontal = TEMA_HORIZONTAL;
  mesesLargos = MESES_LARGOS;
  neg = esNegativo;

  aniosReales = computed(() => this.periodos().filter((p) => p.escenario === 'REAL').map((p) => p.anio).sort((a, b) => b - a));
  mesesDe = (anio: number | null) => {
    const p = this.periodos().find((x) => x.escenario === 'REAL' && x.anio === anio);
    return p ? Array.from({ length: p.ultimo_mes }, (_, i) => i + 1) : [];
  };

  constructor() {
    this.api.get<Periodo[]>('/estados/periodos').then((p) => {
      this.periodos.set(p);
      const anios = this.aniosReales();
      this.actualAnio.set(anios[0] ?? null);
      this.baseAnio.set(anios[1] ?? anios[0] ?? null);
    });
    effect(() => {
      const anio = this.anio();
      if (anio !== null) this.cargarVertical(anio, this.escenario(), this.mes());
    });
    effect(() => {
      const anio = this.actualAnio();
      const base = this.baseAnio();
      if (anio !== null && base !== null) this.cargarHorizontal(anio, this.actualMes(), base, this.baseMes(), this.tipo());
    });
  }

  private async cargarVertical(anio: number, escenario: string, mes: number | null) {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.vertical.set(await this.api.get<DatosVertical>('/analisis/vertical', { anio, escenario, mes }));
    } catch (e) {
      this.vertical.set(null);
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargarHorizontal(anio: number, mes: number | null, baseAnio: number, baseMes: number | null, tipo: string) {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.horizontal.set(await this.api.get<DatosHorizontal>('/analisis/horizontal', { anio, mes, base_anio: baseAnio, base_mes: baseMes, tipo }));
    } catch (e) {
      this.horizontal.set(null);
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  cambiarTipo(tipo: 'acumulado' | 'mes') {
    // En comparación mensual se necesita un mes concreto en ambos períodos
    if (tipo === 'mes') {
      this.actualMes.set(this.actualMes() ?? this.mesesDe(this.actualAnio()).at(-1) ?? 12);
      this.baseMes.set(this.baseMes() ?? this.mesesDe(this.baseAnio()).at(-1) ?? 12);
    }
    this.tipo.set(tipo);
  }

  descripcion(p: { anio: number; mes: number }, tipo: string) {
    const mes = MESES_LARGOS[p.mes - 1];
    return tipo === 'mes' ? `${mes} ${p.anio}` : p.mes === 12 ? `Año ${p.anio}` : `Enero a ${mes.toLowerCase()} ${p.anio}`;
  }

  ancho(v: number | null) {
    return v === null ? 0 : Math.min(Math.abs(v) * 100, 100);
  }
}
