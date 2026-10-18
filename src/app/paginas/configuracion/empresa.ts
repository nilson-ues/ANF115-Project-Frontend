import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/interceptores';

interface Parametro { clave: string; nombre: string; grupo: string; unidad: string; valor: string | null; descripcion: string | null; edicion?: number | null }
interface Estandar { clave: string; nombre: string; categoria: string; unidad: string; valor: string | null; fuente: string | null; edicion?: number | null }

const CAMPOS_EMPRESA = [
  { clave: 'razon_social', etiqueta: 'Razón social', ancho: true },
  { clave: 'nombre_comercial', etiqueta: 'Nombre comercial' },
  { clave: 'tipo_empresa', etiqueta: 'Tipo de sociedad' },
  { clave: 'giro', etiqueta: 'Giro', ancho: true },
  { clave: 'direccion', etiqueta: 'Dirección', ancho: true },
  { clave: 'fecha_constitucion', etiqueta: 'Fecha de constitución', tipo: 'date' },
  { clave: 'tamano', etiqueta: 'Tamaño' },
  { clave: 'capital_social', etiqueta: 'Capital social', tipo: 'number' },
  { clave: 'capital_minimo', etiqueta: 'Capital mínimo', tipo: 'number' },
  { clave: 'capital_variable', etiqueta: 'Capital variable', tipo: 'number' },
  { clave: 'numero_acciones', etiqueta: 'Número de acciones', tipo: 'number' },
  { clave: 'valor_nominal_accion', etiqueta: 'Valor nominal por acción', tipo: 'number' },
  { clave: 'mision', etiqueta: 'Misión', ancho: true, area: true },
  { clave: 'vision', etiqueta: 'Visión', ancho: true, area: true }
];

@Component({
  selector: 'df-empresa',
  imports: [FormsModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './empresa.html',
  styleUrl: './empresa.scss'
})
export class ConfiguracionEmpresa {
  private api = inject(ApiService);
  private aviso = inject(MatSnackBar);
  auth = inject(AuthService);
  campos = CAMPOS_EMPRESA;
  empresa = signal<Record<string, unknown> | null>(null);
  parametros = signal<Parametro[]>([]);
  estandares = signal<Estandar[]>([]);
  error = signal<string | null>(null);
  esAdmin = computed(() => this.auth.tieneRol(['ADMIN']));
  editaFinanzas = computed(() => this.auth.tieneRol(['ADMIN', 'FINANZAS']));
  grupos = computed(() => [...new Set(this.parametros().map((p) => p.grupo))].map((g) => ({ nombre: g, items: this.parametros().filter((p) => p.grupo === g) })));

  constructor() {
    this.cargar();
  }

  async cargar() {
    try {
      const [e, p, s] = await Promise.all([
        this.api.get<Record<string, unknown>>('/configuracion/empresa'),
        this.api.get<Parametro[]>('/configuracion/parametros'),
        this.api.get<Estandar[]>('/configuracion/estandares')
      ]);
      e['fecha_constitucion'] = String(e['fecha_constitucion'] ?? '').slice(0, 10);
      this.empresa.set(e);
      this.parametros.set(p.map((x) => ({ ...x, edicion: this.aPantalla(x.valor, x.unidad) })));
      this.estandares.set(s.map((x) => ({ ...x, edicion: this.aPantalla(x.valor, x.unidad === 'porcentaje' ? '%' : 'num') })));
    } catch (e) {
      this.error.set(mensajeError(e));
    }
  }

  aPantalla(valor: string | null, unidad: string) {
    if (valor === null) return null;
    return unidad === '%' ? +(Number(valor) * 100).toFixed(4) : Number(valor);
  }

  desdePantalla(valor: number | null | undefined, unidad: string) {
    if (valor === null || valor === undefined || (valor as unknown) === '') return null;
    return unidad === '%' ? Number(valor) / 100 : Number(valor);
  }

  async guardarEmpresa() {
    try {
      await this.api.put('/configuracion/empresa', this.empresa());
      this.aviso.open('Datos de la empresa guardados', 'OK', { duration: 2500 });
    } catch (e) {
      this.aviso.open(mensajeError(e), 'Cerrar', { duration: 6000 });
    }
  }

  async guardarParametros() {
    try {
      await this.api.put('/configuracion/parametros', this.parametros().map((p) => ({ clave: p.clave, valor: this.desdePantalla(p.edicion, p.unidad) })));
      this.aviso.open('Parámetros guardados. Los cálculos ya usan los nuevos valores.', 'OK', { duration: 3000 });
      this.cargar();
    } catch (e) {
      this.aviso.open(mensajeError(e), 'Cerrar', { duration: 6000 });
    }
  }

  async guardarEstandares() {
    try {
      await this.api.put('/configuracion/estandares', this.estandares().map((s) => ({
        clave: s.clave,
        valor: this.desdePantalla(s.edicion, s.unidad === 'porcentaje' ? '%' : 'num'),
        fuente: s.fuente
      })));
      this.aviso.open('Estándares de la industria guardados', 'OK', { duration: 2500 });
      this.cargar();
    } catch (e) {
      this.aviso.open(mensajeError(e), 'Cerrar', { duration: 6000 });
    }
  }

  unidadEstandar(u: string) {
    return { veces: 'veces', dias: 'días', dinero: '$', porcentaje: '%' }[u] ?? '';
  }
}
