import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { activa } from '../core/features';
import { MENU } from '../core/menu';

@Component({
  selector: 'df-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatMenuModule, MatTooltipModule],
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class Shell {
  auth = inject(AuthService);
  colapsado = signal(false);
  menu = computed(() =>
    MENU.filter((g) => activa(g.feature))
      .map((g) => ({ ...g, items: g.items.filter((i) => activa(i.feature) && this.auth.tieneRol(i.roles)) }))
      .filter((g) => g.items.length > 0)
  );
  iniciales = computed(() => (this.auth.usuario()?.nombre ?? '').split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase());
  rolTexto = computed(() => ({ ADMIN: 'Administrador', VENTAS: 'Ventas', FINANZAS: 'Finanzas' })[this.auth.usuario()?.rol ?? 'ADMIN']);
}
