import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { TablaExport } from '../../core/exportar';
import { DineroPipe } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { TEORIA_INGRESOS_GASTOS } from '../../core/teoria-modulos';
import { Exportar } from '../../shared/exportar';
import { TeoriaPanel } from '../../shared/teoria';
import { Categoria, FORMAS_PAGO, hoy, Indicadores, Movimiento, pctTexto, TipoMovimiento } from './modelos';

interface Listado { datos: Movimiento[]; total: number; pagina: number; tamano: number; indicadores: Indicadores }
interface Edicion { id?: number; fecha: string; tipo: TipoMovimiento; categoria_id: number | null; concepto: string; monto: number | null; forma_pago: string; referencia: string }

@Component({
  selector: 'df-movimientos',
  imports: [FormsModule, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule, DineroPipe, Exportar, TeoriaPanel],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Ingresos y gastos</h1>
          <div class="sub">Registro de movimientos con concepto, monto, fecha y categoría · Los anulados no se suman</div>
        </div>
        <div class="acciones">
          <df-exportar [tablas]="exportar" archivo="movimientos" />
          <df-teoria [temas]="teoria" fuente="Guía del proyecto" />
          <button mat-flat-button (click)="nuevo('INGRESO')"><span class="material-symbols-outlined">add</span> Ingreso</button>
          @if (puedeGasto()) { <button mat-flat-button class="gasto" (click)="nuevo('GASTO')"><span class="material-symbols-outlined">remove</span> Gasto</button> }
        </div>
      </div>

      <div class="filtros">
        <mat-form-field appearance="outline"><mat-label>Desde</mat-label><input matInput type="date" [(ngModel)]="f.desde" (change)="buscar()" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Hasta</mat-label><input matInput type="date" [(ngModel)]="f.hasta" (change)="buscar()" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Tipo</mat-label>
          <mat-select [(ngModel)]="f.tipo" (selectionChange)="buscar()">
            <mat-option value="">Todos</mat-option><mat-option value="INGRESO">Ingresos</mat-option><mat-option value="GASTO">Gastos</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Categoría</mat-label>
          <mat-select [(ngModel)]="f.categoria_id" (selectionChange)="buscar()">
            <mat-option [value]="null">Todas</mat-option>
            @for (c of categoriasFiltro(); track c.id) { <mat-option [value]="c.id">{{ c.nombre }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Estado</mat-label>
          <mat-select [(ngModel)]="f.estado" (selectionChange)="buscar()">
            <mat-option value="activos">Vigentes</mat-option><mat-option value="anulados">Anulados</mat-option><mat-option value="todos">Todos</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="ancho"><mat-label>Buscar concepto o referencia</mat-label><input matInput [(ngModel)]="f.q" (keyup.enter)="buscar()" /></mat-form-field>
        <button mat-button (click)="limpiar()">Limpiar</button>
      </div>

      @if (cargando()) { <mat-progress-bar mode="indeterminate" /> }
      @if (error()) { <div class="aviso error">{{ error() }}</div> }

      @if (listado(); as l) {
        <div class="resumen">
          <span>Ingresos: <b>{{ l.indicadores.ingresos | dinero: true }}</b></span>
          <span>Gastos: <b>{{ l.indicadores.gastos | dinero: true }}</b></span>
          <span>Resultado: <b [class.negativo]="+l.indicadores.resultado < 0">{{ l.indicadores.resultado | dinero: true }}</b></span>
          <span>% de gastos: <b>{{ pct(l.indicadores.porcentajeGastos) }}</b></span>
        </div>
        <div class="tabla-scroll">
          <table class="estado">
            <thead><tr><th>Fecha</th><th class="izq">Concepto</th><th class="izq">Categoría</th><th class="izq">Forma de pago</th><th class="izq">Referencia</th><th>Monto</th><th></th></tr></thead>
            <tbody>
              @for (m of l.datos; track m.id) {
                <tr [class.inactivo]="m.anulado">
                  <td>{{ m.fecha }}</td>
                  <td>{{ m.concepto }} @if (m.anulado) { <span class="chip gris" [title]="m.motivo_anulacion ?? ''">Anulado</span> }</td>
                  <td><span class="punto" [class]="m.tipo === 'INGRESO' ? 'verde' : 'rojo'"></span> {{ m.categoria }}</td>
                  <td>{{ formaPago(m.forma_pago) }}</td>
                  <td>{{ m.referencia }}</td>
                  <td class="num" [class.negativo]="m.tipo === 'GASTO'">{{ m.tipo === 'GASTO' ? '−' : '' }}{{ m.monto | dinero }}</td>
                  <td class="centro acciones-fila">
                    @if (puedeEditar() && !m.anulado) {
                      <button mat-icon-button (click)="editar(m)" aria-label="Editar"><span class="material-symbols-outlined">edit</span></button>
                      <button mat-icon-button (click)="pedirAnulacion(m)" aria-label="Anular"><span class="material-symbols-outlined">block</span></button>
                    }
                  </td>
                </tr>
              } @empty { <tr><td colspan="7" class="vacio">No hay movimientos con esos filtros</td></tr> }
            </tbody>
          </table>
        </div>
        <div class="paginacion">
          <span class="conteo">{{ l.total }} movimientos · página {{ l.pagina }} de {{ paginas() }}</span>
          <button mat-icon-button [disabled]="l.pagina <= 1" (click)="irA(l.pagina - 1)"><span class="material-symbols-outlined">chevron_left</span></button>
          <button mat-icon-button [disabled]="l.pagina >= paginas()" (click)="irA(l.pagina + 1)"><span class="material-symbols-outlined">chevron_right</span></button>
        </div>
      }
    </div>

    @if (edicion(); as e) {
      <div class="fondo" (click)="edicion.set(null)"></div>
      <div class="dialogo" role="dialog">
        <h2>{{ e.id ? 'Editar' : 'Registrar' }} {{ e.tipo === 'INGRESO' ? 'ingreso' : 'gasto' }}</h2>
        <form class="campos" (ngSubmit)="guardar()">
          @if (e.id) {
            <mat-button-toggle-group class="completo" [(ngModel)]="e.tipo" name="tipo" (change)="e.categoria_id = null">
              <mat-button-toggle value="INGRESO">Ingreso</mat-button-toggle><mat-button-toggle value="GASTO">Gasto</mat-button-toggle>
            </mat-button-toggle-group>
          }
          <mat-form-field appearance="outline"><mat-label>Fecha</mat-label><input matInput type="date" [(ngModel)]="e.fecha" name="fecha" required /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Monto (US$)</mat-label><input matInput type="number" min="0.01" step="0.01" [(ngModel)]="e.monto" name="monto" required /></mat-form-field>
          <mat-form-field appearance="outline" class="completo"><mat-label>Concepto</mat-label><input matInput [(ngModel)]="e.concepto" name="concepto" maxlength="200" required /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Categoría</mat-label>
            <mat-select [(ngModel)]="e.categoria_id" name="categoria" required>
              @for (c of categoriasDe(e.tipo); track c.id) { <mat-option [value]="c.id">{{ c.nombre }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Forma de pago</mat-label>
            <mat-select [(ngModel)]="e.forma_pago" name="forma_pago">
              @for (fp of formas; track fp.valor) { <mat-option [value]="fp.valor">{{ fp.texto }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="completo"><mat-label>Referencia (factura, recibo, cheque)</mat-label><input matInput [(ngModel)]="e.referencia" name="referencia" maxlength="60" /></mat-form-field>
          <div class="botones">
            <button mat-button type="button" (click)="edicion.set(null)">Cancelar</button>
            <button mat-flat-button type="submit" [disabled]="guardando()">Guardar</button>
          </div>
        </form>
      </div>
    }

    @if (anulando(); as a) {
      <div class="fondo" (click)="anulando.set(null)"></div>
      <div class="dialogo" role="dialog">
        <h2>Anular movimiento</h2>
        <p>{{ a.fecha }} · {{ a.concepto }} · {{ a.monto | dinero: true }}</p>
        <p class="muted">El movimiento no se borra: queda marcado como anulado, con el motivo, en la bitácora.</p>
        <mat-form-field appearance="outline" class="completo-ancho"><mat-label>Motivo de la anulación</mat-label><textarea matInput rows="3" [(ngModel)]="motivo" maxlength="300"></textarea></mat-form-field>
        <div class="botones">
          <button mat-button (click)="anulando.set(null)">Cancelar</button>
          <button mat-flat-button class="gasto" [disabled]="motivo.trim().length < 5" (click)="anular()">Anular</button>
        </div>
      </div>
    }
  `,
  styles: `
    .filtros .ancho { width: 260px; }
    .resumen { display: flex; gap: 24px; flex-wrap: wrap; font-size: 13px; margin-bottom: 10px; color: var(--df-muted); b { color: var(--df-text); } }
    table.estado td:first-child { min-width: 100px; }
    .acciones-fila { white-space: nowrap; }
    .paginacion { display: flex; align-items: center; gap: 4px; justify-content: flex-end; margin-top: 6px; .conteo { margin: 0 8px 0 0; } }
    .gasto { --mat-button-filled-container-color: var(--df-rojo); }
    .muted { color: var(--df-muted); font-size: 13px; }
    .completo-ancho { width: 100%; }
  `
})
export class Movimientos {
  private api = inject(ApiService);
  private aviso = inject(MatSnackBar);
  private auth = inject(AuthService);
  teoria = TEORIA_INGRESOS_GASTOS;
  formas = FORMAS_PAGO;
  pct = pctTexto;
  listado = signal<Listado | null>(null);
  categorias = signal<Categoria[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  error = signal<string | null>(null);
  edicion = signal<Edicion | null>(null);
  anulando = signal<Movimiento | null>(null);
  motivo = '';
  pagina = 1;
  f = { desde: '', hasta: '', tipo: '', categoria_id: null as number | null, estado: 'activos', q: '' };

  puedeGasto = computed(() => this.auth.tieneRol(['ADMIN', 'FINANZAS']));
  puedeEditar = computed(() => this.auth.tieneRol(['ADMIN', 'FINANZAS']));
  paginas = computed(() => Math.max(1, Math.ceil((this.listado()?.total ?? 0) / (this.listado()?.tamano ?? 50))));
  categoriasFiltro = computed(() => this.categorias().filter((c) => !this.f.tipo || c.tipo === this.f.tipo));

  constructor() {
    this.api.get<Categoria[]>('/categorias').then((c) => this.categorias.set(c)).catch(() => undefined);
    this.cargar();
  }

  categoriasDe(tipo: TipoMovimiento) {
    return this.categorias().filter((c) => c.tipo === tipo && c.activa);
  }

  formaPago(valor: string) {
    return FORMAS_PAGO.find((f) => f.valor === valor)?.texto ?? valor;
  }

  buscar() {
    this.pagina = 1;
    this.cargar();
  }

  limpiar() {
    this.f = { desde: '', hasta: '', tipo: '', categoria_id: null, estado: 'activos', q: '' };
    this.buscar();
  }

  irA(p: number) {
    this.pagina = p;
    this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.listado.set(await this.api.get<Listado>('/movimientos', { ...this.f, pagina: this.pagina }));
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  nuevo(tipo: TipoMovimiento) {
    this.edicion.set({ fecha: hoy(), tipo, categoria_id: null, concepto: '', monto: null, forma_pago: 'EFECTIVO', referencia: '' });
  }

  editar(m: Movimiento) {
    this.edicion.set({ id: m.id, fecha: m.fecha, tipo: m.tipo, categoria_id: m.categoria_id, concepto: m.concepto, monto: Number(m.monto), forma_pago: m.forma_pago, referencia: m.referencia ?? '' });
  }

  async guardar() {
    const e = this.edicion()!;
    if (!e.monto || e.monto <= 0) {
      this.aviso.open('El monto debe ser mayor que cero', 'Cerrar', { duration: 4000 });
      return;
    }
    this.guardando.set(true);
    try {
      const cuerpo = { ...e, monto: e.monto.toFixed(2), referencia: e.referencia || null };
      if (e.id) await this.api.put(`/movimientos/${e.id}`, cuerpo);
      else await this.api.post('/movimientos', cuerpo);
      this.edicion.set(null);
      this.aviso.open('Movimiento guardado', 'OK', { duration: 2500 });
      this.cargar();
    } catch (err) {
      this.aviso.open(mensajeError(err), 'Cerrar', { duration: 6000 });
    } finally {
      this.guardando.set(false);
    }
  }

  pedirAnulacion(m: Movimiento) {
    this.motivo = '';
    this.anulando.set(m);
  }

  async anular() {
    try {
      await this.api.patch(`/movimientos/${this.anulando()!.id}/anular`, { motivo: this.motivo });
      this.anulando.set(null);
      this.aviso.open('Movimiento anulado', 'OK', { duration: 2500 });
      this.cargar();
    } catch (err) {
      this.aviso.open(mensajeError(err), 'Cerrar', { duration: 6000 });
    }
  }

  exportar = (): TablaExport[] => {
    const l = this.listado();
    const filtro = [this.f.desde && `desde ${this.f.desde}`, this.f.hasta && `hasta ${this.f.hasta}`].filter(Boolean).join(' ');
    return [{
      titulo: 'Movimientos de ingresos y gastos',
      subtitulo: `${filtro || 'Todos los períodos'} · Página ${l?.pagina ?? 1} · Resultado ${l?.indicadores.resultado ?? ''}`,
      columnas: [
        { titulo: 'Fecha', clave: 'fecha' }, { titulo: 'Tipo', clave: 'tipo' }, { titulo: 'Concepto', clave: 'concepto' },
        { titulo: 'Categoría', clave: 'categoria' }, { titulo: 'Referencia', clave: 'referencia' }, { titulo: 'Monto', clave: 'monto', tipo: 'dinero' }
      ],
      filas: (l?.datos ?? []).map((m) => ({ ...m, tipo: m.anulado ? `${m.tipo} (anulado)` : m.tipo }))
    }];
  };
}
