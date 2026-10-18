import { formatoDinero, formatoPct } from './formato';

// Contenido del panel "¿Qué significa?" de las Unidades I y II
export interface TemaPanel<T = unknown> {
  unidad: string;
  tema: string;
  titulo: string;
  definicion: string;
  formulas: string[];
  calculo?: (d: T) => string[];
  interpretacion?: (d: T) => string[];
  fuente: string;
}

export interface FilaVertical { clave?: string; codigo?: string; nombre: string; nivel?: number; detalle?: boolean; monto: string; porcentaje: number | null }
export interface DatosVertical {
  resultados: FilaVertical[];
  balance: FilaVertical[];
  totales: { activo: string; pasivo: string; patrimonio: string; pasivoMasPatrimonio: string };
  comprobacion: { resultados: number; activo: number; pasivoPatrimonio: number };
}

export interface FilaHorizontal { clave?: string; codigo?: string; nombre: string; nivel?: number; detalle?: boolean; tipo?: string; actual: string; base: string; variacion: string; variacionPct: number | null; resaltar: boolean }
export interface DatosHorizontal {
  tipo: 'acumulado' | 'mes';
  actual: { anio: number; mes: number };
  base: { anio: number; mes: number };
  umbral: number;
  resultados: FilaHorizontal[];
  balance: FilaHorizontal[];
}

const $ = (v: string | number | null | undefined) => formatoDinero(v, true);
const centavos = (p: number | null) => (p === null ? '—' : `$${(p).toFixed(2)}`);
const er = <F extends { clave?: string }>(filas: F[], clave: string) => filas.find((f) => f.clave === clave);

export const TEMA_VERTICAL: TemaPanel<DatosVertical> = {
  unidad: 'Unidad II',
  tema: 'Tema 6: Análisis de rentabilidad (estado de tamaño común)',
  titulo: 'Análisis vertical',
  definicion:
    'Expresa cada rubro de un estado financiero como porcentaje de una base del mismo período: en el estado de resultados la base son las ventas netas y en el balance general el activo total (o pasivo + patrimonio). Sirve para ver el peso de cada cuenta y comparar estados de distinto tamaño.',
  formulas: ['% del rubro = Rubro / Ventas netas × 100', '% de la cuenta = Cuenta / Activo total × 100', '% de la cuenta = Cuenta / (Pasivo + Patrimonio) × 100'],
  calculo: (d) => {
    const ventas = er(d.resultados, 'ventasNetas')!;
    const lineas = ['costoVentas', 'gastosOperacion', 'utilidadEjercicio'].map((c) => {
      const f = er(d.resultados, c)!;
      return `${f.nombre.replace(/^\(-\) /, '')}: ${$(f.monto)} / ${$(ventas.monto)} = ${formatoPct(f.porcentaje)}`;
    });
    const pasivo = d.balance.find((f) => f.codigo === '2');
    if (pasivo) lineas.push(`Pasivo total: ${$(pasivo.monto)} / ${$(d.totales.pasivoMasPatrimonio)} = ${formatoPct(pasivo.porcentaje)}`);
    lineas.push(`Comprobación: los componentes de las ventas suman ${formatoPct(d.comprobacion.resultados)}; las cuentas de activo ${formatoPct(d.comprobacion.activo)}; pasivo + patrimonio ${formatoPct(d.comprobacion.pasivoPatrimonio)}.`);
    return lineas;
  },
  interpretacion: (d) => {
    const p = (c: string) => er(d.resultados, c)?.porcentaje ?? null;
    const textos = [
      `De cada dólar vendido, ${centavos(p('costoVentas'))} se destinan al costo de ventas, ${centavos(p('gastosOperacion'))} a gastos de operación y quedan ${centavos(p('utilidadEjercicio'))} de utilidad del ejercicio.`
    ];
    const activos = d.balance.filter((f) => f.detalle && f.codigo?.startsWith('1')).sort((a, b) => (b.porcentaje ?? 0) - (a.porcentaje ?? 0));
    if (activos[0]) textos.push(`La cuenta con más peso en el activo es ${activos[0].nombre} con ${formatoPct(activos[0].porcentaje)} del total.`);
    const pasivo = d.balance.find((f) => f.codigo === '2')?.porcentaje ?? null;
    const patrimonio = d.balance.find((f) => f.codigo === '3')?.porcentaje ?? null;
    if (pasivo !== null && patrimonio !== null) {
      textos.push(
        `El ${formatoPct(pasivo)} de los recursos se financia con deuda y el ${formatoPct(patrimonio)} con patrimonio${pasivo > patrimonio ? ': la empresa depende más de terceros que de sus accionistas.' : '.'}`
      );
    }
    return textos;
  },
  fuente: 'Gitman, Principios de Administración Financiera · ANF115 Unidad II'
};

