import { Component, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { mensajeError } from '../../core/interceptores';
import { TeoriaPanel } from '../../shared/teoria';

interface Cuenta { codigo: string; nombre: string; tipo: string; naturaleza: string; padre_codigo: string | null; nivel: number; acepta_movimiento: boolean }

@Component({
  selector: 'df-cuentas',
  imports: [TeoriaPanel],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Catálogo de cuentas</h1>
          <div class="sub">Estructura usada por la empresa en la tesis: activo, pasivo, patrimonio, ingresos, costos y gastos</div>
        </div>
        <div class="acciones"><df-teoria [temas]="teoria" fuente="Unidad I" /></div>
      </div>
      @if (error()) { <div class="aviso error">{{ error() }}</div> }
      <div class="resumen">
        @for (t of tipos(); track t.tipo) { <div class="tarjeta"><div class="etiqueta">{{ t.tipo }}</div><div class="grande">{{ t.cantidad }}</div></div> }
      </div>
      <div class="tabla-scroll">
        <table class="estado">
          <thead><tr><th>Código</th><th class="izq">Cuenta</th><th class="izq">Tipo</th><th class="izq">Naturaleza</th><th class="izq">Movimiento</th></tr></thead>
          <tbody>
            @for (c of cuentas(); track c.codigo) {
              <tr [class]="'nivel-' + c.nivel">
                <td class="codigo">{{ c.codigo }}</td>
                <td [style.padding-left.px]="12 + (c.nivel - 1) * 18">{{ c.nombre }}</td>
                <td>{{ c.tipo }}</td>
                <td>{{ c.naturaleza }}</td>
                <td>@if (c.acepta_movimiento) { <span class="chip verde">Detalle</span> } @else { <span class="chip gris">Agrupadora</span> }</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .resumen { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
    .etiqueta { font-size: 12px; color: var(--df-muted); text-transform: uppercase; font-weight: 600; }
    .grande { font-size: 24px; font-weight: 700; }
    th.izq { text-align: left !important; }
    .codigo { font-variant-numeric: tabular-nums; color: var(--df-muted); }
  `
})
export class CatalogoCuentas {
  private api = inject(ApiService);
  cuentas = signal<Cuenta[]>([]);
  error = signal<string | null>(null);
  tipos = computed(() => {
    const mapa = new Map<string, number>();
    for (const c of this.cuentas()) if (c.acepta_movimiento) mapa.set(c.tipo, (mapa.get(c.tipo) ?? 0) + 1);
    return [...mapa].map(([tipo, cantidad]) => ({ tipo, cantidad }));
  });
  teoria = [{
    titulo: 'Catálogo de cuentas y partida doble',
    formula: 'Activo = Pasivo + Patrimonio   ·   Debe = Haber',
    texto: 'Las cuentas de activo, costos y gastos son de naturaleza deudora; las de pasivo, patrimonio e ingresos, acreedora. Las cuentas agrupadoras suman a sus subcuentas y solo las de detalle reciben movimientos.',
    fuente: 'Unidad I - Estados financieros'
  }];

  constructor() {
    this.api.get<Cuenta[]>('/catalogos/cuentas').then((c) => this.cuentas.set(c)).catch((e) => this.error.set(mensajeError(e)));
  }
}
