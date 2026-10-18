import { Directive, effect, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { PeriodoService } from '../../core/periodo.service';
import { mensajeError } from '../../core/interceptores';

@Directive()
export abstract class PaginaPeriodo<T> {
  protected api = inject(ApiService);
  private periodo = inject(PeriodoService);
  anio = this.periodo.anio;
  escenario = this.periodo.escenario;
  mes = this.periodo.mes;
  datos = signal<T | null>(null);
  error = signal<string | null>(null);
  cargando = signal(false);
  abstract ruta: string;

  constructor() {
    effect(() => {
      const anio = this.anio();
      const escenario = this.escenario();
      const mes = this.mes();
      if (anio !== null) this.cargar(anio, escenario, mes);
    });
  }

  private async cargar(anio: number, escenario: string, mes: number | null) {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.datos.set(await this.api.get<T>(this.ruta, { anio, escenario, mes }));
    } catch (e) {
      this.datos.set(null);
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
