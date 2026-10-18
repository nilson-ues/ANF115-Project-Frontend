import { Component, computed } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DineroPipe, MesPipe } from '../../core/formato';
import { SelectorPeriodo } from '../../shared/periodo';
import { FilaMensual, TablaMensual } from '../../shared/tabla-mensual';
import { Teoria, TeoriaPanel } from '../../shared/teoria';
import { PaginaPeriodo } from './base';

interface Balance {
  meses: number[];
  filas: (FilaMensual & { codigo: string; nivel: number })[];
  totales: Record<'activo' | 'pasivo' | 'patrimonio' | 'pasivoMasPatrimonio' | 'diferencia', string[]>;
  teoria: Teoria;
}

@Component({
  selector: 'df-balance',
  imports: [SelectorPeriodo, TablaMensual, TeoriaPanel, MatProgressBarModule, DineroPipe],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Balance general</h1>
          <div class="sub">Estado de situación financiera al cierre de cada mes</div>
        </div>
        <div class="acciones">
          <df-periodo [(anio)]="anio" [(escenario)]="escenario" [(mes)]="mes" />
          @if (datos(); as d) { <df-teoria [temas]="[d.teoria, vertical]" fuente="Unidad I · Unidad II" /> }
        </div>
      </div>
      @if (cargando()) { <mat-progress-bar mode="indeterminate" /> }
      @if (error()) { <div class="aviso error">{{ error() }}</div> }
      @if (datos(); as d) {
        @if (descuadres().length) {
          <div class="aviso error">La ecuación contable no cuadra en: {{ descuadres().join(', ') }}</div>
        } @else {
          <div class="aviso ok">Activo = Pasivo + Patrimonio en todos los meses · Al cierre: {{ d.totales.activo[d.totales.activo.length - 1] | dinero: true }}</div>
        }
        <df-tabla-mensual [filas]="filas()" [meses]="d.meses" [conTotal]="false" [conPorcentaje]="true" tituloPorcentaje="% Vertical" concepto="Cuenta" />
      }
    </div>
  `
})
export class BalanceGeneral extends PaginaPeriodo<Balance> {
  ruta = '/estados/balance';
  vertical: Teoria = {
    titulo: 'Análisis vertical del balance',
    formula: 'Cuenta / Activo total × 100   ·   Cuenta de pasivo o patrimonio / (Pasivo + Patrimonio) × 100',
    texto: 'Muestra el peso de cada cuenta dentro del total al cierre del último mes. Ayuda a ver, por ejemplo, cuánto del activo está en inventarios o cuánto se financia con deuda.',
    fuente: 'Unidad II - Herramientas de análisis financiero'
  };
  filas = computed(() => {
    const d = this.datos();
    if (!d) return [];
    const total = (nombre: string, valores: string[]): FilaMensual => ({ nombre, valores, tipo: 'total' });
    const activo = d.filas.filter((f) => f.codigo.startsWith('1'));
    const resto = d.filas.filter((f) => !f.codigo.startsWith('1'));
    return [...activo, total('TOTAL ACTIVO', d.totales.activo), ...resto, total('TOTAL PASIVO Y PATRIMONIO', d.totales.pasivoMasPatrimonio)];
  });
  descuadres = computed(() => {
    const d = this.datos();
    if (!d) return [];
    return d.totales.diferencia.map((v, i) => (Math.abs(Number(v)) > 0.05 ? new MesPipe().transform(d.meses[i]) : null)).filter((x) => x) as string[];
  });
}
