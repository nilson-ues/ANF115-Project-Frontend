import { Component } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { NgTemplateOutlet } from '@angular/common';
import { DineroPipe, esNegativo, PctPipe } from '../../core/formato';
import { SelectorPeriodo } from '../../shared/periodo';
import { Teoria, TeoriaPanel } from '../../shared/teoria';
import { PaginaPeriodo } from '../estados/base';

interface Fila { nombre: string; tipo?: string; nivel?: number; actual: string; anterior: string; variacion: string; variacionPct: number | null }
interface Horizontal { anio: number; anterior: number; hastaMes: number; resultados: Fila[]; balance: Fila[]; teoria: Teoria }

@Component({
  selector: 'df-horizontal',
  imports: [SelectorPeriodo, TeoriaPanel, MatProgressBarModule, MatTabsModule, NgTemplateOutlet, DineroPipe, PctPipe],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Análisis horizontal</h1>
          <div class="sub">Comparación de cada cuenta contra el año anterior (análisis de series temporales)</div>
        </div>
        <div class="acciones">
          <df-periodo [(anio)]="anio" [conEscenario]="false" [conMes]="false" />
          @if (datos(); as d) { <df-teoria [temas]="[d.teoria]" fuente="Unidad II" /> }
        </div>
      </div>
      @if (cargando()) { <mat-progress-bar mode="indeterminate" /> }
      @if (error()) { <div class="aviso error">{{ error() }}</div> }
      @if (datos(); as d) {
        <mat-tab-group animationDuration="0">
          <mat-tab label="Estado de resultados">
            <ng-container *ngTemplateOutlet="tabla; context: { filas: d.resultados, d }" />
          </mat-tab>
          <mat-tab label="Balance general">
            <ng-container *ngTemplateOutlet="tabla; context: { filas: d.balance, d }" />
          </mat-tab>
        </mat-tab-group>
      }
    </div>
    <ng-template #tabla let-filas="filas" let-d="d">
      <div class="tabla-scroll espacio">
        <table class="estado">
          <thead><tr><th>Cuenta</th><th>{{ d.anio }}</th><th>{{ d.anterior }}</th><th>Variación $</th><th>Variación %</th><th></th></tr></thead>
          <tbody>
            @for (f of filas; track $index) {
              <tr [class]="f.tipo ?? ('nivel-' + f.nivel)">
                <td>{{ f.nombre }}</td>
                <td class="num" [class.negativo]="neg(f.actual)">{{ f.actual | dinero }}</td>
                <td class="num" [class.negativo]="neg(f.anterior)">{{ f.anterior | dinero }}</td>
                <td class="num" [class.negativo]="neg(f.variacion)">{{ f.variacion | dinero }}</td>
                <td class="num" [class.negativo]="(f.variacionPct ?? 0) < 0">{{ f.variacionPct | pct }}</td>
                <td class="barra"><div [class.baja]="(f.variacionPct ?? 0) < 0" [style.width.%]="ancho(f.variacionPct)"></div></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </ng-template>
  `,
  styles: `
    .espacio { margin-top: 12px; }
    td.barra { width: 140px; }
    td.barra div { height: 8px; border-radius: 4px; background: var(--df-verde); max-width: 100%; }
    td.barra div.baja { background: var(--df-rojo); }
  `
})
export class AnalisisHorizontal extends PaginaPeriodo<Horizontal> {
  ruta = '/analisis/horizontal';
  neg = esNegativo;
  ancho(v: number | null) {
    return v === null ? 0 : Math.min(Math.abs(v) * 100, 100);
  }
}