export const TEMA_HORIZONTAL: TemaPanel<DatosHorizontal> = {
  unidad: 'Unidad II',
  tema: 'Tema 2.4: Tipos de comparaciones (series temporales)',
  titulo: 'Análisis horizontal',
  definicion:
    'Compara la misma cuenta entre dos períodos para medir cuánto cambió en dólares y en porcentaje. Es la base del análisis de series temporales: permite identificar tendencias y cambios significativos que pueden indicar un problema.',
  formulas: ['Variación absoluta = Período actual − Período base', 'Variación % = Variación absoluta / Período base × 100'],
  calculo: (d) =>
    ['ventasNetas', 'costoVentas', 'utilidadEjercicio'].map((c) => {
      const f = er(d.resultados, c)!;
      return `${f.nombre.replace(/^\(-\) /, '')}: (${$(f.actual)} − ${$(f.base)}) / ${$(f.base)} = ${formatoPct(f.variacionPct)}`;
    }),
  interpretacion: (d) => {
    const textos: string[] = [];
    const ventas = er(d.resultados, 'ventasNetas')?.variacionPct ?? null;
    const costo = er(d.resultados, 'costoVentas')?.variacionPct ?? null;
    if (ventas !== null) textos.push(`Las ventas netas ${ventas >= 0 ? 'crecieron' : 'disminuyeron'} ${formatoPct(Math.abs(ventas))} respecto al período base.`);
    if (ventas !== null && costo !== null) {
      textos.push(
        costo > ventas
          ? `El costo de ventas cambió ${formatoPct(costo)} frente a ${formatoPct(ventas)} de las ventas: cada dólar vendido cuesta más y el margen bruto se redujo.`
          : `El costo de ventas cambió ${formatoPct(costo)} frente a ${formatoPct(ventas)} de las ventas: cada dólar vendido cuesta menos o igual y el margen bruto se mantuvo o mejoró.`
      );
    }
    const cuentas = [...d.resultados.filter((f) => f.tipo === 'detalle'), ...d.balance.filter((f) => f.detalle)].filter((f) => f.resaltar);
    textos.push(
      cuentas.length
        ? `${cuentas.length} cuentas superan el umbral de ${formatoPct(d.umbral)}. Conviene revisar sus causas.`
        : `Ninguna cuenta supera el umbral de ${formatoPct(d.umbral)}.`
    );
    const mayores = d.balance.filter((f) => f.detalle && f.variacionPct !== null).sort((a, b) => Math.abs(Number(b.variacion)) - Math.abs(Number(a.variacion)));
    if (mayores[0]) textos.push(`El mayor cambio en dólares del balance está en ${mayores[0].nombre}: ${$(mayores[0].variacion)}.`);
    return textos;
  },
  fuente: 'Gitman, Principios de Administración Financiera · ANF115 Unidad II'
};

