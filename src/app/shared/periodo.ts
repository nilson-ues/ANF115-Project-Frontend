import { Component, effect, inject, input, model, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../core/api.service';
import { MESES_LARGOS } from '../core/formato';

interface Periodo {
  anio: number;
  escenario: 'REAL' | 'PRESUPUESTO';
  meses: number;
  ultimo_mes: number;
}

@Component({
  selector: 'df-periodo',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatButtonToggleModule],
  template: `
    @if (conEscenario()) {
      <mat-button-toggle-group [ngModel]="escenario()" (ngModelChange)="escenario.set($event)" hideSingleSelectionIndicator>
        <mat-button-toggle value="REAL">Real</mat-button-toggle>
        <mat-button-toggle value="PRESUPUESTO">Presupuesto</mat-button-toggle>
      </mat-button-toggle-group>
    }
    <mat-form-field appearance="outline" class="compacto">
      <mat-label>Año</mat-label>
      <mat-select [ngModel]="anio()" (ngModelChange)="anio.set($event)">
        @for (a of anios(); track a) { <mat-option [value]="a">{{ a }}</mat-option> }
      </mat-select>
    </mat-form-field>
    @if (conMes()) {
      <mat-form-field appearance="outline" class="compacto">
        <mat-label>Hasta</mat-label>
        <mat-select [ngModel]="mes()" (ngModelChange)="mes.set($event)">
          <mat-option [value]="null">Año completo</mat-option>
          @for (m of meses; track $index) { <mat-option [value]="$index + 1">{{ m }}</mat-option> }
        </mat-select>
      </mat-form-field>
    }
  `,
  styles: `:host { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }`
})
export class SelectorPeriodo implements OnInit {
  private api = inject(ApiService);
  anio = model<number | null>(null);
  escenario = model<'REAL' | 'PRESUPUESTO'>('REAL');
  mes = model<number | null>(null);
  conEscenario = input(true);
  conMes = input(true);
  periodos = signal<Periodo[]>([]);
  anios = signal<number[]>([]);
  meses = MESES_LARGOS;

  constructor() {
    // Solo años con datos del escenario elegido; si el año actual no tiene, toma el más reciente
    effect(() => {
      const escenario = this.conEscenario() ? this.escenario() : 'REAL';
      const lista = [...new Set(this.periodos().filter((p) => p.escenario === escenario).map((p) => p.anio))].sort((a, b) => b - a);
      this.anios.set(lista);
      const anio = this.anio();
      if (lista.length && (anio === null || !lista.includes(anio))) this.anio.set(lista[0]);
    });
  }

  async ngOnInit() {
    this.periodos.set(await this.api.get<Periodo[]>('/estados/periodos'));
  }
}
