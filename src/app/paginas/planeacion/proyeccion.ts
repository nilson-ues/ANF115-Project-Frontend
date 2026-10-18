import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DineroPipe, MESES, MesPipe, PctPipe } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { FilaMensual, TablaMensual } from '../../shared/tabla-mensual';
import { Teoria, TeoriaPanel } from '../../shared/teoria';

interface Proyeccion {
  anio: number;
  base: { anio: number; ventasNetas: string; inventarioFinal: string; reservaLegal: string };
  supuestos: {
    crecimiento: number; costoVentasPct: number; gastosVentaPct: number; gastosAdministracionPct: number; gastosFinancierosMes: number;
    meses: { mes: number; inflacion: number; comprasPct: number }[];
  };
  lineas: (FilaMensual & { clave: string })[];
  rotacionInventario: (number | null)[];
  teoria: Teoria;
}

const PLANEACION: Teoria = {
  titulo: 'Planeación financiera y estados pro forma',
  formula: 'Pronóstico de ventas → Compras e inventario → Gastos → Estado de resultados pro forma',
  texto: 'La planeación financiera fija planes a corto plazo (1 a 2 años) y a largo plazo (2 a 5 años). Sus dos elementos clave son la planeación del efectivo (presupuesto de caja) y la planeación de utilidades (estados pro forma). Inventario final = Inventario inicial + Compras − Costo de ventas.',
  fuente: 'Unidad III - Planeación financiera'
};

@Component({
  selector: 'df-proyeccion',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressBarModule, BaseChartDirective, TablaMensual, TeoriaPanel, DineroPipe, PctPipe, MesPipe],
  templateUrl: './proyeccion.html',
  styleUrl: './proyeccion.scss'
})
export class ProyeccionPresupuesto {
  private api = inject(ApiService);
  private aviso = inject(MatSnackBar);
  auth = inject(AuthService);
  anio = signal(2010);
  datos = signal<Proyeccion | null>(null);
  error = signal<string | null>(null);
  cargando = signal(false);
  editando = signal(false);
  supuestos = signal<{ mes: number; inflacion: number; compras: number }[]>([]);
  meses = Array.from({ length: 12 }, (_, i) => i + 1);

  grafico = computed<ChartConfiguration<'bar' | 'line'>['data']>(() => {
    const d = this.datos();
    const linea = (clave: string) => d?.lineas.find((l) => l.clave === clave)?.valores.map(Number) ?? [];
    return {
      labels: MESES,
      datasets: [
        { type: 'bar', label: 'Ventas netas', data: linea('ventasNetas'), backgroundColor: '#0f766e', borderRadius: 4, yAxisID: 'y' },
        { type: 'bar', label: 'Compras', data: linea('compras'), backgroundColor: '#94a3b8', borderRadius: 4, yAxisID: 'y' },
        { type: 'line', label: 'Inventario final', data: linea('inventarioFinal'), borderColor: '#f59e0b', backgroundColor: '#f59e0b', tension: 0.3, yAxisID: 'y' }
      ]
    };
  });

  opciones: ChartConfiguration<'bar' | 'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
    scales: { y: { ticks: { callback: (v) => `$${Number(v) / 1000}k` }, grid: { color: '#eef1f5' } }, x: { grid: { display: false } } }
  };

  teorias = computed(() => (this.datos() ? [PLANEACION, this.datos()!.teoria] : [PLANEACION]));

  constructor() {
    effect(() => {
      this.cargar(this.anio());
    });
  }

  async cargar(anio: number) {
    if (!anio || anio < 2000) return;
    this.cargando.set(true);
    this.error.set(null);
    try {
      const d = await this.api.get<Proyeccion>(`/presupuesto/proyeccion/${anio}`);
      this.datos.set(d);
      this.supuestos.set(d.supuestos.meses.map((m) => ({ mes: m.mes, inflacion: +(m.inflacion * 100).toFixed(2), compras: +(m.comprasPct * 100).toFixed(2) })));
    } catch (e) {
      this.datos.set(null);
      this.error.set(mensajeError(e));
      this.supuestos.set(this.meses.map((mes) => ({ mes, inflacion: 0, compras: 15 })));
    } finally {
      this.cargando.set(false);
    }
  }

  async guardar() {
    try {
      await this.api.put(`/presupuesto/supuestos/${this.anio()}`, this.supuestos().map((s) => ({ mes: s.mes, inflacion: s.inflacion / 100, compras_pct: s.compras / 100 })));
      this.editando.set(false);
      this.aviso.open('Supuestos guardados. Proyección recalculada.', 'OK', { duration: 3000 });
      this.cargar(this.anio());
    } catch (e) {
      this.aviso.open(mensajeError(e), 'Cerrar', { duration: 5000 });
    }
  }
}
