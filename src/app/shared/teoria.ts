import { Component, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

export interface Teoria {
  titulo: string;
  formula: string;
  texto: string;
  fuente: string;
}

@Component({
  selector: 'df-teoria',
  imports: [MatButtonModule],
  template: `
    <button mat-stroked-button (click)="abierto.set(!abierto())">
      <span class="material-symbols-outlined">school</span> ¿Qué significa?
    </button>
    @if (abierto()) {
      <div class="fondo" (click)="abierto.set(false)"></div>
      <aside class="panel">
        <div class="cabecera">
          <span class="fuente">{{ fuente() }}</span>
          <button mat-icon-button (click)="abierto.set(false)" aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button>
        </div>
        @for (t of temas(); track t.titulo) {
          <section>
            <h3>{{ t.titulo }}</h3>
            <div class="formula">{{ t.formula }}</div>
            <p>{{ t.texto }}</p>
            <div class="ref">{{ t.fuente }}</div>
          </section>
        }
        <ng-content />
      </aside>
    }
  `,
  styles: `
    .fondo { position: fixed; inset: 0; background: rgba(15, 42, 68, 0.25); z-index: 90; }
    .panel { position: fixed; top: 0; right: 0; bottom: 0; width: min(440px, 92vw); background: white; z-index: 100;
      box-shadow: -12px 0 32px rgba(15, 42, 68, 0.18); padding: 16px 22px 32px; overflow-y: auto; }
    .cabecera { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .fuente { font-size: 12px; font-weight: 600; color: var(--df-accent); text-transform: uppercase; letter-spacing: 0.05em; }
    section { padding: 14px 0; border-bottom: 1px solid var(--df-border); }
    h3 { margin: 0 0 8px; font-size: 16px; }
    .formula { font-family: 'SFMono-Regular', Menlo, monospace; font-size: 12.5px; background: var(--df-accent-soft);
      color: var(--df-navy); padding: 10px 12px; border-radius: 8px; line-height: 1.5; }
    p { color: var(--df-text); line-height: 1.55; margin: 10px 0 6px; }
    .ref { font-size: 12px; color: var(--df-muted); }
  `
})
export class TeoriaPanel {
  temas = input.required<Teoria[]>();
  fuente = input('Teoría del curso ANF115');
  abierto = signal(false);
}
