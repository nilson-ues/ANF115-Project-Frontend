import { Component, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { exportarExcel, exportarPdf, TablaExport } from '../core/exportar';

@Component({
  selector: 'df-exportar',
  imports: [MatButtonModule, MatMenuModule],
  template: `
    <button mat-stroked-button [matMenuTriggerFor]="menu" [disabled]="trabajando()">
      <span class="material-symbols-outlined">download</span> Exportar
    </button>
    <mat-menu #menu="matMenu">
      <button mat-menu-item (click)="exportar('pdf')"><span class="material-symbols-outlined">picture_as_pdf</span> PDF</button>
      <button mat-menu-item (click)="exportar('excel')"><span class="material-symbols-outlined">table_view</span> Excel</button>
    </mat-menu>
  `,
  styles: `button[mat-menu-item] span { margin-right: 8px; vertical-align: middle; }`
})
export class Exportar {
  private aviso = inject(MatSnackBar);
  tablas = input.required<() => TablaExport[]>();
  archivo = input('reporte');
  trabajando = signal(false);

  async exportar(formato: 'pdf' | 'excel') {
    this.trabajando.set(true);
    try {
      const tablas = this.tablas()();
      if (formato === 'pdf') await exportarPdf(tablas, this.archivo());
      else await exportarExcel(tablas, this.archivo());
    } catch {
      this.aviso.open('No se pudo generar el archivo', 'Cerrar', { duration: 5000 });
    } finally {
      this.trabajando.set(false);
    }
  }
}
