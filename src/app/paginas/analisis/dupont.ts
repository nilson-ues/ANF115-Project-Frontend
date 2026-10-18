import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';
import { razonVisible } from '../../core/features';
import { MESES_LARGOS, PctPipe, RazonPipe } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { PeriodoService } from '../../core/periodo.service';
import { COMPONENTES_DUPONT, DatosDupont, DatosSumario, TEMA_DUPONT, TEMA_SUMARIO } from '../../core/temas';
import { QueSignifica } from '../../shared/que-significa';

interface Periodo { anio: number; escenario: string; ultimo_mes: number }

@Component({
  selector: 'df-dupont',
  imports: [FormsModule, MatTabsModule, MatProgressBarModule, MatFormFieldModule, MatSelectModule, MatTooltipModule, QueSignifica, PctPipe, RazonPipe],
  templateUrl: './dupont.html',
  styleUrl: './dupont.scss'
})
export class DupontSumario {
  private api = inject(ApiService);
  private periodo = inject(PeriodoService);
  anio = this.periodo.anio;
  mes = this.periodo.mes;
  baseAnio = signal<number | null>(null);
  pestana = signal(0);
  periodos = signal<Periodo[]>([]);
  dupont = signal<DatosDupont | null>(null);
  sumario = signal<DatosSumario | null>(null);
  error = signal<string | null>(null);
  cargando = signal(false);
  temaDupont = TEMA_DUPONT;
  temaSumario = TEMA_SUMARIO;
  componentes = COMPONENTES_DUPONT;
  meses = MESES_LARGOS;

  anios = computed(() => this.periodos().filter((p) => p.escenario === 'REAL').map((p) => p.anio).sort((a, b) => b - a));
  mayorCambio = computed(() => {
    const c = this.dupont()?.cambios;
    if (!c) return null;
    return [...COMPONENTES_DUPONT].sort((a, b) => Math.abs(c[b.clave] ?? 0) - Math.abs(c[a.clave] ?? 0))[0].clave;
  });
  sumarioVisible = computed(() => {
    const s = this.sumario();
    return s ? { ...s, razones: s.razones.filter((r) => razonVisible(r.clave)) } : null;
  });
  categorias = computed(() => {
    const r = this.sumarioVisible()?.razones ?? [];
    return [...new Set(r.map((x) => x.categoria))].map((c) => ({ nombre: c, razones: r.filter((x) => x.categoria === c) }));
  });

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
      if (anio !== null && base !== null) this.cargarDupont(anio, this.mes(), base);
    });
    effect(() => {
      this.cargarSumario(this.mes());
    });
  }

  private async cargarDupont(anio: number, mes: number | null, baseAnio: number) {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.dupont.set(await this.api.get<DatosDupont>('/analisis/dupont', { anio, mes, base_anio: baseAnio }));
    } catch (e) {
      this.dupont.set(null);
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargarSumario(mes: number | null) {
    try {
      this.sumario.set(await this.api.get<DatosSumario>('/analisis/sumario', { mes }));
    } catch (e) {
      this.error.set(mensajeError(e));
    }
  }

  flecha(t: string) {
    return { mejora: 'trending_up', empeora: 'trending_down', igual: 'trending_flat', neutral: 'remove', sin_dato: 'remove' }[t] ?? 'remove';
  }

  textoTendencia(t: string) {
    return { mejora: 'Mejora', empeora: 'Empeora', igual: 'Sin cambio', neutral: 'Se interpreta contra el plazo del proveedor', sin_dato: 'Sin período anterior' }[t] ?? t;
  }
}
