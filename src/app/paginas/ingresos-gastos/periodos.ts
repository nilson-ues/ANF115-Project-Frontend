import { SlicePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { MesPipe } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { TEORIA_PERIODOS } from '../../core/teoria-modulos';
import { TeoriaPanel } from '../../shared/teoria';

interface Periodo { anio: number; mes: number; estado: 'ABIERTO' | 'CERRADO'; cerrado_en: string | null; movimientos: number }

@Component({
  selector: 'df-periodos',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule, MesPipe, TeoriaPanel, SlicePipe],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Cierre de períodos</h1>
          <div class="sub">Un período cerrado no admite registros, cambios ni anulaciones</div>
        </div>
        <div class="acciones">
          <mat-form-field appearance="outline" class="compacto"><mat-label>Año</mat-label><input matInput type="number" [(ngModel)]="anio" /></mat-form-field>
          <mat-form-field appearance="outline" class="compacto"><mat-label>Mes</mat-label>
            <mat-select [(ngModel)]="mes">@for (m of meses; track m) { <mat-option [value]="m">{{ m | mes: true }}</mat-option> }</mat-select>
          </mat-form-field>
          <button mat-flat-button (click)="cerrar(anio, mes)"><span class="material-symbols-outlined">lock</span> Cerrar período</button>
          <df-teoria [temas]="teoria" fuente="Control interno" />
        </div>
      </div>
      @if (cargando()) { <mat-progress-bar mode="indeterminate" /> }
      @if (error()) { <div class="aviso error">{{ error() }}</div> }
      <div class="tabla-scroll">
        <table class="estado">
          <thead><tr><th>Período</th><th>Movimientos</th><th>Estado</th><th>Cerrado el</th><th></th></tr></thead>
          <tbody>
            @for (p of periodos(); track p.anio + '-' + p.mes) {
              <tr>
                <td>{{ p.mes | mes: true }} {{ p.anio }}</td>
                <td class="num">{{ p.movimientos }}</td>
                <td class="centro"><span class="chip" [class]="p.estado === 'CERRADO' ? 'gris' : 'verde'">{{ p.estado === 'CERRADO' ? 'Cerrado' : 'Abierto' }}</span></td>
                <td class="num">{{ p.cerrado_en ? (p.cerrado_en | slice: 0 : 10) : '—' }}</td>
                <td class="centro">
                  @if (p.estado === 'ABIERTO') { <button mat-button (click)="cerrar(p.anio, p.mes)">Cerrar</button> }
                  @else if (esAdmin()) { <button mat-button (click)="abrir(p)">Reabrir</button> }
                </td>
              </tr>
            } @empty { <tr><td colspan="5" class="vacio">Sin períodos registrados</td></tr> }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class Periodos {
  private api = inject(ApiService);
  private aviso = inject(MatSnackBar);
  private auth = inject(AuthService);
  teoria = TEORIA_PERIODOS;
  meses = Array.from({ length: 12 }, (_, i) => i + 1);
  anio = new Date().getFullYear();
  mes = new Date().getMonth() + 1;
  periodos = signal<Periodo[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
  esAdmin = computed(() => this.auth.tieneRol(['ADMIN']));

  constructor() {
    this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    try {
      this.periodos.set(await this.api.get<Periodo[]>('/periodos'));
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  async cerrar(anio: number, mes: number) {
    try {
      await this.api.post(`/periodos/${anio}/${mes}/cerrar`, {});
      this.aviso.open('Período cerrado', 'OK', { duration: 2500 });
      this.cargar();
    } catch (e) {
      this.aviso.open(mensajeError(e), 'Cerrar', { duration: 6000 });
    }
  }

  async abrir(p: Periodo) {
    try {
      await this.api.post(`/periodos/${p.anio}/${p.mes}/abrir`, {});
      this.aviso.open('Período reabierto', 'OK', { duration: 2500 });
      this.cargar();
    } catch (e) {
      this.aviso.open(mensajeError(e), 'Cerrar', { duration: 6000 });
    }
  }
}