export interface DatosDupont {
  actual: { anio: number; mes: number; margenNeto: number | null; rotacionActivos: number | null; multiplicador: number | null; roa: number | null; roe: number | null; roaDirecto: number | null; roeDirecto: number | null; activoTotal: string; patrimonio: string };
  base: DatosDupont['actual'];
  cambios: Record<'margenNeto' | 'rotacionActivos' | 'multiplicador' | 'roa' | 'roe', number | null>;
  base_calculo: string;
}

const dec = (v: number | null, d = 4) => (v === null ? '—' : v.toFixed(d));

export const COMPONENTES_DUPONT = [
  { clave: 'margenNeto', nombre: 'Margen de utilidad neta', mide: 'la rentabilidad de las ventas' },
  { clave: 'rotacionActivos', nombre: 'Rotación de activos totales', mide: 'la eficiencia en el uso de los activos' },
  { clave: 'multiplicador', nombre: 'Multiplicador de apalancamiento financiero', mide: 'el uso de deuda para financiar los activos' }
] as const;

export const TEMA_DUPONT: TemaPanel<DatosDupont> = {
  unidad: 'Unidad II',
  tema: 'Tema 8: Sistema de análisis DuPont y sumario de razones',
  titulo: 'Sistema DuPont',
  definicion:
    'Descompone el rendimiento sobre el patrimonio (ROE) en tres componentes: la rentabilidad de las ventas, la eficiencia en el uso de los activos y el apalancamiento financiero. Permite identificar cuál de las tres áreas explica un cambio en el rendimiento de los accionistas.',
  formulas: [
    'ROA = Margen de utilidad neta × Rotación de activos totales',
    'Multiplicador de apalancamiento financiero = Total de activos / Patrimonio',
    'ROE = ROA × Multiplicador de apalancamiento financiero'
  ],
  calculo: (d) => {
    const a = d.actual;
    return [
      `ROA ${a.anio} = ${dec(a.margenNeto)} × ${dec(a.rotacionActivos)} = ${formatoPct(a.roa)}`,
      `Multiplicador = ${$(a.activoTotal)} / ${$(a.patrimonio)} = ${dec(a.multiplicador)}`,
      `ROE ${a.anio} = ${formatoPct(a.roa)} × ${dec(a.multiplicador)} = ${formatoPct(a.roe)}`,
      `Comprobación con la fórmula directa: ROA ${formatoPct(a.roaDirecto)} y ROE ${formatoPct(a.roeDirecto)}.`
    ];
  },
  interpretacion: (d) => {
    const textos = [
      `El ROE pasó de ${formatoPct(d.base.roe)} (${d.base.anio}) a ${formatoPct(d.actual.roe)} (${d.actual.anio}), un cambio de ${formatoPct(d.cambios.roe)}.`
    ];
    const ordenados = COMPONENTES_DUPONT.map((c) => ({ ...c, cambio: d.cambios[c.clave] })).filter((c) => c.cambio !== null).sort((a, b) => Math.abs(b.cambio!) - Math.abs(a.cambio!));
    if (ordenados[0]) {
      const c = ordenados[0];
      textos.push(`El componente que más cambió es ${c.nombre.toLowerCase()} (${formatoPct(c.cambio)}), que mide ${c.mide}.`);
    }
    for (const c of ordenados.slice(1)) textos.push(`${c.nombre}: ${formatoPct(c.cambio)}.`);
    if ((d.cambios.multiplicador ?? 0) > 0 && (d.cambios.roe ?? 0) < 0) {
      textos.push('Aunque la empresa usa más deuda (multiplicador mayor), eso no compensó la caída del ROA.');
    }
    return textos;
  },
  fuente: 'Gitman, Principios de Administración Financiera · ANF115 Unidad II'
};

export interface DatosSumario {
  periodos: { anio: number; mes: number }[];
  razones: { clave: string; nombre: string; categoria: string; unidad: string; formula: string; valores: (number | null)[]; tendencia: string; semaforo: string; referencia: string; estandar: number | null }[];
}

