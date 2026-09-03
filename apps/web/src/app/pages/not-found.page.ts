import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="screen">
      <h1>Página no encontrada</h1>
      <p>Ese pliego no está en esta estafeta.</p>
      <a class="btn btn-primary" routerLink="/">Volver al mostrador</a>
    </section>
  `,
})
export class NotFoundPage {}
