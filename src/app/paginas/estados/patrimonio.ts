import { Component } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DineroPipe, esNegativo, MesPipe } from '../../core/formato';
import { SelectorPeriodo } from '../../shared/periodo';
import { Teoria, TeoriaPanel } from '../../shared/teoria';
import { PaginaPeriodo } from './base';

interface Patrimonio {
  anio: number;
  hastaMes: number;
  filas: { codigo: string; nombre: string; inicial: string; variacion: string; final: string }[];
  totales: { inicial: string; variacion: string; final: string };
  utilidadPeriodo: string;
  reservaPeriodo: string;
  teoria: Teoria;
}

@Component({
  selector: 'df-patrimonio',
  imports: [SelectorPeriodo, TeoriaPanel, MatProgressBarModule, DineroPipe, MesPipe],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Estado de cambios en el patrimonio</h1>
          @if (datos(); as d) { <div class="sub">Del 1 de enero al cierre de {{ d.hastaMes | mes: true }} de {{ d.anio }}</div> }
        </div>
        <div class="acciones">
          <df-periodo [(anio)]="anio" [(escenario)]="escenario" [(mes)]="mes" />
          @if (datos(); as d) { <df-teoria [temas]="[d.teoria]" fuente="Unidad I" /> }
        </div>
      </div>
      @if (cargando()) { <mat-progress-bar mode="indeterminate" /> }
      @if (error()) { <div class="aviso error">{{ error() }}</div> }
      @if (datos(); as d) {
        <div class="tabla-scroll">
          <table class="estado">
            <thead><tr><th>Componente</th><th>Saldo inicial</th><th>Movimiento del período</th><th class="col-total">Saldo final</th></tr></thead>
            <tbody>
              @for (f of d.filas; track f.codigo) {
                <tr>
                  <td>{{ f.nombre }}</td>
                  <td class="num" [class.negativo]="neg(f.inicial)">{{ f.inicial | dinero }}</td>
                  <td class="num" [class.negativo]="neg(f.variacion)">{{ f.variacion | dinero }}</td>
                  <td class="num col-total" [class.negativo]="neg(f.final)">{{ f.final | dinero }}</td>
                </tr>
              }
              <tr class="total">
                <td>Total patrimonio</td>
                <td class="num">{{ d.totales.inicial | dinero }}</td>
                <td class="num">{{ d.totales.variacion | dinero }}</td>
                <td class="num">{{ d.totales.final | dinero }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="nota">Resultado del período según estado de resultados: {{ d.utilidadPeriodo | dinero: true }} · Reserva legal del período: {{ d.reservaPeriodo | dinero: true }}</p>
      }
    </div>
  `,
  styles: `.nota { color: var(--df-muted); font-size: 13px; margin-top: 12px; } table.estado { max-width: 900px; }`
})
export class CambiosPatrimonio extends PaginaPeriodo<Patrimonio> {
  ruta = '/estados/patrimonio';
  neg = esNegativo;
}
