# DistriFarma ERP · Web

Frontend Angular 21 + Angular Material + ng2-charts del mini-ERP financiero de ANF115.

```bash
npm install
npm start        # http://localhost:4200  (requiere la API en http://localhost:3000)
npm run build
```

La URL de la API está en `src/app/core/config.ts`.

## Estructura

- `core/` sesión, interceptor JWT, guard por rol, formato de cifras, menú
- `layout/` barra lateral agrupada por unidad del curso
- `shared/` panel "¿Qué significa?", selector de período, tabla mensual
- `paginas/` tablero, estados financieros, análisis, planeación, catálogos y configuración

Los módulos marcados como "Pronto" en el menú (compras, ventas, kárdex, CxC, CxP, partidas, cierre, punto de equilibrio, presupuesto de caja, proyectos, crédito) ya tienen su ruta y la fórmula que aplicarán.

> Se usa Angular 21 porque Angular 22 exige Node ≥ 24.15. Al actualizar Node se puede migrar con `npx ng update @angular/core @angular/cli`.
