import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ApiService } from '../../core/api.service';
import { DineroPipe, MESES, MesPipe, PctPipe, RazonPipe } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { TeoriaPanel } from '../../shared/teoria';

interface Razon {
  clave: string;
  nombre: string;
  categoria: string;
  decision: string;
  unidad: string;
  formula: string;
  interpretacion: string;
  valor: number | null;
  anterior: number | null;
  presupuesto: number | null;
  estandar: number | null;
  referencia: string;
  semaforo: string;
}

interface Tablero {
  empresa: { nombre: string; razonSocial: string; tamano: string };
  anios: number[];
  anio: number;
  hastaMes: number;
  kpis: Record<string, string | null>;
  ventasMes: { mes: number; real: string | null; presupuesto: string | null; anterior: string | null }[];
  efectivoMes: { mes: number; efectivo: string }[];
  composicionActivoCorriente: { nombre: string; monto: string }[];
  razones: Razon[];
  supervivencia: { roa: number | null; costoCapital: number | null; cumple: boolean | null; titulo: string; formula: string; texto: string; fuente: string };
}

const DECISIONES = [
  { nombre: 'Administración de bienes', descripcion: 'Liquidez y eficiencia en el uso de los activos' },
  { nombre: 'Financiamiento', descripcion: 'Uso de deuda y capacidad de pago' },
  { nombre: 'Inversión', descripcion: 'Rentabilidad que generan los recursos invertidos' }
];

const COLORES = { real: '#0f766e', ppto: '#94a3b8', anterior: '#c7d2fe', linea: '#0f2a44' };

@Component({
  selector: 'df-dashboard',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatTooltipModule, BaseChartDirective, DineroPipe, RazonPipe, PctPipe, MesPipe, TeoriaPanel],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private api = inject(ApiService);
  datos = signal<Tablero | null>(null);
  error = signal<string | null>(null);
  anio = signal<number | null>(null);
  decisiones = DECISIONES;

  razonesPor = (decision: string) => this.datos()?.razones.filter((r) => r.decision === decision) ?? [];

  avanceVentas = computed(() => {
    const k = this.datos()?.kpis;
    return k?.['ventasPresupuesto'] ? Number(k['ventasNetas']) / Number(k['ventasPresupuesto']) : null;
  });

  teoria = computed(() => {
    const d = this.datos();
    if (!d) return [];
    return [d.supervivencia, ...d.razones.map((r) => ({ titulo: r.nombre, formula: r.formula, texto: r.interpretacion, fuente: `${r.categoria} · decisión de ${r.decision.toLowerCase()}` }))];
  });

  graficoVentas = computed<ChartConfiguration<'bar'>['data']>(() => {
    const v = this.datos()?.ventasMes ?? [];
    return {
      labels: MESES,
      datasets: [
        { label: 'Real', data: v.map((m) => (m.real === null ? null : Number(m.real))) as number[], backgroundColor: COLORES.real, borderRadius: 4 },
        { label: 'Presupuesto', data: v.map((m) => (m.presupuesto === null ? null : Number(m.presupuesto))) as number[], backgroundColor: COLORES.ppto, borderRadius: 4 },
        { label: 'Año anterior', data: v.map((m) => (m.anterior === null ? null : Number(m.anterior))) as number[], backgroundColor: COLORES.anterior, borderRadius: 4 }
      ]
    };
  });

  graficoActivo = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const c = this.datos()?.composicionActivoCorriente ?? [];
    return {
      labels: c.map((x) => x.nombre),
      datasets: [{ data: c.map((x) => Number(x.monto)), backgroundColor: ['#0f766e', '#2563eb', '#f59e0b', '#cbd5e1'], borderWidth: 0 }]
    };
  });

  graficoEfectivo = computed<ChartConfiguration<'line'>['data']>(() => {
    const e = this.datos()?.efectivoMes ?? [];
    return {
      labels: e.map((x) => MESES[x.mes - 1]),
      datasets: [{ label: 'Efectivo y equivalentes', data: e.map((x) => Number(x.efectivo)), borderColor: COLORES.linea, backgroundColor: 'rgba(15,118,110,0.12)', fill: true, tension: 0.3, pointRadius: 3 }]
    };
  });

  opcionesBarras: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
    scales: { y: { ticks: { callback: (v) => `$${Number(v) / 1000}k` }, grid: { color: '#eef1f5' } }, x: { grid: { display: false } } }
  };
  opcionesDona: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
  };
  opcionesLinea: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { ticks: { callback: (v) => `$${Number(v) / 1000}k` }, grid: { color: '#eef1f5' } }, x: { grid: { display: false } } }
  };

  constructor() {
    effect(() => {
      this.cargar(this.anio());
    });
  }

  async cargar(anio: number | null) {
    try {
      this.error.set(null);
      const d = await this.api.get<Tablero>('/dashboard', { anio });
      this.datos.set(d);
    } catch (e) {
      this.error.set(mensajeError(e));
    }
  }
}
