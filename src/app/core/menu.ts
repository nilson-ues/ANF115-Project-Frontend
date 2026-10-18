import { Rol } from './auth.service';

import { Feature } from './features';

export interface ItemMenu {
  ruta: string;
  titulo: string;
  icono: string;
  roles?: Rol[];
  pendiente?: boolean;
  feature?: Feature;
}

export interface GrupoMenu {
  titulo: string;
  unidad?: string;
  etiqueta?: string;
  feature?: Feature;
  items: ItemMenu[];
}

const FIN: Rol[] = ['ADMIN', 'FINANZAS'];

export const MENU: GrupoMenu[] = [
  { titulo: 'Inicio', items: [{ ruta: '/dashboard', titulo: 'Tablero financiero', icono: 'space_dashboard' }] },
  {
    titulo: 'Operaciones',
    items: [
      { ruta: '/operaciones/compras', titulo: 'Compras', icono: 'local_shipping', roles: FIN, pendiente: true, feature: 'compras' },
      { ruta: '/operaciones/ventas', titulo: 'Ventas y facturación', icono: 'point_of_sale', roles: ['ADMIN', 'VENTAS'], pendiente: true, feature: 'ventas' },
      { ruta: '/operaciones/inventario', titulo: 'Inventario (kárdex)', icono: 'inventory_2', pendiente: true, feature: 'inventario' },
      { ruta: '/operaciones/cxc', titulo: 'Cuentas por cobrar', icono: 'request_quote', pendiente: true, feature: 'cuentasPorCobrar' },
      { ruta: '/operaciones/cxp', titulo: 'Cuentas por pagar', icono: 'payments', roles: FIN, pendiente: true, feature: 'cuentasPorPagar' },
      { ruta: '/contabilidad/partidas', titulo: 'Partidas contables', icono: 'receipt_long', roles: FIN, pendiente: true, feature: 'partidas' },
      { ruta: '/contabilidad/cierre', titulo: 'Cierre mensual', icono: 'lock_clock', roles: FIN, pendiente: true, feature: 'cierreMensual' }
    ]
  },
  {
    titulo: 'Estados financieros',
    unidad: 'Unidad I',
    items: [
      { ruta: '/estados/resultados', titulo: 'Estado de resultados', icono: 'trending_up', roles: FIN },
      { ruta: '/estados/balance', titulo: 'Balance general', icono: 'balance', roles: FIN },
      { ruta: '/estados/flujo', titulo: 'Flujo de efectivo', icono: 'waterfall_chart', roles: FIN },
      { ruta: '/estados/patrimonio', titulo: 'Cambios en el patrimonio', icono: 'account_balance', roles: FIN }
    ]
  },
  {
    titulo: 'Análisis financiero',
    unidad: 'Unidad II',
    items: [
      { ruta: '/analisis/razones', titulo: 'Razones financieras', icono: 'query_stats', roles: FIN },
      { ruta: '/analisis/horizontal', titulo: 'Análisis horizontal', icono: 'compare_arrows', roles: FIN },
      { ruta: '/analisis/equilibrio', titulo: 'Punto de equilibrio', icono: 'show_chart', roles: FIN, pendiente: true, feature: 'puntoEquilibrio' }
    ]
  },
  {
    titulo: 'Planeación financiera',
    unidad: 'Unidad III',
    etiqueta: 'En desarrollo',
    items: [
      { ruta: '/planeacion/proyeccion', titulo: 'Presupuesto y pro forma', icono: 'event_note', roles: FIN },
      { ruta: '/planeacion/control', titulo: 'Control presupuestario', icono: 'rule', roles: FIN },
      { ruta: '/planeacion/caja', titulo: 'Presupuesto de caja', icono: 'savings', roles: FIN, pendiente: true, feature: 'presupuestoCaja' },
      { ruta: '/planeacion/proyectos', titulo: 'Evaluación de proyectos', icono: 'rocket_launch', roles: FIN, pendiente: true, feature: 'evaluacionProyectos' }
    ]
  },
  {
    titulo: 'Activo circulante',
    unidad: 'Unidad IV',
    feature: 'unidad4',
    items: [{ ruta: '/circulante/credito', titulo: 'Capital de trabajo y crédito', icono: 'currency_exchange', roles: FIN, pendiente: true }]
  },
  {
    titulo: 'Catálogos',
    items: [
      { ruta: '/catalogos/productos', titulo: 'Productos', icono: 'medication' },
      { ruta: '/catalogos/clientes', titulo: 'Clientes', icono: 'groups' },
      { ruta: '/catalogos/proveedores', titulo: 'Proveedores', icono: 'factory' },
      { ruta: '/catalogos/lineas', titulo: 'Líneas de producto', icono: 'category' },
      { ruta: '/contabilidad/cuentas', titulo: 'Catálogo de cuentas', icono: 'account_tree', roles: FIN }
    ]
  },
  {
    titulo: 'Configuración',
    items: [
      { ruta: '/configuracion/empresa', titulo: 'Empresa y parámetros', icono: 'tune' },
      { ruta: '/configuracion/usuarios', titulo: 'Usuarios', icono: 'manage_accounts', roles: ['ADMIN'] },
      { ruta: '/configuracion/bitacora', titulo: 'Bitácora', icono: 'history', roles: ['ADMIN'] }
    ]
  }
];

