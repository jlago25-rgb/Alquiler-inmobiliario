import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-container">
      <div class="empty-state" style="max-width: 560px; margin: 3rem auto; padding: 3rem 2rem;">
        <div style="font-size: 3rem; font-weight: 800; color: var(--navy-900); line-height: 1;">404</div>
        <h3>Ruta no encontrada</h3>
        <p>
          La página solicitada no existe o fue movida dentro de la plataforma InmoGestión 360.
        </p>
        <div style="display: flex; gap: 0.65rem; justify-content: center; flex-wrap: wrap;">
          <a routerLink="/dashboard" class="btn btn-primary">Ir al Dashboard</a>
          <a routerLink="/catalogo" class="btn btn-secondary">Ver Catálogo</a>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
