import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MENU, PENDIENTES } from '../../core/menu';

@Component({
  selector: 'df-pendiente',
  template: `
    <div class="pagina">
      <div class="encabezado">
        <div>
          <h1>{{ item?.titulo }}</h1>
          <div class="sub">{{ grupo?.titulo }}@if (grupo?.unidad) { · {{ grupo?.unidad }} }</div>
        </div>
      </div>
      <div class="tarjeta pronto">
        <span class="material-symbols-outlined icono">{{ item?.icono }}</span>
        <h2>Módulo en construcción</h2>
        <p>{{ info.descripcion }}</p>
        <div class="formula">{{ info.teoria }}</div>
      </div>
    </div>
  `,
  styles: `
    .pronto { max-width: 720px; text-align: center; padding: 40px; margin: 24px auto; }
    .icono { font-size: 48px; color: var(--df-accent); }
    h2 { margin: 12px 0 8px; }
    p { color: var(--df-muted); line-height: 1.55; }
    .formula { font-family: Menlo, monospace; font-size: 13px; background: var(--df-accent-soft); color: var(--df-navy); padding: 12px; border-radius: 8px; margin-top: 16px; }
  `
})
export class Pendiente {
  private ruta = inject(Router).url.split('?')[0];
  grupo = MENU.find((g) => g.items.some((i) => i.ruta === this.ruta));
  item = this.grupo?.items.find((i) => i.ruta === this.ruta);
  info = PENDIENTES[this.ruta] ?? { descripcion: '', teoria: '' };
}