export const PENDIENTES: Record<string, { descripcion: string; teoria: string }> = {
  '/operaciones/compras': { descripcion: 'Registro de compras al contado y al crédito con IVA crédito fiscal, rebajas y devoluciones. Cada compra alimenta el kárdex y genera su partida contable.', teoria: 'Costo de ventas = Inventario inicial + Compras − Rebajas y devoluciones − Inventario final' },
  '/operaciones/ventas': { descripcion: 'Facturación al contado y al crédito con IVA. Al guardar descarga inventario a costo promedio, registra el costo de venta y la cuenta por cobrar.', teoria: 'Ventas netas = Ventas totales − Rebajas y devoluciones sobre ventas' },
  '/operaciones/inventario': { descripcion: 'Kárdex por producto valuado a costo promedio ponderado, con alertas de existencia mínima y baja rotación.', teoria: 'Costo promedio = (Saldo en dinero + Costo de la entrada) / (Unidades en saldo + Unidades que entran)' },
  '/operaciones/cxc': { descripcion: 'Saldos por cliente, abonos y antigüedad de saldos (0-30, 31-60, 61-90 y más de 90 días), comparada contra el plazo de crédito.', teoria: 'Unidad IV: supervisión del crédito y periodo promedio de cobro' },
  '/operaciones/cxp': { descripcion: 'Saldos por proveedor y registro de pagos.', teoria: 'Periodo promedio de pago = Cuentas por pagar / (Compras anuales / 365)' },
  '/contabilidad/partidas': { descripcion: 'Partidas automáticas por cada documento y registro manual de gastos y ajustes (depreciación, provisiones).', teoria: 'Partida doble: Debe = Haber' },
  '/contabilidad/cierre': { descripcion: 'Cierre mensual: congela el período y guarda los saldos que usan los estados financieros y las razones.', teoria: 'Ciclo contable: el estado financiero es su producto final' },
  '/analisis/equilibrio': { descripcion: 'Punto de equilibrio por producto y por empresa, con comprobación (utilidad = 0) y gráfica.', teoria: 'PE = CF / (PVU − CVU)   ·   PE en $ = PE × PVU' },
  '/planeacion/caja': { descripcion: 'Presupuesto de efectivo mes a mes: cobros (60% contado, resto crédito), pagos a proveedores, gastos, faltante o excedente.', teoria: 'Efectivo final = Efectivo inicial + Entradas − Salidas' },
  '/planeacion/proyectos': { descripcion: 'Presupuesto de capital: periodo de recuperación, valor presente neto y tasa interna de rendimiento usando el costo de capital.', teoria: 'VPN = Σ FE_t / (1 + k)^t − Inversión inicial   ·   TIR: tasa donde VPN = 0' },
  '/circulante/credito': { descripcion: 'Ciclo de conversión del efectivo, límites y términos de crédito por cliente (descuento por pronto pago) y supervisión del crédito.', teoria: 'CCE = Edad promedio del inventario + Periodo promedio de cobro − Periodo promedio de pago' }
};
