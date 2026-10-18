import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_URL } from './config';

export type Rol = 'ADMIN' | 'VENTAS' | 'FINANZAS';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

const CLAVE = 'distrifarma.sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private sesion = signal<{ token: string; usuario: Usuario } | null>(this.leer());

  usuario = computed(() => this.sesion()?.usuario ?? null);
  token = computed(() => this.sesion()?.token ?? null);
  autenticado = computed(() => this.sesion() !== null);

  async login(email: string, password: string) {
    const r = await firstValueFrom(this.http.post<{ token: string; usuario: Usuario }>(`${API_URL}/auth/login`, { email, password }));
    this.sesion.set(r);
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(r));
    } catch {}
  }

  logout() {
    this.sesion.set(null);
    try {
      sessionStorage.removeItem(CLAVE);
    } catch {}
    this.router.navigate(['/login']);
  }

  tieneRol(roles?: Rol[]) {
    const u = this.usuario();
    return !!u && (!roles || roles.includes(u.rol));
  }

  private leer() {
    try {
      const v = sessionStorage.getItem(CLAVE);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  }
}
