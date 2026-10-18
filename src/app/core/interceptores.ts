import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService, Rol } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) auth.logout();
      return throwError(() => error);
    })
  );
};

export const autenticadoGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.autenticado()) return router.createUrlTree(['/login']);
  const roles = route.data?.['roles'] as Rol[] | undefined;
  return auth.tieneRol(roles) ? true : router.createUrlTree(['/']);
};

export function mensajeError(error: unknown): string {
  const e = error as HttpErrorResponse;
  if (e?.status === 0) return 'No se pudo conectar con la API. Verifique que el backend esté en ejecución.';
  return e?.error?.error?.message ?? 'Ocurrió un error inesperado';
}
