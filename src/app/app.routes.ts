import { Routes } from '@angular/router';
import { Rol } from './core/auth.service';
import { autenticadoGuard } from './core/interceptores';
import { activa } from './core/features';
import { MENU } from './core/menu';
import { Shell } from './layout/shell';
import { Login } from './paginas/login/login';

const FIN: Rol[] = ['ADMIN', 'FINANZAS'];

// Las rutas de un grupo apagado (Unidad IV) no se registran
const pendientes: Routes = MENU.filter((g) => activa(g.feature))
  .flatMap((g) => g.items)
  .filter((i) => i.pendiente)
  .map((i) => ({
    path: i.ruta.slice(1),
    title: i.titulo,
    data: { roles: i.roles },
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./paginas/pendiente/pendiente').then((m) => m.Pendiente)
  }));

export const routes: Routes = [
  { path: 'login', component: Login, title: 'Iniciar sesión' },
  {
    path: '',
    component: Shell,
    canActivate: [autenticadoGuard],
    canActivateChild: [autenticadoGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', title: 'Tablero financiero', loadComponent: () => import('./paginas/dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'estados/resultados', title: 'Estado de resultados', data: { roles: FIN }, loadComponent: () => import('./paginas/estados/resultados').then((m) => m.Resultados) },
      { path: 'estados/balance', title: 'Balance general', data: { roles: FIN }, loadComponent: () => import('./paginas/estados/balance').then((m) => m.BalanceGeneral) },
      { path: 'estados/flujo', title: 'Flujo de efectivo', data: { roles: FIN }, loadComponent: () => import('./paginas/estados/flujo').then((m) => m.FlujoEfectivo) },
      { path: 'estados/patrimonio', title: 'Cambios en el patrimonio', data: { roles: FIN }, loadComponent: () => import('./paginas/estados/patrimonio').then((m) => m.CambiosPatrimonio) },
      { path: 'analisis/razones', title: 'Razones financieras', data: { roles: FIN }, loadComponent: () => import('./paginas/analisis/razones').then((m) => m.Razones) },
      { path: 'analisis/vertical-horizontal', title: 'Análisis vertical y horizontal', data: { roles: FIN }, loadComponent: () => import('./paginas/analisis/vertical-horizontal').then((m) => m.VerticalHorizontal) },
      { path: 'analisis/horizontal', redirectTo: 'analisis/vertical-horizontal' },
      { path: 'analisis/fuentes-usos', title: 'Fuentes y usos y capital de trabajo', data: { roles: FIN }, loadComponent: () => import('./paginas/analisis/fuentes-usos').then((m) => m.FuentesUsos) },
      { path: 'analisis/equilibrio', title: 'Punto de equilibrio', data: { roles: FIN }, loadComponent: () => import('./paginas/analisis/equilibrio').then((m) => m.PuntoEquilibrio) },
      { path: 'analisis/dupont', title: 'Sistema DuPont y sumario', data: { roles: FIN }, loadComponent: () => import('./paginas/analisis/dupont').then((m) => m.DupontSumario) },
      { path: 'planeacion/proyeccion', title: 'Presupuesto', data: { roles: FIN }, loadComponent: () => import('./paginas/planeacion/proyeccion').then((m) => m.ProyeccionPresupuesto) },
      { path: 'planeacion/control', title: 'Control presupuestario', data: { roles: FIN }, loadComponent: () => import('./paginas/analisis/control').then((m) => m.ControlPresupuestario) },
      { path: 'contabilidad/cuentas', title: 'Catálogo de cuentas', data: { roles: FIN }, loadComponent: () => import('./paginas/contabilidad/cuentas').then((m) => m.CatalogoCuentas) },
      ...['productos', 'clientes', 'proveedores', 'lineas'].map((c) => ({
        path: `catalogos/${c}`,
        title: { productos: 'Productos', clientes: 'Clientes', proveedores: 'Proveedores', lineas: 'Líneas de producto' }[c],
        data: { catalogo: c },
        loadComponent: () => import('./paginas/catalogos/catalogo').then((m) => m.Catalogo)
      })),
      { path: 'configuracion/empresa', title: 'Empresa y parámetros', loadComponent: () => import('./paginas/configuracion/empresa').then((m) => m.ConfiguracionEmpresa) },
      { path: 'configuracion/usuarios', title: 'Usuarios', data: { roles: ['ADMIN'] }, loadComponent: () => import('./paginas/configuracion/usuarios').then((m) => m.Usuarios) },
      { path: 'configuracion/bitacora', title: 'Bitácora', data: { roles: ['ADMIN'] }, loadComponent: () => import('./paginas/configuracion/bitacora').then((m) => m.Bitacora) },
      ...pendientes
    ]
  },
  { path: '**', redirectTo: '' }
];
