import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DineroPipe, PctPipe } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { Campo, CATALOGOS, DefinicionCatalogo } from './definiciones';

type Registro = Record<string, unknown> & { id?: number };

@Component({
  selector: 'df-catalogo',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatProgressBarModule, DineroPipe, PctPipe],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss'
})
export class Catalogo {
  private api = inject(ApiService);
  private aviso = inject(MatSnackBar);
  private auth = inject(AuthService);
  def: DefinicionCatalogo = CATALOGOS[inject(ActivatedRoute).snapshot.data['catalogo']];
  registros = signal<Registro[]>([]);
  filtro = signal('');
  cargando = signal(false);
  error = signal<string | null>(null);
  edicion = signal<Registro | null>(null);
  opciones = signal<Partial<Record<string, { valor: unknown; texto: string }[]>>>({});
  guardando = signal(false);
  puedeEscribir = computed(() => this.auth.tieneRol(this.def.escritura));

  visibles = computed(() => {
    const f = this.filtro().toLowerCase().trim();
    if (!f) return this.registros();
    return this.registros().filter((r) => this.def.columnas.some((c) => String(r[c.clave] ?? '').toLowerCase().includes(f)));
  });

  constructor() {
    this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    try {
      this.registros.set(await this.api.get<Registro[]>(this.def.ruta));
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  async abrir(registro?: Registro) {
    const base = registro ? { ...registro } : { ...this.def.nuevo };
    for (const c of this.def.campos) {
      if (c.tipo === 'porcentaje' && base[c.clave] !== null && base[c.clave] !== undefined) base[c.clave] = +(Number(base[c.clave]) * 100).toFixed(4);
      if ((c.tipo === 'dinero' || c.tipo === 'numero') && base[c.clave] !== null) base[c.clave] = Number(base[c.clave]);
    }
    const mapa: Record<string, { valor: unknown; texto: string }[]> = {};
    for (const c of this.def.campos) {
      if (c.opciones) mapa[c.clave] = c.opciones.map((o) => ({ valor: o.valor, texto: o.texto }));
      if (c.origen) {
        const filas = await this.api.get<Record<string, unknown>[]>(c.origen.ruta);
        const lista = filas.filter((f) => (c.origen!.filtro ? c.origen!.filtro(f) : true) && f['id'] !== registro?.id);
        mapa[c.clave] = [...(c.requerido ? [] : [{ valor: null, texto: '— Ninguna —' }]), ...lista.map((f) => ({ valor: f['id'], texto: String(f[c.origen!.texto]) }))];
      }
    }
    this.opciones.set(mapa);
    this.edicion.set(base);
  }

  async guardar() {
    const r = this.edicion();
    if (!r) return;
    const cuerpo: Record<string, unknown> = {};
    for (const c of this.def.campos) {
      let v = r[c.clave];
      if (c.tipo === 'porcentaje') v = Number(v ?? 0) / 100;
      cuerpo[c.clave] = v;
    }
    this.guardando.set(true);
    try {
      if (r.id) await this.api.put(`${this.def.ruta}/${r.id}`, cuerpo);
      else await this.api.post(this.def.ruta, cuerpo);
      this.aviso.open(`${this.def.singular[0].toUpperCase()}${this.def.singular.slice(1)} guardado`, 'OK', { duration: 2500 });
      this.edicion.set(null);
      this.cargar();
    } catch (e) {
      this.aviso.open(mensajeError(e), 'Cerrar', { duration: 6000 });
    } finally {
      this.guardando.set(false);
    }
  }

  numero(v: unknown) {
    return v === null || v === undefined ? null : Number(v);
  }

  faltantes(r: Registro) {
    return this.def.campos.some((c: Campo) => c.requerido && (r[c.clave] === null || r[c.clave] === undefined || r[c.clave] === ''));
  }
}
