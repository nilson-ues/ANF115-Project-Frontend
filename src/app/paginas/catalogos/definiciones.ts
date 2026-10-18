import { Rol } from '../../core/auth.service';

export interface Campo {
  clave: string;
  etiqueta: string;
  tipo: 'texto' | 'numero' | 'dinero' | 'porcentaje' | 'seleccion' | 'booleano' | 'correo';
  requerido?: boolean;
  opciones?: { valor: string | number | null; texto: string }[];
  origen?: { ruta: string; texto: string; filtro?: (r: Record<string, unknown>) => boolean };
  ancho?: 'completo';
}

export interface Columna {
  clave: string;
  titulo: string;
  tipo?: 'dinero' | 'porcentaje' | 'numero' | 'booleano' | 'etiqueta';
}

export interface DefinicionCatalogo {
  titulo: string;
  singular: string;
  descripcion: string;
  ruta: string;
  escritura: Rol[];
  columnas: Columna[];
  campos: Campo[];
  nuevo: Record<string, unknown>;
}

export const CATALOGOS: Record<string, DefinicionCatalogo> = {
  productos: {
    titulo: 'Productos', singular: 'producto', ruta: '/catalogos/productos', escritura: ['ADMIN', 'FINANZAS'],
    descripcion: 'Insumos médicos y farmacéuticos. La existencia y el costo promedio se actualizan con compras y ventas (kárdex).',
    columnas: [
      { clave: 'codigo', titulo: 'Código' }, { clave: 'nombre', titulo: 'Producto' }, { clave: 'linea', titulo: 'Línea', tipo: 'etiqueta' },
      { clave: 'proveedor', titulo: 'Proveedor' }, { clave: 'unidad', titulo: 'Unidad' }, { clave: 'precio_venta', titulo: 'Precio venta', tipo: 'dinero' },
      { clave: 'existencia', titulo: 'Existencia', tipo: 'numero' }, { clave: 'existencia_minima', titulo: 'Mínimo', tipo: 'numero' },
      { clave: 'costo_promedio', titulo: 'Costo promedio', tipo: 'dinero' }, { clave: 'activo', titulo: 'Activo', tipo: 'booleano' }
    ],
    campos: [
      { clave: 'codigo', etiqueta: 'Código', tipo: 'texto', requerido: true },
      { clave: 'unidad', etiqueta: 'Unidad de medida', tipo: 'texto', requerido: true },
      { clave: 'nombre', etiqueta: 'Nombre del producto', tipo: 'texto', requerido: true, ancho: 'completo' },
      { clave: 'linea_id', etiqueta: 'Línea', tipo: 'seleccion', requerido: true, origen: { ruta: '/catalogos/lineas', texto: 'nombre' } },
      { clave: 'proveedor_id', etiqueta: 'Proveedor', tipo: 'seleccion', requerido: true, origen: { ruta: '/catalogos/proveedores', texto: 'nombre' } },
      { clave: 'precio_venta', etiqueta: 'Precio de venta (sin IVA)', tipo: 'dinero', requerido: true },
      { clave: 'existencia_minima', etiqueta: 'Existencia mínima', tipo: 'numero', requerido: true },
      { clave: 'activo', etiqueta: 'Activo', tipo: 'booleano' }
    ],
    nuevo: { codigo: '', nombre: '', unidad: 'Unidad', linea_id: null, proveedor_id: null, precio_venta: 0, existencia_minima: 0, activo: true }
  },
  clientes: {
    titulo: 'Clientes', singular: 'cliente', ruta: '/catalogos/clientes', escritura: ['ADMIN', 'VENTAS'],
    descripcion: 'Instituciones públicas y privadas. El plazo y límite de crédito se usan en cuentas por cobrar y en la antigüedad de saldos.',
    columnas: [
      { clave: 'nombre', titulo: 'Cliente' }, { clave: 'tipo', titulo: 'Tipo', tipo: 'etiqueta' }, { clave: 'nit', titulo: 'NIT' },
      { clave: 'plazo_credito_dias', titulo: 'Plazo (días)', tipo: 'numero' }, { clave: 'limite_credito', titulo: 'Límite de crédito', tipo: 'dinero' },
      { clave: 'descuento_pronto_pago', titulo: 'Desc. pronto pago', tipo: 'porcentaje' }, { clave: 'dias_pronto_pago', titulo: 'Días desc.', tipo: 'numero' },
      { clave: 'activo', titulo: 'Activo', tipo: 'booleano' }
    ],
    campos: [
      { clave: 'nombre', etiqueta: 'Nombre o razón social', tipo: 'texto', requerido: true, ancho: 'completo' },
      { clave: 'tipo', etiqueta: 'Tipo', tipo: 'seleccion', requerido: true, opciones: [{ valor: 'PUBLICO', texto: 'Público' }, { valor: 'PRIVADO', texto: 'Privado' }] },
      { clave: 'nit', etiqueta: 'NIT', tipo: 'texto' },
      { clave: 'telefono', etiqueta: 'Teléfono', tipo: 'texto' },
      { clave: 'email', etiqueta: 'Correo', tipo: 'correo' },
      { clave: 'direccion', etiqueta: 'Dirección', tipo: 'texto', ancho: 'completo' },
      { clave: 'plazo_credito_dias', etiqueta: 'Plazo de crédito (días)', tipo: 'numero', requerido: true },
      { clave: 'limite_credito', etiqueta: 'Límite de crédito', tipo: 'dinero', requerido: true },
      { clave: 'descuento_pronto_pago', etiqueta: 'Descuento por pronto pago (%)', tipo: 'porcentaje', requerido: true },
      { clave: 'dias_pronto_pago', etiqueta: 'Días para el descuento', tipo: 'numero', requerido: true },
      { clave: 'activo', etiqueta: 'Activo', tipo: 'booleano' }
    ],
    nuevo: { nombre: '', tipo: 'PRIVADO', nit: '', telefono: '', email: '', direccion: '', plazo_credito_dias: 30, limite_credito: 0, descuento_pronto_pago: 0, dias_pronto_pago: 0, activo: true }
  },
  proveedores: {
    titulo: 'Proveedores', singular: 'proveedor', ruta: '/catalogos/proveedores', escritura: ['ADMIN', 'FINANZAS'],
    descripcion: 'Proveedores locales y del exterior. El plazo que otorgan sirve para interpretar el periodo promedio de pago.',
    columnas: [
      { clave: 'nombre', titulo: 'Proveedor' }, { clave: 'origen', titulo: 'Origen', tipo: 'etiqueta' }, { clave: 'pais', titulo: 'País' },
      { clave: 'nit', titulo: 'NIT' }, { clave: 'telefono', titulo: 'Teléfono' }, { clave: 'plazo_credito_dias', titulo: 'Plazo (días)', tipo: 'numero' },
      { clave: 'activo', titulo: 'Activo', tipo: 'booleano' }
    ],
    campos: [
      { clave: 'nombre', etiqueta: 'Nombre o razón social', tipo: 'texto', requerido: true, ancho: 'completo' },
      { clave: 'origen', etiqueta: 'Origen', tipo: 'seleccion', requerido: true, opciones: [{ valor: 'LOCAL', texto: 'Local' }, { valor: 'EXTERIOR', texto: 'Exterior' }] },
      { clave: 'pais', etiqueta: 'País', tipo: 'texto', requerido: true },
      { clave: 'nit', etiqueta: 'NIT', tipo: 'texto' },
      { clave: 'telefono', etiqueta: 'Teléfono', tipo: 'texto' },
      { clave: 'email', etiqueta: 'Correo', tipo: 'correo' },
      { clave: 'plazo_credito_dias', etiqueta: 'Plazo de crédito (días)', tipo: 'numero', requerido: true },
      { clave: 'activo', etiqueta: 'Activo', tipo: 'booleano' }
    ],
    nuevo: { nombre: '', origen: 'LOCAL', pais: 'El Salvador', nit: '', telefono: '', email: '', plazo_credito_dias: 30, activo: true }
  },
  lineas: {
    titulo: 'Líneas de producto', singular: 'línea', ruta: '/catalogos/lineas', escritura: ['ADMIN', 'FINANZAS'],
    descripcion: 'Líneas por marca o proveedor usadas en la tesis. Boston Scientific se divide en sublíneas por especialidad.',
    columnas: [{ clave: 'nombre', titulo: 'Línea' }, { clave: 'linea_padre', titulo: 'Línea principal', tipo: 'etiqueta' }, { clave: 'activo', titulo: 'Activo', tipo: 'booleano' }],
    campos: [
      { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, ancho: 'completo' },
      { clave: 'linea_padre_id', etiqueta: 'Sublínea de', tipo: 'seleccion', origen: { ruta: '/catalogos/lineas', texto: 'nombre', filtro: (r) => !r['linea_padre_id'] } },
      { clave: 'activo', etiqueta: 'Activo', tipo: 'booleano' }
    ],
    nuevo: { nombre: '', linea_padre_id: null, activo: true }
  }
};
