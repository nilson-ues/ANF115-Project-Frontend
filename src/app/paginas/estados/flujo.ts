import { Component, computed } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DineroPipe } from '../../core/formato';
import { SelectorPeriodo } from '../../shared/periodo';
import { FilaMensual, TablaMensual } from '../../shared/tabla-mensual';
import { Teoria, TeoriaPanel } from '../../shared/teoria';
import { PaginaPeriodo } from './base';

interface Linea { nombre: string; valores: string[]; total: string }
interface Flujo {
  meses: number[];
  secciones: { nombre: string; lineas: Linea[]; valores: string[]; total: string }[];
  flujoNeto: Linea;
  efectivoInicial: Linea;
  efectivoFinal: Linea;
  efectivoBalance: Linea;
  diferencia: Linea;
  cuadra: boolean;
  teoria: Teoria;
}

@Component({
  selector: 'df-flujo',
  imports: [SelectorPeriodo, TablaMensual, TeoriaPanel, MatProgressBarModule, DineroPipe],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Estado de flujos de efectivo</h1>
          <div class="sub">Método indirecto · Actividades de operación, inversión y financiamiento</div>
        </div>
        <div class="acciones">
          <df-periodo [(anio)]="anio" [(escenario)]="escenario" [(mes)]="mes" />
          @if (datos(); as d) { <df-teoria [temas]="[d.teoria, decisiones]" fuente="Unidad I" /> }
        </div>
      </div>
      @if (cargando()) { <mat-progress-bar mode="indeterminate" /> }
      @if (error()) { <div class="aviso error">{{ error() }}</div> }
      @if (datos(); as d) {
        @if (d.cuadra) {
          <div class="aviso ok">El efectivo final del flujo coincide con el efectivo del balance general ({{ d.efectivoBalance.total | dinero: true }})</div>
        } @else {
          <div class="aviso error">El efectivo final del flujo ({{ d.efectivoFinal.total | dinero: true }}) no coincide con el balance ({{ d.efectivoBalance.total | dinero: true }}). Diferencia: {{ d.diferencia.total | dinero: true }}</div>
        }
        <df-tabla-mensual [filas]="filas()" [meses]="d.meses" tituloTotal="Año" />
      }
    </div>
  `
})
export class FlujoEfectivo extends PaginaPeriodo<Flujo> {
  ruta = '/estados/flujo';
  decisiones: Teoria = {
    titulo: 'Las tres decisiones financieras',
    formula: 'Operación (administración de bienes) · Inversión · Financiamiento',
    texto: 'La decisión de inversión es la más importante en la creación de valor; la de financiamiento se ocupa del lado derecho del balance; la de administración de bienes, del manejo eficiente de los activos ya adquiridos. El flujo de efectivo muestra el resultado de cada una.',
    fuente: 'Unidad I - Alcance de la función financiera'
  };
  filas = computed(() => {
    const d = this.datos();
    if (!d) return [];
    const filas: FilaMensual[] = [];
    for (const s of d.secciones) {
      filas.push({ nombre: s.nombre.toUpperCase(), valores: d.meses.map(() => ''), total: '', tipo: 'nivel-1' });
      filas.push(...s.lineas.map((l) => ({ ...l, tipo: 'sub' })));
      filas.push({ nombre: `Total ${s.nombre.toLowerCase()}`, valores: s.valores, total: s.total, tipo: 'subtotal' });
    }
    filas.push({ ...d.flujoNeto, nombre: 'Flujo neto de efectivo', tipo: 'subtotal' });
    filas.push({ ...d.efectivoInicial, nombre: 'Efectivo al inicio del período' });
    filas.push({ ...d.efectivoFinal, nombre: 'Efectivo al final del período', tipo: 'total' });
    filas.push({ ...d.efectivoBalance, nombre: 'Efectivo según balance general', tipo: 'sub' });
    return filas;
  });
}
