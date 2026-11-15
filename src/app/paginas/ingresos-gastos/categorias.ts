import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/interceptores';
import { Categoria } from './modelos';

interface Cuenta { codigo: string; nombre: string; tipo: string; acepta_movimiento: boolean }

@Component({
  selector: 'df-categorias',
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Categorías financieras</h1>
          <div class="sub">Clasifican los ingresos y los gastos · Cada categoría se relaciona con una cuenta del catálogo</div>
        </div>
        <div class="acciones">
          @if (puedeEscribir()) { <button mat-flat-button (click)="abrir()"><span class="material-symbols-outlined">add</span> Nueva categoría</button> }
        </div>
      </div>
      @if (cargando()) { <mat-progress-bar mode="indeterminate" /> }
      @if (error()) { <div class="aviso error">{{ error() }}</div> }
      <div class="dos-columnas">
        @for (tipo of tipos; track tipo.valor) {
          <div class="tabla-scroll">
            <table class="estado">
              <thead><tr><th>{{ tipo.titulo }}</th><th class="izq">Cuenta contable</th><th>Movimientos</th><th>Estado</th>@if (puedeEscribir()) { <th></th> }</tr></thead>
              <tbody>
                @for (c of porTipo(tipo.valor); track c.id) {
                  <tr [class.inactivo]="!c.activa">
                    <td>{{ c.nombre }}<div class="muted">{{ c.descripcion }}</div></td>
                    <td>{{ c.cuenta_codigo ? c.cuenta_codigo + ' ' + c.cuenta_nombre : '—' }}</td>
                    <td class="num">{{ c.movimientos }}</td>
                    <td class="centro"><span class="chip" [class]="c.activa ? 'verde' : 'gris'">{{ c.activa ? 'Activa' : 'Inactiva' }}</span></td>
                    @if (puedeEscribir()) { <td class="centro"><button mat-icon-button (click)="abrir(c)" aria-label="Editar"><span class="material-symbols-outlined">edit</span></button></td> }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    @if (edicion(); as e) {
      <div class="fondo" (click)="edicion.set(null)"></div>
      <div class="dialogo" role="dialog">
        <h2>{{ e.id ? 'Editar' : 'Nueva' }} categoría</h2>
        <form class="campos" (ngSubmit)="guardar()">
          <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput [(ngModel)]="e.nombre" name="nombre" maxlength="80" required /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Tipo</mat-label>
            <mat-select [(ngModel)]="e.tipo" name="tipo" [disabled]="!!e.movimientos">
              <mat-option value="INGRESO">Ingreso</mat-option><mat-option value="GASTO">Gasto</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="completo"><mat-label>Cuenta contable</mat-label>
            <mat-select [(ngModel)]="e.cuenta_codigo" name="cuenta">
              <mat-option [value]="null">— Sin cuenta —</mat-option>
              @for (c of cuentasDe(e.tipo); track c.codigo) { <mat-option [value]="c.codigo">{{ c.codigo }} {{ c.nombre }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="completo"><mat-label>Descripción</mat-label><input matInput [(ngModel)]="e.descripcion" name="descripcion" maxlength="300" /></mat-form-field>
          <mat-checkbox [(ngModel)]="e.activa" name="activa">Activa (disponible para nuevos movimientos)</mat-checkbox>
          <div class="botones">
            <button mat-button type="button" (click)="edicion.set(null)">Cancelar</button>
            <button mat-flat-button type="submit">Guardar</button>
          </div>
        </form>
      </div>
    }
  `,
  styles: `.muted { font-size: 12px; color: var(--df-muted); } table.estado td:first-child { min-width: 220px; }`
})
export class Categorias {
  private api = inject(ApiService);
  private aviso = inject(MatSnackBar);
  private auth = inject(AuthService);
  tipos = [{ valor: 'INGRESO', titulo: 'Categorías de ingreso' }, { valor: 'GASTO', titulo: 'Categorías de gasto' }];
  categorias = signal<Categoria[]>([]);
  cuentas = signal<Cuenta[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
  edicion = signal<Partial<Categoria> | null>(null);
  puedeEscribir = computed(() => this.auth.tieneRol(['ADMIN', 'FINANZAS']));

  constructor() {
    this.cargar();
    if (this.puedeEscribir()) this.api.get<Cuenta[]>('/catalogos/cuentas').then((c) => this.cuentas.set(c.filter((x) => x.acepta_movimiento))).catch(() => undefined);
  }

  porTipo(tipo: string) {
    return this.categorias().filter((c) => c.tipo === tipo);
  }

  cuentasDe(tipo?: string) {
    const tipos = tipo === 'INGRESO' ? ['INGRESO'] : ['COSTO', 'GASTO'];
    return this.cuentas().filter((c) => tipos.includes(c.tipo));
  }

  async cargar() {
    this.cargando.set(true);
    try {
      this.categorias.set(await this.api.get<Categoria[]>('/categorias'));
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  abrir(c?: Categoria) {
    this.edicion.set(c ? { ...c } : { nombre: '', tipo: 'GASTO', cuenta_codigo: null, descripcion: '', activa: true });
  }

  async guardar() {
    const e = this.edicion()!;
    const cuerpo = { nombre: e.nombre, tipo: e.tipo, cuenta_codigo: e.cuenta_codigo, descripcion: e.descripcion || null, activa: e.activa };
    try {
      if (e.id) await this.api.put(`/categorias/${e.id}`, cuerpo);
      else await this.api.post('/categorias', cuerpo);
      this.edicion.set(null);
      this.aviso.open('Categoría guardada', 'OK', { duration: 2500 });
      this.cargar();
    } catch (err) {
      this.aviso.open(mensajeError(err), 'Cerrar', { duration: 6000 });
    }
  }
}
