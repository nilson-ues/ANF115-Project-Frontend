import { Component, effect, inject, signal } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/api.service';
import { TablaExport } from '../../core/exportar';
import { DineroPipe } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { PeriodoService } from '../../core/periodo.service';
import { TEORIA_NOTAS } from '../../core/teoria-modulos';
import { Exportar } from '../../shared/exportar';
import { SelectorPeriodo } from '../../shared/periodo';
import { TeoriaPanel } from '../../shared/teoria';

interface Balance { meses: number[]; filas: { codigo: string; nombre: string; valores: string[] }[] }
interface Resultados { lineas: { clave: string; nombre: string; total: string }[] }
interface Parametro { clave: string; valor: string | null }
interface Empresa { razon_social: string; giro: string; direccion: string; fecha_constitucion: string; capital_social: string; numero_acciones: number; valor_nominal_accion: string }

interface Partida { nombre: string; actual: string | null; anterior: string | null }
interface Nota { numero: number; titulo: string; parrafos: string[]; partidas?: Partida[] }

@Component({
  selector: 'df-notas',
  imports: [MatProgressBarModule, SelectorPeriodo, TeoriaPanel, DineroPipe, Exportar],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Notas a los estados financieros</h1>
          <div class="sub">Al 31 de diciembre de {{ anio() }} y {{ (anio() ?? 0) - 1 }} · Cifras en dólares de los Estados Unidos de América</div>
        </div>
        <div class="acciones">
          <df-periodo [(anio)]="anio" [conEscenario]="false" [conMes]="false" />
          @if (notas().length) { <df-exportar [tablas]="exportar" [archivo]="'notas-' + anio()" /> }
          <df-teoria [temas]="teoria" fuente="Unidad I · NIIF para las PYMES, Sección 8" />
        </div>
      </div>
      @if (cargando()) { <mat-progress-bar mode="indeterminate" /> }
      @if (error()) { <div class="aviso error">{{ error() }}</div> }

      @for (n of notas(); track n.numero) {
        <div class="tarjeta nota">
          <h2>Nota {{ n.numero }}. {{ n.titulo }}</h2>
          @for (p of n.parrafos; track $index) { <p>{{ p }}</p> }
          @if (n.partidas?.length) {
            <table class="estado">
              <thead><tr><th>Concepto</th><th>{{ anio() }}</th><th>{{ (anio() ?? 0) - 1 }}</th><th>Variación</th></tr></thead>
              <tbody>
                @for (p of n.partidas; track p.nombre) {
                  <tr><td>{{ p.nombre }}</td><td class="num">{{ p.actual | dinero }}</td><td class="num">{{ p.anterior | dinero }}</td>
                    <td class="num">{{ p.actual !== null && p.anterior !== null ? (+p.actual - +p.anterior | dinero) : '—' }}</td></tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .nota { margin-bottom: 14px; }
    p { line-height: 1.6; font-size: 13px; margin: 6px 0; text-align: justify; }
    table.estado { margin-top: 8px; }
  `
})
export class NotasEstados {
  private api = inject(ApiService);
  private periodo = inject(PeriodoService);
  teoria = TEORIA_NOTAS;
  anio = this.periodo.anio;
  notas = signal<Nota[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const a = this.anio();
      if (a !== null) this.cargar(a);
    });
  }

  async cargar(anio: number) {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const opcional = <T>(p: Promise<T>) => p.catch(() => null);
      const [empresa, parametros, bal, balAnt, er, erAnt] = await Promise.all([
        this.api.get<Empresa>('/configuracion/empresa'),
        this.api.get<Parametro[]>('/configuracion/parametros'),
        this.api.get<Balance>('/estados/balance', { anio }),
        opcional(this.api.get<Balance>('/estados/balance', { anio: anio - 1 })),
        this.api.get<Resultados>('/estados/resultados', { anio }),
        opcional(this.api.get<Resultados>('/estados/resultados', { anio: anio - 1 }))
      ]);
      this.notas.set(this.construir(anio, empresa, parametros, bal, balAnt, er, erAnt));
    } catch (e) {
      this.notas.set([]);
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  private construir(anio: number, e: Empresa, parametros: Parametro[], bal: Balance, balAnt: Balance | null, er: Resultados, erAnt: Resultados | null): Nota[] {
    const pct = (clave: string) => {
      const v = parametros.find((p) => p.clave === clave)?.valor;
      return v === null || v === undefined ? '—' : `${(Number(v) * 100).toFixed(0)} %`;
    };
    const plazo = parametros.find((p) => p.clave === 'plazo_credito_clientes')?.valor ?? '30';
    const saldo = (b: Balance | null, codigo: string) => {
      const f = b?.filas.find((x) => x.codigo === codigo);
      return f ? f.valores[f.valores.length - 1] : null;
    };
    const partida = (codigo: string, nombre?: string): Partida => ({
      nombre: nombre ?? bal.filas.find((f) => f.codigo === codigo)?.nombre ?? codigo,
      actual: saldo(bal, codigo), anterior: saldo(balAnt, codigo)
    });
    const linea = (clave: string): Partida => ({
      nombre: er.lineas.find((l) => l.clave === clave)?.nombre.replace(/^\([-+]\) /, '') ?? clave,
      actual: er.lineas.find((l) => l.clave === clave)?.total ?? null,
      anterior: erAnt?.lineas.find((l) => l.clave === clave)?.total ?? null
    });

    return [
      {
        numero: 1, titulo: 'Información general de la entidad',
        parrafos: [
          `${e.razon_social} se constituyó el ${e.fecha_constitucion.slice(0, 10)} en San Salvador, con plazo de operaciones indefinido. Su finalidad es ${e.giro.toLowerCase()}. Sus oficinas se ubican en ${e.direccion}.`,
          'Es una empresa comercial del sector terciario, clasificada como mediana empresa según el Banco Multisectorial de Inversiones por su nivel de ventas.'
        ]
      },
      {
        numero: 2, titulo: 'Bases de preparación',
        parrafos: [
          'Los estados financieros se han elaborado cumpliendo con la Norma Internacional de Información Financiera para Pequeñas y Medianas Entidades (NIIF para las PYMES), sobre la base del costo histórico.',
          `Comprenden el estado de situación financiera, el estado de resultados, el estado de cambios en el patrimonio y el estado de flujos de efectivo del período del 1 de enero al 31 de diciembre de ${anio}, presentados de forma comparativa con ${anio - 1}. La moneda funcional y de presentación es el dólar de los Estados Unidos de América.`
        ]
      },
      {
        numero: 3, titulo: 'Resumen de las políticas contables significativas',
        parrafos: [
          'Efectivo y equivalentes: incluye caja, depósitos bancarios a la vista e inversiones de alta liquidez con vencimiento de tres meses o menos.',
          `Cuentas por cobrar: se reconocen al valor de la factura. El plazo de crédito de referencia para los clientes es de ${Number(plazo).toFixed(0)} días; los saldos se supervisan con el periodo promedio de cobro.`,
          'Inventarios: se valúan al menor entre el costo y el precio de venta estimado menos los costos de terminación y venta; el costo se determina por el método de costo promedio. Las mercancías compradas al exterior que aún no se reciben se presentan como inventario en tránsito.',
          'Propiedad, planta y equipo: se registran al costo menos la depreciación acumulada.',
          'Reconocimiento de ingresos: los ingresos por venta de bienes se reconocen cuando se transfieren los riesgos y beneficios al comprador, netos de rebajas y devoluciones.',
          `Reserva legal: se separa el ${pct('reserva_legal')} de la utilidad antes de impuesto y reserva, hasta alcanzar la quinta parte (${pct('reserva_legal_limite')}) del capital social. Impuesto sobre la renta: tasa del ${pct('isr')} sobre la utilidad después de la reserva legal. IVA: ${pct('iva')}.`
        ]
      },
      { numero: 4, titulo: 'Efectivo y equivalentes', parrafos: ['Saldo disponible en caja y bancos al cierre del período.'], partidas: [partida('1101')] },
      {
        numero: 5, titulo: 'Cuentas por cobrar', parrafos: ['Saldos a cargo de clientes institucionales (ISSS, hospitales nacionales) y privados por ventas al crédito, además de otras cuentas por cobrar de corto plazo.'],
        partidas: [partida('1102'), partida('1104')]
      },
      {
        numero: 6, titulo: 'Inventarios', parrafos: ['Insumos médicos, instrumental quirúrgico y productos vasculares disponibles para la venta, y mercancías en tránsito desde el exterior.'],
        partidas: [partida('1105'), partida('1106')]
      },
      { numero: 7, titulo: 'Propiedad, planta y equipo', parrafos: ['Mobiliario, equipo y vehículos utilizados en la operación, netos de depreciación acumulada.'], partidas: [partida('1201')] },
      {
        numero: 8, titulo: 'Préstamos y cuentas por pagar', parrafos: ['Obligaciones con instituciones bancarias y con proveedores locales y del exterior.'],
        partidas: [partida('2101'), partida('2102'), partida('2201')]
      },
      {
        numero: 9, titulo: 'Patrimonio',
        parrafos: [`El capital social está representado por ${e.numero_acciones.toLocaleString('en-US')} acciones comunes con valor nominal de $${Number(e.valor_nominal_accion).toFixed(2)} cada una, totalmente suscritas y pagadas, equivalentes a $${Number(e.capital_social).toLocaleString('en-US', { minimumFractionDigits: 2 })}.`],
        partidas: [partida('3101', 'Capital social'), partida('3102'), partida('3103'), partida('3104')]
      },
      {
        numero: 10, titulo: 'Ingresos, costos y gastos', parrafos: ['Resumen de las principales partidas del estado de resultados del período.'],
        partidas: [linea('ventasNetas'), linea('costoVentas'), linea('gastosAdministracion'), linea('gastosVenta'), linea('gastosFinancieros'), linea('utilidadEjercicio')]
      },
      {
        numero: 11, titulo: 'Otra información a revelar',
        parrafos: [
          'La empresa elaboraba únicamente el presupuesto de ventas. En 2009 las ventas netas quedaron 10.44 % por debajo de lo presupuestado y las compras excedieron lo planeado, lo que elevó el inventario y redujo el efectivo disponible (Pérez Tejada et al., 2009).',
          'Los porcentajes de reserva legal e impuesto sobre la renta se infirieron de las cifras publicadas y son parámetros configurables del sistema.'
        ]
      }
    ];
  }

  exportar = (): TablaExport[] => [{
    titulo: `Notas a los estados financieros ${this.anio()}`,
    columnas: [{ titulo: 'Nota / concepto', clave: 'c' }, { titulo: String(this.anio()), clave: 'a', tipo: 'dinero' }, { titulo: String((this.anio() ?? 0) - 1), clave: 'b', tipo: 'dinero' }],
    filas: this.notas().flatMap((n) => [
      { c: `Nota ${n.numero}. ${n.titulo}` },
      ...n.parrafos.map((p) => ({ c: p })),
      ...(n.partidas ?? []).map((p) => ({ c: `   ${p.nombre}`, a: p.actual, b: p.anterior }))
    ])
  }];
}
