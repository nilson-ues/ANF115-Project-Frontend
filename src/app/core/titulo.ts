import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Injectable()
export class TituloDistrifarma extends TitleStrategy {
  private titulo = inject(Title);

  override updateTitle(estado: RouterStateSnapshot) {
    const t = this.buildTitle(estado);
    this.titulo.setTitle(t ? `${t} · DistriFarma ERP` : 'DistriFarma ERP');
  }
}
