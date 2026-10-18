import { Component, input } from '@angular/core';
import { DineroPipe, esNegativo, MesPipe, PctPipe } from '../core/formato';

export interface FilaMensual {
  nombre: string;
  tipo?: string;
  nivel?: number;
  codigo?: string;
  valores: string[];
  total?: string;
  porcentaje?: number | null;
}

@Component({
  selector: 'df-tabla-mensual',
  imports: [DineroPipe, MesPipe, PctPipe],
  template: `
    <div class="tabla-scroll">
      <table class="estado">
        <thead>
          <tr>
            <th>{{ concepto() }}</th>
            @for (m of meses(); track m) { <th>{{ m | mes }}</th> }
            @if (conTotal()) { <th class="col-total">{{ tituloTotal() }}</th> }
            @if (conPorcentaje()) { <th class="col-pct">{{ tituloPorcentaje() }}</th> }
          </tr>
        </thead>
        <tbody>
          @for (f of filas(); track $index) {
            <tr [class]="f.tipo ?? ('nivel-' + f.nivel)">
              <td>@if (f.codigo) { <span class="codigo">{{ f.codigo }}</span> }{{ f.nombre }}</td>
              @for (v of f.valores; track $index) { <td class="num" [class.negativo]="neg(v)">{{ v | dinero }}</td> }
              @if (conTotal()) { <td class="num col-total" [class.negativo]="neg(f.total)">{{ f.total | dinero }}</td> }
              @if (conPorcentaje()) { <td class="num col-pct">{{ f.porcentaje | pct }}</td> }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `.codigo { color: var(--df-muted); font-size: 11px; margin-right: 8px; font-variant-numeric: tabular-nums; }`
})
export class TablaMensual {
  filas = input.required<FilaMensual[]>();
  meses = input.required<number[]>();
  concepto = input('Concepto');
  conTotal = input(true);
  tituloTotal = input('Total');
  conPorcentaje = input(false);
  tituloPorcentaje = input('% Ventas');
  neg = esNegativo;
}
