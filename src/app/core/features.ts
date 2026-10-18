// Banderas para mostrar u ocultar módulos no terminados o fuera de alcance
export const FEATURES = {
  compras: false,
  ventas: false,
  inventario: false,
  cuentasPorCobrar: false,
  cuentasPorPagar: false,
  partidas: false,
  cierreMensual: false,
  puntoEquilibrio: false,
  puntoEquilibrioProducto: false,
  presupuestoCaja: false,
  evaluacionProyectos: false,
  unidad4: false
};

export type Feature = keyof typeof FEATURES;

// Razones fuera de la lista de la Unidad II; se reactivan cambiando a true
export const RAZONES_VISIBLES: Record<string, boolean> = {
  edad_inventario: false,
  ciclo_conversion: false,
  cobertura_pagos_fijos: false,
  valor_libros_accion: false
};

export const activa = (f?: Feature) => !f || FEATURES[f];
export const razonVisible = (clave: string) => RAZONES_VISIBLES[clave] ?? true;
