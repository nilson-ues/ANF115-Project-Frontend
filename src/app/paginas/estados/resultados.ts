import { Component } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SelectorPeriodo } from '../../shared/periodo';
import { FilaMensual, TablaMensual } from '../../shared/tabla-mensual';
import { Teoria, TeoriaPanel } from '../../shared/teoria';
import { PaginaPeriodo } from './base';

interface EstadoResultados {
  anio: number;
  escenario: string;
  meses: number[];
  lineas: FilaMensual[];
  teoria: Teoria;
}

const TEORIA_ER: Teoria = {
  titulo: 'Estado de resultados',
  formula: 'Ventas netas − Costo de ventas = Utilidad bruta − Gastos de operación = Utilidad de operación ... = Utilidad del ejercicio',
  texto: 'Muestra ordenadamente cómo se obtuvo el resultado del período: los logros (ingresos) contra los esfuerzos (costos y gastos). Permite evaluar la rentabilidad, el potencial de crédito y el desempeño de la administración. Costo de ventas = Inventario inicial + Compras − Rebajas y devoluciones sobre compras − Inventario final.',
  fuente: 'Unidad I - Estados financieros'
};

@Component({
  selector: 'df-resultados',
  imports: [SelectorPeriodo, TablaMensual, TeoriaPanel, MatProgressBarModule],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Estado de resultados</h1>
          <div class="sub">Del 1 de enero al cierre de cada mes · Expresado en dólares de los Estados Unidos de América</div>
        </div>
        <div class="acciones">
          <df-periodo [(anio)]="anio" [(escenario)]="escenario" [(mes)]="mes" />
          @if (datos(); as d) { <df-teoria [temas]="[teoria, d.teoria]" fuente="Unidad I · Unidad II" /> }
        </div>
      </div>
      @if (cargando()) { <mat-progress-bar mode="indeterminate" /> }
      @if (error()) { <div class="aviso error">{{ error() }}</div> }
      @if (datos(); as d) {
        <df-tabla-mensual [filas]="d.lineas" [meses]="d.meses" [conPorcentaje]="true" tituloTotal="Acumulado" />
      }
    </div>
  `
})
export class Resultados extends PaginaPeriodo<EstadoResultados> {
  ruta = '/estados/resultados';
  teoria = TEORIA_ER;
}
