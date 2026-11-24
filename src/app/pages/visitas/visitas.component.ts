import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ESTADOS_VISITA, EstadoVisita, VisitaModel } from '../../models';
import { InmobiliariaService } from '../../services/inmobiliaria.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-visitas',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink, ConfirmDialogComponent],
  templateUrl: './visitas.component.html',
  styleUrl: './visitas.component.css',
})
export class VisitasComponent {
  readonly service = inject(InmobiliariaService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  readonly estados = ESTADOS_VISITA;

  // Filtros de historial (RF-06: historial por inmueble y por cliente)
  readonly filtroInmuebleId = signal('');
  readonly filtroClienteId = signal('');
  readonly filtroEstado = signal<EstadoVisita | ''>('');

  // Modales
  readonly modalProgramar = signal(false);
  readonly visitaReprogramar = signal<VisitaModel | null>(null);
  readonly visitaCompletar = signal<VisitaModel | null>(null);
  readonly visitaCancelar = signal<VisitaModel | null>(null);
  readonly visitaEliminar = signal<VisitaModel | null>(null);

  readonly impresionTexto = signal('');
  readonly motivoCancelacion = signal('');

  readonly formNueva = this.fb.group({
    inmuebleId: ['', [Validators.required]],
    clienteId: ['', [Validators.required]],
    fecha: [new Date().toISOString().slice(0, 10), [Validators.required]],
    hora: ['10:00', [Validators.required]],
    comentario: [''],
  });

  readonly formReprogramar = this.fb.group({
    fecha: ['', [Validators.required]],
    hora: ['', [Validators.required]],
    comentario: [''],
  });

  readonly visitasFiltradas = computed(() => {
    const inmId = this.filtroInmuebleId();
    const cliId = this.filtroClienteId();
    const est = this.filtroEstado();

    return this.service
      .visitas()
      .filter((v) => {
        if (inmId && v.inmuebleId !== inmId) return false;
        if (cliId && v.clienteId !== cliId) return false;
        if (est && v.estado !== est) return false;
        return true;
      })
      .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));
  });

  readonly resumenEstados = computed(() => {
    const lista = this.visitasFiltradas();
    return {
      total: lista.length,
      activas: lista.filter((v) => v.estaActiva).length,
      realizadas: lista.filter((v) => v.estado === 'Realizada').length,
      canceladas: lista.filter((v) => v.estado === 'Cancelada').length,
    };
  });

  constructor() {
    const inmParam = this.route.snapshot.queryParamMap.get('inmuebleId');
    if (inmParam && this.service.obtenerInmueblePorId(inmParam)) {
      this.filtroInmuebleId.set(inmParam);
      this.formNueva.controls.inmuebleId.setValue(inmParam);
    }
  }

  limpiarFiltros(): void {
    this.filtroInmuebleId.set('');
    this.filtroClienteId.set('');
    this.filtroEstado.set('');
  }

  abrirProgramar(): void {
    const inmPre = this.filtroInmuebleId() || this.service.inmuebles()[0]?.id || '';
    const cliPre = this.filtroClienteId() || this.service.clientes()[0]?.id || '';
    this.formNueva.reset({
      inmuebleId: inmPre,
      clienteId: cliPre,
      fecha: new Date().toISOString().slice(0, 10),
      hora: '10:00',
      comentario: '',
    });
    this.modalProgramar.set(true);
  }

  guardarNuevaVisita(): void {
    this.formNueva.markAllAsTouched();
    if (this.formNueva.invalid) {
      this.notifications.advertencia('Seleccione inmueble, cliente, fecha y hora.');
      return;
    }
    const v = this.formNueva.getRawValue();
    const res = this.service.programarVisita({
      inmuebleId: v.inmuebleId ?? '',
      clienteId: v.clienteId ?? '',
      fecha: v.fecha ?? '',
      hora: v.hora ?? '',
      estado: 'Programada',
      comentario: v.comentario ?? '',
    });

    if (res.ok) {
      this.notifications.exito(res.mensaje);
      this.modalProgramar.set(false);
    } else {
      this.notifications.error(res.mensaje);
    }
  }

  abrirReprogramar(visita: VisitaModel): void {
    this.visitaReprogramar.set(visita);
    this.formReprogramar.reset({
      fecha: visita.fecha,
      hora: visita.hora,
      comentario: visita.comentario,
    });
  }

  confirmarReprogramar(): void {
    const visita = this.visitaReprogramar();
    if (!visita) return;
    this.formReprogramar.markAllAsTouched();
    if (this.formReprogramar.invalid) return;

    const v = this.formReprogramar.getRawValue();
    const res = this.service.reprogramarVisita(
      visita.id,
      v.fecha ?? visita.fecha,
      v.hora ?? visita.hora,
      v.comentario ?? ''
    );

    if (res.ok) {
      this.notifications.exito('Visita reprogramada correctamente.');
      this.visitaReprogramar.set(null);
    } else {
      this.notifications.error(res.mensaje);
    }
  }

  abrirMarcarRealizada(visita: VisitaModel): void {
    this.visitaCompletar.set(visita);
    this.impresionTexto.set(visita.comentario);
  }

  confirmarRealizada(): void {
    const visita = this.visitaCompletar();
    if (!visita) return;
    const res = this.service.marcarVisitaRealizada(visita.id, this.impresionTexto());
    if (res.ok) {
      this.notifications.exito(res.mensaje);
      this.visitaCompletar.set(null);
    } else {
      this.notifications.error(res.mensaje);
    }
  }

  abrirCancelar(visita: VisitaModel): void {
    this.visitaCancelar.set(visita);
    this.motivoCancelacion.set('');
  }

  confirmarCancelar(): void {
    const visita = this.visitaCancelar();
    if (!visita) return;
    const res = this.service.cancelarVisita(visita.id, this.motivoCancelacion());
    if (res.ok) {
      this.notifications.mostrar(res.mensaje, 'warning');
      this.visitaCancelar.set(null);
    } else {
      this.notifications.error(res.mensaje);
    }
  }

  confirmarEliminar(): void {
    const visita = this.visitaEliminar();
    if (!visita) return;
    const res = this.service.eliminarVisita(visita.id);
    this.visitaEliminar.set(null);
    if (res.ok) this.notifications.exito(res.mensaje);
    else this.notifications.error(res.mensaje);
  }

  obtenerInmueble(id: string) {
    return this.service.obtenerInmueblePorId(id);
  }

  obtenerCliente(id: string) {
    return this.service.obtenerClientePorId(id);
  }

  claseEstado(estado: string): string {
    return 'badge-' + estado.toLowerCase();
  }
}
