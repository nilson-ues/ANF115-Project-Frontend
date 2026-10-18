import { Component, computed, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TemaPanel } from '../core/temas';

@Component({
  selector: 'df-que-significa',
  imports: [MatButtonModule],
  template: `
    <button mat-stroked-button (click)="abierto.set(true)">
      <span class="material-symbols-outlined">school</span> ¿Qué significa?
    </button>
    @if (abierto()) {
      <div class="fondo" (click)="abierto.set(false)"></div>
      <aside class="panel">
        <div class="cabecera">
          <span class="unidad">{{ tema().unidad }} · {{ tema().tema }}</span>
          <button mat-icon-button (click)="abierto.set(false)" aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button>
        </div>
        <h2>{{ tema().titulo }}</h2>
        <p>{{ tema().definicion }}</p>
        <h3>Fórmula</h3>
        <div class="formula">@for (f of tema().formulas; track f) { <div>{{ f }}</div> }</div>
        @if (calculo().length) {
          <h3>Cálculo con los datos de esta pantalla</h3>
          <ul class="calculo">@for (c of calculo(); track $index) { <li>{{ c }}</li> }</ul>
        }
        @if (interpretacion().length) {
          <h3>¿Cómo se interpreta?</h3>
          @for (t of interpretacion(); track $index) { <p>{{ t }}</p> }
        }
        <div class="fuente">{{ tema().fuente }}</div>
      </aside>
    }
  `,
  styles: `
    .fondo { position: fixed; inset: 0; background: rgba(15, 42, 68, 0.25); z-index: 90; }
    .panel { position: fixed; top: 0; right: 0; bottom: 0; width: min(460px, 92vw); background: white; z-index: 100;
      box-shadow: -12px 0 32px rgba(15, 42, 68, 0.18); padding: 16px 22px 32px; overflow-y: auto; }
    .cabecera { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .unidad { font-size: 12px; font-weight: 600; color: var(--df-accent); text-transform: uppercase; letter-spacing: 0.04em; }
    h2 { margin: 4px 0 8px; font-size: 19px; }
    h3 { margin: 18px 0 6px; font-size: 13px; color: var(--df-navy); }
    p { line-height: 1.55; margin: 6px 0; }
    .formula { font-family: Menlo, monospace; font-size: 12.5px; background: var(--df-accent-soft); color: var(--df-navy);
      padding: 10px 12px; border-radius: 8px; display: grid; gap: 4px; }
    .calculo { margin: 0; padding-left: 18px; display: grid; gap: 6px; font-size: 13px; font-variant-numeric: tabular-nums; }
    .fuente { margin-top: 18px; font-size: 12px; color: var(--df-muted); }
  `
})
export class QueSignifica<T> {
  tema = input.required<TemaPanel<T>>();
  datos = input<T | null>(null);
  abierto = signal(false);
  calculo = computed(() => {
    const d = this.datos();
    return d && this.tema().calculo ? this.tema().calculo!(d) : [];
  });
  interpretacion = computed(() => {
    const d = this.datos();
    return d && this.tema().interpretacion ? this.tema().interpretacion!(d) : [];
  });
}
