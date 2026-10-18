import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';
import { Rol } from '../../core/auth.service';
import { mensajeError } from '../../core/interceptores';

interface Usuario { id?: number; nombre: string; email: string; rol: Rol; activo: boolean; password?: string }

@Component({
  selector: 'df-usuarios',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule],
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>Usuarios</h1>
          <div class="sub">ADMIN: todo el sistema · FINANZAS: estados, análisis y presupuesto · VENTAS: clientes, ventas y cobros</div>
        </div>
        <div class="acciones"><button mat-flat-button (click)="abrir()"><span class="material-symbols-outlined">person_add</span> Nuevo usuario</button></div>
      </div>
      @if (error()) { <div class="aviso error">{{ error() }}</div> }
      <div class="tabla-scroll">
        <table class="estado">
          <thead><tr><th class="izq">Nombre</th><th class="izq">Correo</th><th class="izq">Rol</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            @for (u of usuarios(); track u.id) {
              <tr>
                <td>{{ u.nombre }}</td>
                <td>{{ u.email }}</td>
                <td><span class="chip gris">{{ u.rol }}</span></td>
                <td class="centro">@if (u.activo) { <span class="chip verde">Activo</span> } @else { <span class="chip rojo">Inactivo</span> }</td>
                <td class="centro"><button mat-icon-button (click)="abrir(u)" aria-label="Editar"><span class="material-symbols-outlined">edit</span></button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    @if (edicion(); as u) {
      <div class="fondo" (click)="edicion.set(null)"></div>
      <div class="dialogo">
        <h2>{{ u.id ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
        <form (ngSubmit)="guardar()">
          <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput [(ngModel)]="u.nombre" name="nombre" required /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Correo</mat-label><input matInput type="email" [(ngModel)]="u.email" name="email" required /></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Rol</mat-label>
            <mat-select [(ngModel)]="u.rol" name="rol">
              <mat-option value="ADMIN">Administrador</mat-option>
              <mat-option value="FINANZAS">Finanzas</mat-option>
              <mat-option value="VENTAS">Ventas</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ u.id ? 'Nueva contraseña (opcional)' : 'Contraseña' }}</mat-label>
            <input matInput type="password" [(ngModel)]="u.password" name="password" [required]="!u.id" minlength="8" />
            <mat-hint>Mínimo 8 caracteres</mat-hint>
          </mat-form-field>
          <mat-checkbox [(ngModel)]="u.activo" name="activo">Activo</mat-checkbox>
          <div class="botones">
            <button mat-button type="button" (click)="edicion.set(null)">Cancelar</button>
            <button mat-flat-button type="submit">Guardar</button>
          </div>
        </form>
      </div>
    }
  `,
  styles: `
    th.izq { text-align: left !important; } td.centro { text-align: center; }
    .fondo { position: fixed; inset: 0; background: rgba(15, 42, 68, 0.35); z-index: 90; }
    .dialogo { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 100; width: min(440px, 94vw);
      background: white; border-radius: 14px; padding: 22px 24px; box-shadow: 0 24px 60px rgba(15, 42, 68, 0.3); }
    .dialogo h2 { margin: 0 0 16px; font-size: 18px; }
    form { display: flex; flex-direction: column; gap: 2px; }
    .botones { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
  `
})
export class Usuarios {
  private api = inject(ApiService);
  private aviso = inject(MatSnackBar);
  usuarios = signal<Usuario[]>([]);
  edicion = signal<Usuario | null>(null);
  error = signal<string | null>(null);

  constructor() {
    this.cargar();
  }

  async cargar() {
    try {
      this.usuarios.set(await this.api.get<Usuario[]>('/usuarios'));
    } catch (e) {
      this.error.set(mensajeError(e));
    }
  }

  abrir(u?: Usuario) {
    this.edicion.set(u ? { ...u, password: '' } : { nombre: '', email: '', rol: 'VENTAS', activo: true, password: '' });
  }

  async guardar() {
    const u = this.edicion()!;
    const cuerpo = { nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo, ...(u.password ? { password: u.password } : {}) };
    try {
      if (u.id) await this.api.put(`/usuarios/${u.id}`, cuerpo);
      else await this.api.post('/usuarios', cuerpo);
      this.edicion.set(null);
      this.aviso.open('Usuario guardado', 'OK', { duration: 2500 });
      this.cargar();
    } catch (e) {
      this.aviso.open(mensajeError(e), 'Cerrar', { duration: 6000 });
    }
  }
}
