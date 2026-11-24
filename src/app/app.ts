import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { InmobiliariaService } from './services/inmobiliaria.service';
import { NotificationService } from './services/notification.service';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';
import { ToastContainerComponent } from './shared/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConfirmDialogComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly service = inject(InmobiliariaService);
  private readonly notifications = inject(NotificationService);

  readonly menuAbierto = signal(false);
  readonly confirmarReinicio = signal(false);
  readonly totalFavoritos = () => this.service.metricas().favoritos;

  toggleMenu(): void {
    this.menuAbierto.update((v) => !v);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  reiniciarDatos(): void {
    this.service.restaurarDatosIniciales();
    this.confirmarReinicio.set(false);
    this.notifications.exito('Datos iniciales restaurados correctamente.');
  }
}
