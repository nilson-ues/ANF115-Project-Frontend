import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';
import { TablaExport } from '../../core/exportar';
import { DineroPipe, formatoDinero } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { TEORIA_CREDITO } from '../../core/teoria-modulos';
import { Exportar } from '../../shared/exportar';
import { TeoriaPanel } from '../../shared/teoria';

interface Credito {
  rotacionAnterior: number; rotacionNueva: number; ventasAdicionales: string; rentabilidadVentasAdicionales: string;
  cxcAdicionalesNuevas: string; inversionNuevas: string; cxcAntes: string; cxcOriginalesNuevo: string; inversionOriginales: string;
  inversionTotal: string; rendimientoRequerido: string; beneficioNeto: string; conviene: boolean;
}

const GUIA_2 = { ventasCredito: 60000000, periodoCobroActual: 45, periodoCobroNuevo: 75, incrementoVentas: 15, costoVariable: 80, rendimientoRequerido: 20, diasAnio: 360 };

@Component({
  selector: 'df-credito',
  imports: [FormsModule, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule, DineroPipe, Exportar, TeoriaPanel],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Política de crédito y cobranza</h1>
          <div class="sub">¿Conviene cambiar el periodo de crédito? Rentabilidad de las ventas adicionales frente al costo de la inversión adicional en cuentas por cobrar</div>
        </div>
        <div class="acciones">
          @if (r()) { <df-exportar [tablas]="exportar" archivo="politica-credito" /> }
          <df-teoria [temas]="teoria" fuente="Unidad IV · Guía práctica 2" />
        </div>
      </div>

      <div class="tarjeta">
        <div class="cabecera"><h2>Datos</h2><button mat-stroked-button (click)="cargarGuia()">Cargar Guía práctica 2</button></div>
        <div class="campos-credito">
          <mat-form-field appearance="outline"><mat-label>Ventas a crédito anuales</mat-label><input matInput type="number" [(ngModel)]="d.ventasCredito" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Periodo de cobro actual (días)</mat-label><input matInput type="number" [(ngModel)]="d.periodoCobroActual" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Periodo de cobro nuevo (días)</mat-label><input matInput type="number" [(ngModel)]="d.periodoCobroNuevo" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Aumento esperado de ventas (%)</mat-label><input matInput type="number" [(ngModel)]="d.incrementoVentas" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Costo variable por $1 de ventas (%)</mat-label><input matInput type="number" [(ngModel)]="d.costoVariable" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Rendimiento requerido antes de impuestos (%)</mat-label><input matInput type="number" [(ngModel)]="d.rendimientoRequerido" /></mat-form-field>
          <mat-button-toggle-group [(ngModel)]="d.diasAnio" hideSingleSelectionIndicator>
            <mat-button-toggle [value]="360">Año de 360 días</mat-button-toggle><mat-button-toggle [value]="365">365 días</mat-button-toggle>
          </mat-button-toggle-group>
          <button mat-flat-button (click)="calcular()"><span class="material-symbols-outlined">calculate</span> Calcular</button>
        </div>
      </div>

      @if (r(); as x) {
        <div class="aviso seccion" [class.ok]="x.conviene" [class.error]="!x.conviene">
          <b>{{ x.conviene ? 'Sí conviene extender el periodo de crédito.' : 'No conviene cambiar el periodo de crédito.' }}</b>
          La rentabilidad de las ventas adicionales ({{ x.rentabilidadVentasAdicionales | dinero: true }}) {{ x.conviene ? 'supera' : 'no supera' }} el rendimiento requerido sobre la inversión adicional ({{ x.rendimientoRequerido | dinero: true }}); beneficio neto {{ x.beneficioNeto | dinero: true }}.
        </div>
        <div class="tabla-scroll">
          <table class="estado">
            <thead><tr><th>Inciso</th><th class="izq">Cálculo</th><th>Resultado</th></tr></thead>
            <tbody>
              @for (f of filas(); track f.inciso) {
                <tr [class.subtotal]="f.destacar"><td>{{ f.inciso }}) {{ f.nombre }}</td><td class="formula">{{ f.formula }}</td><td class="num">{{ f.valor }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: `
    .cabecera { display: flex; justify-content: space-between; align-items: center; h2 { margin: 0; } }
    .campos-credito { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 12px; align-items: center; margin-top: 14px; }
    td.formula { color: var(--df-muted); font-family: Menlo, monospace; font-size: 12px; }
    table.estado td:first-child { min-width: 320px; }
    @media (max-width: 1100px) { .campos-credito { grid-template-columns: 1fr 1fr; } }
  `
})
export class PoliticaCredito {
  private api = inject(ApiService);
  private aviso = inject(MatSnackBar);
  teoria = TEORIA_CREDITO;
  d = { ...GUIA_2 };
  r = signal<Credito | null>(null);
  filas = signal<{ inciso: string; nombre: string; formula: string; valor: string; destacar?: boolean }[]>([]);

  constructor() {
    this.calcular();
  }

  cargarGuia() {
    this.d = { ...GUIA_2 };
    this.calcular();
  }

  async calcular() {
    try {
      const x = await this.api.post<Credito>('/circulante/credito', {
        ventasCredito: Number(this.d.ventasCredito), periodoCobroActual: Number(this.d.periodoCobroActual), periodoCobroNuevo: Number(this.d.periodoCobroNuevo),
        incrementoVentas: Number(this.d.incrementoVentas) / 100, costoVariable: Number(this.d.costoVariable) / 100,
        rendimientoRequerido: Number(this.d.rendimientoRequerido) / 100, diasAnio: Number(this.d.diasAnio)
      });
      this.r.set(x);
      const $ = (v: string) => formatoDinero(v, true);
      const dias = this.d.diasAnio;
      this.filas.set([
        { inciso: 'a', nombre: 'Rotación de cuentas por cobrar anterior', formula: `${dias} / ${this.d.periodoCobroActual}`, valor: `${x.rotacionAnterior.toFixed(2)} veces` },
        { inciso: 'b', nombre: 'Rotación de las nuevas cuentas por cobrar', formula: `${dias} / ${this.d.periodoCobroNuevo}`, valor: `${x.rotacionNueva.toFixed(2)} veces` },
        { inciso: 'c', nombre: 'Rentabilidad de ventas adicionales', formula: `${$(x.ventasAdicionales)} × (1 − ${this.d.costoVariable}%)`, valor: $(x.rentabilidadVentasAdicionales), destacar: true },
        { inciso: 'd', nombre: 'CxC adicionales asociadas con las nuevas ventas', formula: `${$(x.ventasAdicionales)} / ${x.rotacionNueva.toFixed(2)}`, valor: $(x.cxcAdicionalesNuevas) },
        { inciso: 'e', nombre: 'Inversión en CxC adicionales (nuevas ventas)', formula: `${$(x.cxcAdicionalesNuevas)} × ${this.d.costoVariable}%`, valor: $(x.inversionNuevas) },
        { inciso: 'f', nombre: 'Nivel de CxC antes del cambio', formula: `${$(String(this.d.ventasCredito))} / ${x.rotacionAnterior.toFixed(2)}`, valor: $(x.cxcAntes) },
        { inciso: 'g', nombre: 'Nuevo nivel de CxC de las ventas originales', formula: `${$(String(this.d.ventasCredito))} / ${x.rotacionNueva.toFixed(2)}`, valor: $(x.cxcOriginalesNuevo) },
        { inciso: 'h', nombre: 'Inversión en CxC adicionales (ventas originales)', formula: `${$(x.cxcOriginalesNuevo)} − ${$(x.cxcAntes)}`, valor: $(x.inversionOriginales) },
        { inciso: 'i', nombre: 'Inversión total en CxC adicionales', formula: `${$(x.inversionNuevas)} + ${$(x.inversionOriginales)}`, valor: $(x.inversionTotal) },
        { inciso: 'j', nombre: 'Rendimiento requerido sobre la inversión adicional', formula: `${$(x.inversionTotal)} × ${this.d.rendimientoRequerido}%`, valor: $(x.rendimientoRequerido), destacar: true },
        { inciso: 'k', nombre: 'Análisis: beneficio neto del cambio', formula: `${$(x.rentabilidadVentasAdicionales)} − ${$(x.rendimientoRequerido)}`, valor: $(x.beneficioNeto), destacar: true }
      ]);
    } catch (e) {
      this.aviso.open(mensajeError(e), 'Cerrar', { duration: 6000 });
    }
  }

  exportar = (): TablaExport[] => [{
    titulo: 'Análisis de la política de crédito',
    subtitulo: this.r()?.conviene ? 'Conclusión: conviene extender el periodo de crédito' : 'Conclusión: no conviene cambiar el periodo de crédito',
    columnas: [{ titulo: 'Inciso', clave: 'nombre' }, { titulo: 'Cálculo', clave: 'formula' }, { titulo: 'Resultado', clave: 'valor' }],
    filas: this.filas().map((f) => ({ ...f, nombre: `${f.inciso}) ${f.nombre}` }))
  }];
}