export const TEMA_SUMARIO: TemaPanel<DatosSumario> = {
  unidad: 'Unidad II',
  tema: 'Tema 8: Sistema de análisis DuPont y sumario de razones',
  titulo: 'Sumario de razones',
  definicion:
    'Reúne todas las razones de la empresa en varios períodos para ver la tendencia de cada una (análisis de series temporales) y compararla con el estándar de la industria (muestra representativa). El enfoque más informativo combina ambas comparaciones.',
  formulas: ['Tendencia: compara el último período con el anterior según si la razón es mejor alta o baja', 'Semáforo: contra el estándar de la industria; si no hay, contra el año anterior'],
  interpretacion: (d) => {
    const mejoran = d.razones.filter((r) => r.tendencia === 'mejora');
    const empeoran = d.razones.filter((r) => r.tendencia === 'empeora');
    const textos = [`${mejoran.length} razones mejoran y ${empeoran.length} empeoran respecto al período anterior.`];
    if (mejoran.length) textos.push(`Mejoran: ${mejoran.map((r) => r.nombre.toLowerCase()).join(', ')}.`);
    if (empeoran.length) textos.push(`Empeoran: ${empeoran.map((r) => r.nombre.toLowerCase()).join(', ')}.`);
    return textos;
  },
  fuente: 'Gitman, Principios de Administración Financiera · ANF115 Unidad II'
};

interface LineaFuenteUso { codigo: string; nombre: string; base: string; actual: string; variacion: string; monto: string }
interface CapitalTrabajo { anio: number; mes: number; activoCorriente: string; pasivoCorriente: string; neto: string; financiadoCortoPlazo: number | null; financiadoLargoPlazo: number | null }
export interface DatosFuentesUsos {
  base: { anio: number; mes: number };
  actual: { anio: number; mes: number };
  fuentes: LineaFuenteUso[];
  usos: LineaFuenteUso[];
  totalFuentes: string;
  totalUsos: string;
  diferencia: string;
  descuadreBalances: string;
  capitalTrabajo: { base: CapitalTrabajo; actual: CapitalTrabajo; meses: CapitalTrabajo[] };
}

export const TEMA_FUENTES_USOS: TemaPanel<DatosFuentesUsos> = {
  unidad: 'Unidad II',
  tema: 'Tema 9: Estados de uso y aplicación de fuentes y capital de trabajo',
  titulo: 'Fuentes y usos y capital de trabajo',
  definicion:
    'El estado de fuentes y usos compara dos balances para mostrar de dónde obtuvo recursos la empresa y en qué los aplicó. El capital de trabajo neto es la diferencia entre activos y pasivos corrientes; según Gitman, es la parte del activo corriente que se financia con fondos a largo plazo.',
  formulas: [
    'Fuente = disminución de un activo o aumento de un pasivo o del patrimonio',
    'Uso = aumento de un activo o disminución de un pasivo o del patrimonio',
    'Total de fuentes = Total de usos',
    'Capital de trabajo neto = Activos corrientes − Pasivos corrientes'
  ],
  calculo: (d) => {
    const ct = d.capitalTrabajo.actual;
    const lineas = [
      `Total de fuentes ${$(d.totalFuentes)} = Total de usos ${$(d.totalUsos)}`,
      `Capital de trabajo neto ${ct.anio}: ${$(ct.activoCorriente)} − ${$(ct.pasivoCorriente)} = ${$(ct.neto)}`,
      `Activo corriente financiado con pasivo corriente: ${$(ct.pasivoCorriente)} / ${$(ct.activoCorriente)} = ${formatoPct(ct.financiadoCortoPlazo)}`
    ];
    if (Number(d.diferencia) !== 0) lineas.push(`La diferencia de ${$(d.diferencia)} viene del redondeo de los balances de la tesis (Activo − Pasivo − Patrimonio).`);
    return lineas;
  },
  interpretacion: (d) => {
    const ct = d.capitalTrabajo;
    const textos: string[] = [];
    if (d.fuentes[0]) textos.push(`La principal fuente de recursos fue ${d.fuentes[0].nombre.toLowerCase()} (${$(d.fuentes[0].monto)}).`);
    if (d.usos[0]) textos.push(`El principal uso fue ${d.usos[0].nombre.toLowerCase()} (${$(d.usos[0].monto)}).`);
    const cambio = Number(ct.actual.neto) - Number(ct.base.neto);
    textos.push(`El capital de trabajo neto ${cambio >= 0 ? 'aumentó' : 'disminuyó'} ${$(Math.abs(cambio))}, de ${$(ct.base.neto)} a ${$(ct.actual.neto)}.`);
    textos.push(
      Number(ct.actual.neto) > 0
        ? `El ${formatoPct(ct.actual.financiadoCortoPlazo)} del activo corriente se financia con pasivo corriente y el ${formatoPct(ct.actual.financiadoLargoPlazo)} con fondos a largo plazo (pasivo no corriente y patrimonio). Más capital de trabajo significa menos riesgo de no cubrir las deudas de corto plazo, pero también menor rendimiento.`
        : 'El pasivo corriente supera al activo corriente: la empresa usa deuda de corto plazo para financiar activos de largo plazo, lo que aumenta el riesgo de no poder pagar a tiempo.'
    );
    return textos;
  },
  fuente: 'Gitman; Van Horne y Wachowicz · ANF115 Unidad II'
};

