import { Component, effect, inject, signal } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/api.service';
import { TablaExport } from '../../core/exportar';
import { DineroPipe } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { PeriodoService } from '../../core/periodo.service';
import { TEORIA_CREDITO, TEORIA_EFECTIVO } from '../../core/teoria-modulos';
import { Exportar } from '../../shared/exportar';
import { SelectorPeriodo } from '../../shared/periodo';
import { TeoriaPanel } from '../../shared/teoria';

interface Efectivo {
  anio: number; hastaMes: number; diasAnio: number;
  edadInventario: number; periodoCobro: number; periodoPago: number; cicloOperativo: number; cicloConversion: number;
  rotacionEfectivo: number | null; desembolsosAnuales: string; efectivoMinimo: string | null; efectivoReal: string;
  plazoCredito: number | null; cobroExcedePlazo: boolean | null;
  clientes: { nombre: string; tipo: string; plazo_credito_dias: number; limite_credito: string; descuento_pronto_pago: string; dias_pronto_pago: number }[];
}

@Component({
  selector: 'df-efectivo',
  imports: [MatProgressBarModule, SelectorPeriodo, TeoriaPanel, DineroPipe, Exportar],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Administración del efectivo</h1>
          <div class="sub">Ciclo operativo, ciclo de conversión del efectivo y efectivo mínimo para operaciones · Datos reales de la tesis</div>
        </div>
        <div class="acciones">
          <df-periodo [(anio)]="anio" [conEscenario]="false" [conMes]="false" />
          @if (datos()) { <df-exportar [tablas]="exportar" archivo="ciclo-efectivo" /> }
          <df-teoria [temas]="teoria" fuente="Unidad IV · temas 4 a 6" />
        </div>
      </div>
      @if (cargando()) { <mat-progress-bar mode="indeterminate" /> }
      @if (error()) { <div class="aviso error">{{ error() }}</div> }

      @if (datos(); as d) {
        <div class="tarjeta linea">
          <h2>Línea de tiempo del ciclo ({{ d.anio }})</h2>
          <div class="barra">
            <div class="tramo inv" [style.flex]="d.edadInventario">Inventario · {{ d.edadInventario.toFixed(0) }} días</div>
            <div class="tramo cxc" [style.flex]="d.periodoCobro">Cobro · {{ d.periodoCobro.toFixed(0) }} días</div>
          </div>
          <div class="barra">
            <div class="tramo cxp" [style.flex]="d.periodoPago">Pago a proveedores · {{ d.periodoPago.toFixed(0) }} días</div>
            <div class="tramo cce" [style.flex]="d.cicloConversion">Dinero invertido · {{ d.cicloConversion.toFixed(0) }} días</div>
          </div>
        </div>

        <div class="kpis seccion">
          <div class="tarjeta kpi"><div class="etiqueta">Ciclo operativo</div><div class="grande">{{ d.cicloOperativo.toFixed(1) }} días</div><div class="nota">EPI {{ d.edadInventario.toFixed(1) }} + PPC {{ d.periodoCobro.toFixed(1) }}</div></div>
          <div class="tarjeta kpi"><div class="etiqueta">Ciclo de conversión del efectivo</div><div class="grande">{{ d.cicloConversion.toFixed(1) }} días</div><div class="nota">Ciclo operativo − PPP {{ d.periodoPago.toFixed(1) }}</div></div>
          <div class="tarjeta kpi"><div class="etiqueta">Rotación del efectivo</div><div class="grande">{{ d.rotacionEfectivo?.toFixed(2) ?? '—' }} veces</div><div class="nota">{{ d.diasAnio }} / CCE</div></div>
          <div class="tarjeta kpi" [class.alerta]="d.efectivoMinimo !== null && +d.efectivoReal < +d.efectivoMinimo">
            <div class="etiqueta">Efectivo mínimo para operar</div><div class="grande">{{ d.efectivoMinimo | dinero: true }}</div>
            <div class="nota">Efectivo real al cierre: {{ d.efectivoReal | dinero: true }}</div>
          </div>
        </div>

        <div class="dos-columnas">
          <div class="tarjeta">
            <h2>Interpretación</h2>
            <p>Desde que DistriFarma paga a sus proveedores hasta que cobra a sus clientes pasan <b>{{ d.cicloConversion.toFixed(0) }} días</b>. Con desembolsos anuales de {{ d.desembolsosAnuales | dinero: true }}, necesita en promedio {{ d.efectivoMinimo | dinero: true }} de efectivo para operar.</p>
            @if (d.cobroExcedePlazo) {
              <p class="alerta-texto">El periodo promedio de cobro ({{ d.periodoCobro.toFixed(0) }} días) supera el plazo de crédito de {{ d.plazoCredito }} días: hay que reforzar la supervisión del crédito y la cobranza.</p>
            }
            <p>Para acortar el ciclo: reducir la edad del inventario (la tesis señala exceso de compras en 2009), acelerar cobros y aprovechar todo el plazo de los proveedores sin perder descuentos.</p>
          </div>
          <div class="tabla-scroll">
            <table class="estado">
              <thead><tr><th>Cliente (términos de crédito)</th><th>Plazo</th><th>Límite</th><th>Pronto pago</th></tr></thead>
              <tbody>
                @for (c of d.clientes; track c.nombre) {
                  <tr><td>{{ c.nombre }}</td><td class="num">neto {{ c.plazo_credito_dias }}</td><td class="num">{{ c.limite_credito | dinero: true }}</td>
                    <td class="num">{{ +c.descuento_pronto_pago > 0 ? (+c.descuento_pronto_pago * 100).toFixed(1) + '% a ' + c.dias_pronto_pago + ' días' : '—' }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .barra { display: flex; gap: 4px; margin: 8px 0; }
    .tramo { padding: 10px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .inv { background: #0f766e; } .cxc { background: #2563eb; } .cxp { background: #94a3b8; } .cce { background: #b45309; }
    p { line-height: 1.55; font-size: 13px; }
    .alerta-texto { color: var(--df-rojo); }
  `
})
export class AdministracionEfectivo {
  private api = inject(ApiService);
  private periodo = inject(PeriodoService);
  teoria = [...TEORIA_EFECTIVO, TEORIA_CREDITO[0]];
  anio = this.periodo.anio;
  datos = signal<Efectivo | null>(null);
  cargando = signal(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const a = this.anio();
      if (a !== null) this.cargar(a);
    });
  }

  async cargar(anio: number) {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.datos.set(await this.api.get<Efectivo>('/circulante/efectivo', { anio }));
    } catch (e) {
      this.datos.set(null);
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  exportar = (): TablaExport[] => {
    const d = this.datos()!;
    return [{
      titulo: `Ciclo de conversión del efectivo ${d.anio}`,
      columnas: [{ titulo: 'Concepto', clave: 'c' }, { titulo: 'Valor', clave: 'v' }],
      filas: [
        { c: 'Edad promedio del inventario (días)', v: d.edadInventario.toFixed(2) },
        { c: 'Periodo promedio de cobro (días)', v: d.periodoCobro.toFixed(2) },
        { c: 'Periodo promedio de pago (días)', v: d.periodoPago.toFixed(2) },
        { c: 'Ciclo operativo (días)', v: d.cicloOperativo.toFixed(2) },
        { c: 'Ciclo de conversión del efectivo (días)', v: d.cicloConversion.toFixed(2) },
        { c: 'Rotación del efectivo', v: d.rotacionEfectivo?.toFixed(4) ?? '' },
        { c: 'Desembolsos anuales', v: d.desembolsosAnuales },
        { c: 'Efectivo mínimo para operaciones', v: d.efectivoMinimo ?? '' },
        { c: 'Efectivo real al cierre', v: d.efectivoReal }
      ]
    }];
  };
}
