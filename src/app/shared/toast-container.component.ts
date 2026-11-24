import { Component, inject } from '@angular/core';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-stack no-print" aria-live="polite" aria-atomic="true">
      @for (m of notifications.mensajes(); track m.id) {
        <div class="toast-item" [class]="'toast-' + m.tipo" role="status">
          <span class="toast-text">{{ m.texto }}</span>
          <button
            type="button"
            class="toast-close"
            (click)="notifications.cerrar(m.id)"
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-stack {
      position: fixed;
      bottom: 1.25rem;
      right: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      z-index: 1200;
      max-width: 380px;
      width: calc(100vw - 2.5rem);
    }
    .toast-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.8rem 1rem;
      border-radius: 10px;
      color: #ffffff;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.22);
      font-size: 0.875rem;
      font-weight: 500;
      animation: slideIn 0.2s ease-out;
    }
    .toast-success { background: #146359; }
    .toast-error { background: #b91c1c; }
    .toast-warning { background: #b45309; }
    .toast-info { background: #132a46; }
    .toast-close {
      background: transparent;
      border: none;
      color: #ffffff;
      cursor: pointer;
      font-size: 0.9rem;
      opacity: 0.85;
      padding: 0;
    }
    .toast-close:hover { opacity: 1; }
    @keyframes slideIn {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `,
})
export class ToastContainerComponent {
  readonly notifications = inject(NotificationService);
}
