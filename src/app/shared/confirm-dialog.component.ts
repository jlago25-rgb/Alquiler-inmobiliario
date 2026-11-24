import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (visible) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" [attr.aria-label]="titulo">
        <div class="modal-panel modal-sm">
          <div class="modal-header">
            <h3>{{ titulo }}</h3>
            <button type="button" class="btn btn-ghost btn-icon" (click)="cancelar.emit()" aria-label="Cerrar">
              ✕
            </button>
          </div>
          <div class="modal-body">
            <p style="margin: 0; color: var(--slate-700);">{{ mensaje }}</p>
            @if (detalle) {
              <p style="margin: 0.6rem 0 0; font-size: 0.85rem; color: var(--slate-500);">{{ detalle }}</p>
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cancelar.emit()">
              {{ textoCancelar }}
            </button>
            <button
              type="button"
              class="btn"
              [class.btn-danger]="peligroso"
              [class.btn-primary]="!peligroso"
              (click)="confirmar.emit()"
            >
              {{ textoConfirmar }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  @Input() visible = false;
  @Input() titulo = 'Confirmar acción';
  @Input() mensaje = '¿Está seguro de continuar?';
  @Input() detalle = '';
  @Input() textoConfirmar = 'Confirmar';
  @Input() textoCancelar = 'Cancelar';
  @Input() peligroso = true;

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
}
