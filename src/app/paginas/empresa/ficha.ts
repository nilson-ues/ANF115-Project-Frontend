import { SlicePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/api.service';
import { DineroPipe } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { TEORIA_EMPRESA } from '../../core/teoria-modulos';
import { TeoriaPanel } from '../../shared/teoria';

interface Empresa {
  razon_social: string; nombre_comercial: string; giro: string; direccion: string; fecha_constitucion: string;
  tipo_empresa: string; tamano: string; capital_social: string; numero_acciones: number; valor_nominal_accion: string;
  mision: string | null; vision: string | null;
}
interface Lineas { anio: number; lineas: { nombre: string; total?: string }[] }

// Clasificación BMI por ventas anuales (Unidad I, videoclase 10)
const TAMANOS = [
  { nombre: 'Microempresa', desde: 0, hasta: 68571.43, empleados: 'Máximo 10 personas' },
  { nombre: 'Pequeña empresa', desde: 68571.43, hasta: 685714.28, empleados: 'De 11 a 49 personas' },
  { nombre: 'Mediana empresa', desde: 685714.28, hasta: 4571000, empleados: 'De 50 a 199 empleados' },
  { nombre: 'Gran empresa', desde: 4571000, hasta: Infinity, empleados: 'Más de 199 personas' }
];

// Datos publicados en Pérez Tejada et al. (2009), capítulo II
const ACCIONISTAS = [
  { nombre: 'Dra. Luz Sofía López', acciones: 2532 },
  { nombre: 'Juan Miguel Amaya', acciones: 701 },
  { nombre: 'Eduardo David Cabrales', acciones: 579 }
];
const CLIENTES = ['Instituto Salvadoreño del Seguro Social', 'Hospital Nacional Santa Rosa', 'Hospital de la Mujer', 'Hospital Nacional Rosales', 'Hospital de Diagnóstico', 'Clínicas médicas', 'Farmacia Moderna'];
const PROVEEDORES = { locales: ['Droguería Santa Lucía, S.A. de C.V.', 'Droguería Americana, S.A. de C.V.', 'Alcon Centroamericana, S.A.'], exterior: ['Boston Scientific', 'Medical Components (MEDCOMP)'] };

@Component({
  selector: 'df-ficha-empresa',
  imports: [MatProgressBarModule, DineroPipe, TeoriaPanel, SlicePipe],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Ficha de la empresa</h1>
          <div class="sub">Datos generales, estructura organizativa y clasificación · Fuente: Pérez Tejada et al. (2009)</div>
        </div>
        <div class="acciones"><df-teoria [temas]="teoria" fuente="Unidad I · temas 10 y 12" /></div>
      </div>
      @if (cargando()) { <mat-progress-bar mode="indeterminate" /> }
      @if (error()) { <div class="aviso error">{{ error() }}</div> }

      @if (empresa(); as e) {
        <div class="dos-columnas">
          <div class="tarjeta">
            <h2>{{ e.razon_social }}</h2>
            <dl>
              <dt>Nombre comercial</dt><dd>{{ e.nombre_comercial }}</dd>
              <dt>Constitución</dt><dd>{{ e.fecha_constitucion | slice: 0 : 10 }} · San Salvador, plazo indefinido</dd>
              <dt>Giro</dt><dd>{{ e.giro }}</dd>
              <dt>Dirección</dt><dd>{{ e.direccion }}</dd>
              <dt>Capital social</dt><dd>{{ e.capital_social | dinero: true }} · {{ e.numero_acciones }} acciones de {{ e.valor_nominal_accion | dinero: true }}</dd>
            </dl>
            <h3>Misión</h3><p class="cita">{{ e.mision }}</p>
            <h3>Visión</h3><p class="cita">{{ e.vision }}</p>
          </div>
          <div class="tarjeta">
            <h2>Clasificación de la empresa</h2>
            <dl>
              <dt>Por su actividad económica</dt><dd>Comercial (comercio al por mayor de insumos médicos)</dd>
              <dt>Por sector</dt><dd>Sector terciario</dd>
              <dt>Por su tamaño (BMI)</dt><dd><b>{{ tamano()?.nombre ?? '—' }}</b> @if (ventas()) { · ventas netas {{ anioVentas() }}: {{ ventas() | dinero: true }} }</dd>
            </dl>
            <table class="estado tamanos">
              <thead><tr><th>Tamaño</th><th>Ventas anuales</th><th>Empleados</th></tr></thead>
              <tbody>
                @for (t of tamanos; track t.nombre) {
                  <tr [class.total]="t.nombre === tamano()?.nombre"><td>{{ t.nombre }}</td><td class="num">{{ rango(t) }}</td><td class="num">{{ t.empleados }}</td></tr>
                }
              </tbody>
            </table>
            <h3>Distribución accionaria</h3>
            <table class="estado">
              <thead><tr><th>Accionista</th><th>Acciones</th><th>Valor</th><th>%</th></tr></thead>
              <tbody>
                @for (a of accionistas; track a.nombre) {
                  <tr><td>{{ a.nombre }}</td><td class="num">{{ a.acciones }}</td><td class="num">{{ a.acciones * 100 | dinero: true }}</td><td class="num">{{ (a.acciones / 3812 * 100).toFixed(2) }}%</td></tr>
                }
                <tr class="subtotal"><td>Total</td><td class="num">3,812</td><td class="num">{{ 381200 | dinero: true }}</td><td class="num">100.00%</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="tarjeta seccion">
          <h2>Organigrama</h2>
          <div class="organigrama">
            <div class="nodo principal">Junta General de Accionistas</div>
            <div class="conector"></div>
            <div class="fila-staff">
              <div class="nodo staff">Auditor externo</div>
              <div class="nodo principal">Junta Directiva<br /><small>Representante legal</small></div>
              <div class="nodo staff">Abogado o asesor legal</div>
            </div>
            <div class="conector"></div>
            <div class="nodo principal">Gerencia General</div>
            <div class="conector"></div>
            <div class="fila-deptos">
              <div class="nodo">Departamento de Administración</div>
              <div class="nodo">Departamento de Ventas</div>
            </div>
          </div>
        </div>

        <div class="dos-columnas seccion">
          <div class="tarjeta">
            <h2>Principales clientes</h2>
            <ul>@for (c of clientes; track c) { <li>{{ c }}</li> }</ul>
          </div>
          <div class="tarjeta">
            <h2>Principales proveedores</h2>
            <h3>Locales</h3><ul>@for (p of proveedores.locales; track p) { <li>{{ p }}</li> }</ul>
            <h3>Del exterior</h3><ul>@for (p of proveedores.exterior; track p) { <li>{{ p }}</li> }</ul>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    dl { display: grid; grid-template-columns: 170px 1fr; gap: 6px 12px; margin: 0 0 8px; font-size: 13px; }
    dt { color: var(--df-muted); } dd { margin: 0; }
    h3 { font-size: 13px; margin: 16px 0 6px; color: var(--df-navy); }
    .cita { font-style: italic; line-height: 1.5; font-size: 13px; margin: 0; }
    table.estado td:first-child { min-width: 160px; }
    .tamanos { margin-top: 8px; }
    ul { margin: 0; padding-left: 18px; line-height: 1.7; font-size: 13px; }
    .organigrama { display: flex; flex-direction: column; align-items: center; padding: 8px 0; }
    .nodo { border: 1px solid var(--df-border); background: #f8fafc; border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 600; text-align: center; min-width: 200px; }
    .nodo.principal { background: var(--df-navy); color: white; border-color: var(--df-navy); }
    .nodo.staff { border-style: dashed; background: white; font-weight: 500; }
    .conector { width: 2px; height: 18px; background: var(--df-border); }
    .fila-staff, .fila-deptos { display: flex; gap: 28px; align-items: center; }
    small { font-weight: 400; opacity: 0.8; }
  `
})
export class FichaEmpresa {
  private api = inject(ApiService);
  teoria = TEORIA_EMPRESA;
  tamanos = TAMANOS;
  accionistas = ACCIONISTAS;
  clientes = CLIENTES;
  proveedores = PROVEEDORES;
  empresa = signal<Empresa | null>(null);
  ventas = signal<number | null>(null);
  anioVentas = signal<number | null>(null);
  cargando = signal(false);
  error = signal<string | null>(null);
  tamano = computed(() => {
    const v = this.ventas();
    return v === null ? null : TAMANOS.find((t) => v >= t.desde && v < t.hasta) ?? null;
  });

  constructor() {
    this.cargar();
  }

  rango(t: (typeof TAMANOS)[number]) {
    const f = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (t.desde === 0) return `Hasta ${f(t.hasta)}`;
    if (t.hasta === Infinity) return `Más de ${f(t.desde)}`;
    return `${f(t.desde)} a ${f(t.hasta)}`;
  }

  async cargar() {
    this.cargando.set(true);
    try {
      this.empresa.set(await this.api.get<Empresa>('/configuracion/empresa'));
      const periodos = await this.api.get<{ anio: number; escenario: string; meses: number }[]>('/estados/periodos').catch(() => []);
      const anios = periodos.filter((p) => p.escenario === 'REAL' && p.meses === 12).map((p) => p.anio);
      const anio = anios.length ? Math.max(...anios) : 2009;
      // el rol de ventas no consulta estados financieros; la clasificación queda sin cifra
      const er = await this.api.get<Lineas>('/estados/resultados', { anio }).catch(() => ({ anio, lineas: [] }) as Lineas);
      const ventas = er.lineas.find((l) => l.nombre === 'Ventas netas');
      if (ventas?.total) {
        this.ventas.set(Number(ventas.total));
        this.anioVentas.set(anio);
      }
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