export interface DatosEquilibrio {
  anio: number;
  hastaMes: number;
  ventas: string;
  rubros: { rubro: string; nombre: string; comportamiento: 'FIJO' | 'VARIABLE'; monto: string }[];
  costosFijos: string;
  costosVariables: string;
  razonVariable: number | null;
  margenContribucion: number | null;
  puntoEquilibrio: string | null;
  margenSeguridad: number | null;
  utilidadActual: string;
  comprobacion: { ventas: string; costosVariables: string; costosFijos: string; utilidad: string } | null;
}

export const TEMA_EQUILIBRIO: TemaPanel<DatosEquilibrio> = {
  unidad: 'Unidad II',
  tema: 'Tema 10: Punto de equilibrio',
  titulo: 'Punto de equilibrio de la empresa',
  definicion:
    'Es el nivel de ventas en el que los ingresos son iguales a los costos totales: la empresa no gana ni pierde. Por encima de ese nivel genera utilidades y por debajo, pérdidas. Para calcularlo se separan los costos en fijos (no cambian con el volumen vendido) y variables (cambian en proporción a las ventas).',
  formulas: [
    'PE ($) = Costos fijos / (1 − Costos variables / Ventas)',
    'Margen de seguridad = (Ventas − Ventas en PE) / Ventas',
    'Comprobación: Ventas en PE − Costos variables − Costos fijos = 0'
  ],
  calculo: (d) =>
    d.puntoEquilibrio === null
      ? ['Los costos variables igualan o superan a las ventas: no existe punto de equilibrio.']
      : [
          `Razón de costos variables: ${$(d.costosVariables)} / ${$(d.ventas)} = ${formatoPct(d.razonVariable)}`,
          `PE = ${$(d.costosFijos)} / (1 − ${(d.razonVariable ?? 0).toFixed(4)}) = ${$(d.puntoEquilibrio)}`,
          `Margen de seguridad = (${$(d.ventas)} − ${$(d.puntoEquilibrio)}) / ${$(d.ventas)} = ${formatoPct(d.margenSeguridad)}`,
          `Comprobación: ${$(d.comprobacion!.ventas)} − ${$(d.comprobacion!.costosVariables)} − ${$(d.comprobacion!.costosFijos)} = ${$(d.comprobacion!.utilidad)}`
        ],
  interpretacion: (d) => {
    if (d.puntoEquilibrio === null) return ['Con esta estructura de costos cada venta genera pérdida; hay que revisar precios o costos variables.'];
    const ms = d.margenSeguridad ?? 0;
    return [
      `La empresa necesita vender ${$(d.puntoEquilibrio)} para cubrir todos sus costos. De cada dólar vendido, ${formatoPct(d.margenContribucion)} queda para cubrir los costos fijos (margen de contribución).`,
      ms >= 0
        ? `Las ventas actuales superan el punto de equilibrio en ${formatoPct(ms)}: las ventas podrían caer ese porcentaje antes de tener pérdidas.`
        : `Las ventas actuales están ${formatoPct(Math.abs(ms))} por debajo del punto de equilibrio: la empresa opera con pérdida.`,
      'Los gastos financieros se tratan como costo fijo, por eso en el punto de equilibrio la utilidad de operación es igual a los gastos financieros y la utilidad antes de impuesto y reserva es cero.'
    ];
  },
  fuente: 'Gitman · ANF115 Unidad II (video clase 8)'
};

