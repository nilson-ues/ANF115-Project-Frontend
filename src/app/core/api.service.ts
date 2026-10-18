import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from './config';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  get<T>(ruta: string, params: Record<string, string | number | undefined | null> = {}) {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    return firstValueFrom(this.http.get<T>(`${API_URL}${ruta}`, { params: p }));
  }

  post<T>(ruta: string, cuerpo: unknown) {
    return firstValueFrom(this.http.post<T>(`${API_URL}${ruta}`, cuerpo));
  }

  put<T>(ruta: string, cuerpo: unknown) {
    return firstValueFrom(this.http.put<T>(`${API_URL}${ruta}`, cuerpo));
  }
}
