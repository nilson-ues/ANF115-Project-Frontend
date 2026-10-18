import { DatePipe, JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { mensajeError } from '../../core/interceptores';

interface Registro { id: number; accion: string; entidad: string; entidad_id: string; detalle: unknown; creado_en: string; usuario: string | null }

@Component({
  selector: 'df-bitacora',
  imports: [DatePipe, JsonPipe],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Bitácora</h1>
          <div class="sub">Últimos 200 cambios registrados: quién, qué y cuándo</div>
        </div>
      </div>
      @if (error()) { <div class="aviso error">{{ error() }}</div> }
      <div class="tabla-scroll">
        <table class="estado">
          <thead><tr><th class="izq">Fecha</th><th class="izq">Usuario</th><th class="izq">Acción</th><th class="izq">Entidad</th><th class="izq">Detalle</th></tr></thead>
          <tbody>
            @for (r of registros(); track r.id) {
              <tr>
                <td>{{ r.creado_en | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ r.usuario ?? 'Sistema' }}</td>
                <td><span class="chip" [class]="r.accion === 'CREAR' ? 'verde' : 'gris'">{{ r.accion }}</span></td>
                <td>{{ r.entidad }} #{{ r.entidad_id }}</td>
                <td><code>{{ r.detalle | json }}</code></td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="vacio">Sin movimientos registrados</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `th.izq { text-align: left !important; } code { font-size: 11px; color: var(--df-muted); white-space: normal; word-break: break-all; display: block; max-width: 640px; }`
})
export class Bitacora {
  registros = signal<Registro[]>([]);
  error = signal<string | null>(null);

  constructor() {
    inject(ApiService).get<Registro[]>('/configuracion/bitacora', { limite: 200 }).then((r) => this.registros.set(r)).catch((e) => this.error.set(mensajeError(e)));
  }
}