export interface ComponentesRazones {
  factorAnual: number;
  activoCorriente: string; pasivoCorriente: string; inventario: string; inventarioTransito: string;
  cuentasPorCobrar: string; cuentasPorPagar: string; activoTotal: string; pasivoTotal: string; patrimonio: string;
  ventasNetas: string; ventasAnuales: string; costoVentasAnual: string; comprasAnuales: string;
  utilidadBruta: string; utilidadOperacion: string; utilidadNeta: string;
  uaiiAnual: string; interesesAnual: string; utilidadNetaAnual: string; acciones: number;
}

export interface RazonPanel {
  clave: string; nombre: string; categoria: string; valor: number | null; anterior: number | null; mayorEsMejor: boolean | null;
}

export const TEMA_CATEGORIA: Record<string, string> = {
  Liquidez: 'Unidad II · Tema 3: Análisis de liquidez',
  'Capital de trabajo': 'Unidad II · Tema 9: Capital de trabajo',
  Actividad: 'Unidad II · Tema 4: Análisis de actividad',
  Endeudamiento: 'Unidad II · Tema 5: Análisis de endeudamiento',
  Rentabilidad: 'Unidad II · Tema 6: Análisis de rentabilidad',
  Mercado: 'Unidad II · Tema 7: Razones de mercado'
};

const n = (v: number | null, d = 2) => (v === null ? '—' : v.toFixed(d));

// Cálculo de cada razón con las cifras del período
export const CALCULO_RAZONES: Record<string, (c: ComponentesRazones, v: number | null) => string[]> = {
  liquidez_corriente: (c, v) => [`${$(c.activoCorriente)} / ${$(c.pasivoCorriente)} = ${n(v)} veces`],
  razon_rapida: (c, v) => [
    `(${$(c.activoCorriente)} − ${$(c.inventario)} − ${$(c.inventarioTransito)}) / ${$(c.pasivoCorriente)} = ${n(v)} veces`,
    'Se resta el inventario comercial y también el inventario en tránsito, porque ambos son inventario que todavía no se convierte en efectivo. Así lo calcula la tesis (0.67 en 2009).'
  ],
  capital_trabajo_neto: (c) => [`${$(c.activoCorriente)} − ${$(c.pasivoCorriente)}`],
  rotacion_inventarios: (c, v) => [`${$(c.costoVentasAnual)} / ${$(c.inventario)} = ${n(v)} veces`],
  edad_inventario: (_c, v) => [`365 / rotación de inventarios = ${n(v, 0)} días`],
  periodo_cobro: (c, v) => [`${$(c.cuentasPorCobrar)} / (${$(c.ventasAnuales)} / 365) = ${n(v, 0)} días`],
  periodo_pago: (c, v) => [`${$(c.cuentasPorPagar)} / (${$(c.comprasAnuales)} / 365) = ${n(v, 0)} días`],
  rotacion_activos: (c, v) => [`${$(c.ventasAnuales)} / ${$(c.activoTotal)} = ${n(v)} veces`],
  endeudamiento: (c, v) => [`${$(c.pasivoTotal)} / ${$(c.activoTotal)} = ${formatoPct(v)}`],
  cargos_interes_fijo: (c, v) => [`${$(c.uaiiAnual)} / ${$(c.interesesAnual)} = ${n(v)} veces`],
  margen_bruto: (c, v) => [`${$(c.utilidadBruta)} / ${$(c.ventasNetas)} = ${formatoPct(v)}`],
  margen_operativo: (c, v) => [`${$(c.utilidadOperacion)} / ${$(c.ventasNetas)} = ${formatoPct(v)}`],
  margen_neto: (c, v) => [`${$(c.utilidadNeta)} / ${$(c.ventasNetas)} = ${formatoPct(v)}`],
  roa: (c, v) => [`${$(c.utilidadNetaAnual)} / ${$(c.activoTotal)} = ${formatoPct(v)}`],
  roe: (c, v) => [`${$(c.utilidadNetaAnual)} / ${$(c.patrimonio)} = ${formatoPct(v)}`],
  utilidad_por_accion: (c, v) => [`${$(c.utilidadNetaAnual)} / ${c.acciones.toLocaleString('en-US')} acciones = ${$(v)}`],
  valor_libros_accion: (c, v) => [`${$(c.patrimonio)} / ${c.acciones.toLocaleString('en-US')} acciones = ${$(v)}`]
};

