import { Injectable, signal } from '@angular/core';

export type ToastTipo = 'success' | 'error' | 'warning' | 'info';

export interface ToastMensaje {
  id: number;
  tipo: ToastTipo;
  texto: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private counter = 0;
  readonly mensajes = signal<ToastMensaje[]>([]);

  mostrar(texto: string, tipo: ToastTipo = 'info', duracionMs = 4200): void {
    const id = ++this.counter;
    this.mensajes.update((lista) => [...lista, { id, tipo, texto }]);
    if (duracionMs > 0) {
      setTimeout(() => this.cerrar(id), duracionMs);
    }
  }

  exito(texto: string): void {
    this.mostrar(texto, 'success');
  }

  error(texto: string): void {
    this.mostrar(texto, 'error', 5500);
  }

  advertencia(texto: string): void {
    this.mostrar(texto, 'warning', 5000);
  }

  cerrar(id: number): void {
    this.mensajes.update((lista) => lista.filter((m) => m.id !== id));
  }
}
