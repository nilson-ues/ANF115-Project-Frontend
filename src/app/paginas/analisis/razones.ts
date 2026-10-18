import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { razonVisible } from '../../core/features';
import { CALCULO_RAZONES, ComponentesRazones, interpretarRazon, TEMA_CATEGORIA } from '../../core/temas';
import { PeriodoService } from '../../core/periodo.service';
import { RazonPipe } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { SelectorPeriodo } from '../../shared/periodo';

interface Razon {
  clave: string;
  nombre: string;
  categoria: string;
  decision: string;
  unidad: string;
  mayorEsMejor: boolean | null;
  formula: string;
  definicion: string;
  interpretacion: string;
  fuente: string;
  valor: number | null;
  anterior: number | null;
  presupuesto: number | null;
  estandar: number | null;
  semaforoAnterior: string;
  semaforoPresupuesto: string;
  semaforoEstandar: string;
}

interface RespuestaRazones {
  anio: number;
  hastaMes: number;
  base: string;
  plazoCredito: number | null;
  componentes: ComponentesRazones;
  razones: Razon[];
}

const CATEGORIAS = ['Liquidez', 'Capital de trabajo', 'Actividad', 'Endeudamiento', 'Rentabilidad', 'Mercado'];

@Component({
  selector: 'df-razones',
  imports: [SelectorPeriodo, MatProgressBarModule, MatTooltipModule, MatButtonToggleModule, FormsModule, RazonPipe],
  templateUrl: './razones.html',
  styleUrl: './razones.scss'
})
export class Razones {
  private api = inject(ApiService);
  private periodo = inject(PeriodoService);
  anio = this.periodo.anio;
  mes = this.periodo.mes;
  datos = signal<RespuestaRazones | null>(null);
  error = signal<string | null>(null);
  cargando = signal(false);
  seleccion = signal<Razon | null>(null);
  vista = signal<'categoria' | 'decision'>('categoria');

  grupos = computed(() => {
    const r = (this.datos()?.razones ?? []).filter((x) => razonVisible(x.clave));
    if (this.vista() === 'decision') {
      return ['Administración de bienes', 'Financiamiento', 'Inversión'].map((d) => ({ nombre: `Decisión de ${d.toLowerCase()}`, razones: r.filter((x) => x.decision === d) }));
    }
    return CATEGORIAS.map((c) => ({ nombre: c, razones: r.filter((x) => x.categoria === c) })).filter((g) => g.razones.length);
  });

  constructor() {
    effect(() => {
      const anio = this.anio();
      const mes = this.mes();
      if (anio !== null) this.cargar(anio, mes);
    });
  }

  async cargar(anio: number, mes: number | null) {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const d = await this.api.get<RespuestaRazones>('/analisis/razones', { anio, mes });
      this.datos.set(d);
      const sel = this.seleccion();
      const visibles = d.razones.filter((r) => razonVisible(r.clave));
      this.seleccion.set(visibles.find((r) => r.clave === sel?.clave) ?? visibles[0]);
    } catch (e) {
      this.datos.set(null);
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  temaDe = (categoria: string) => TEMA_CATEGORIA[categoria] ?? 'Unidad II';
  calculo = computed(() => {
    const r = this.seleccion();
    const d = this.datos();
    return r && d && CALCULO_RAZONES[r.clave] ? CALCULO_RAZONES[r.clave](d.componentes, r.valor) : [];
  });
  interpretacion = computed(() => {
    const r = this.seleccion();
    return r ? interpretarRazon(r, this.datos()?.plazoCredito ?? null) : [];
  });

  textoSemaforo(s: string) {
    return { verde: 'Favorable', amarillo: 'Dentro de tolerancia', rojo: 'Desfavorable', gris: 'Sin referencia' }[s] ?? s;
  }

  direccion(r: Razon) {
    return r.mayorEsMejor === null ? 'Se interpreta contra el plazo del proveedor' : r.mayorEsMejor ? 'Mientras más alto, mejor' : 'Mientras más bajo, mejor';
  }
}