// Interpretación según el resultado obtenido
export function interpretarRazon(r: RazonPanel, plazoCredito: number | null): string[] {
  const textos: string[] = [];
  const v = r.valor;
  if (v === null) return ['No se puede calcular con los datos del período.'];
  if (r.clave === 'liquidez_corriente') {
    textos.push(v >= 1
      ? `Por cada dólar de deuda de corto plazo la empresa tiene $${v.toFixed(2)} de activo corriente para pagarla.`
      : `El activo corriente no alcanza para cubrir el pasivo corriente: hay $${v.toFixed(2)} por cada dólar de deuda de corto plazo.`);
  }
  if (r.clave === 'razon_rapida') {
    textos.push(`Sin vender inventario, la empresa cubre ${formatoPct(v)} de sus deudas de corto plazo${v < 1 ? ': depende de vender su inventario para pagar.' : '.'}`);
  }
  if (r.clave === 'rotacion_inventarios' && r.anterior !== null) {
    textos.push(v > r.anterior
      ? 'La rotación subió respecto al año anterior: el inventario se vende más rápido.'
      : 'La rotación bajó respecto al año anterior: el inventario tarda más en venderse; puede haber exceso de existencias o inventario sin movimiento.');
  }
  if (r.clave === 'periodo_cobro' && plazoCredito) {
    textos.push(v <= plazoCredito
      ? `La empresa cobra en ${v.toFixed(0)} días, dentro del plazo de crédito de ${plazoCredito} días.`
      : `La empresa cobra en ${v.toFixed(0)} días, ${(v - plazoCredito).toFixed(0)} días más que el plazo de crédito de ${plazoCredito} días: hay que revisar la política de cobro.`);
  }
  if (r.clave === 'endeudamiento') textos.push(`El ${formatoPct(v)} de los activos se financia con dinero de terceros.`);
  if (r.clave === 'cargos_interes_fijo') textos.push(`La utilidad de operación cubre ${v.toFixed(2)} veces los intereses del período.`);
  if (['margen_bruto', 'margen_operativo', 'margen_neto'].includes(r.clave)) textos.push(`De cada dólar vendido quedan $${v.toFixed(2)}.`);
  if (r.anterior !== null && r.mayorEsMejor !== null && v !== r.anterior) {
    const mejora = v > r.anterior === r.mayorEsMejor;
    textos.push(`Frente al año anterior la razón ${mejora ? 'mejoró' : 'empeoró'}.`);
  }
  if (r.categoria === 'Mercado') textos.push('La empresa no cotiza en bolsa: esta razón es informativa.');
  return textos;
}
