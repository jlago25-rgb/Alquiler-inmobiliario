import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ESTADOS_DISPONIBILIDAD,
  EstadoDisponibilidad,
  MODALIDADES,
  ModalidadOperacion,
  TIPOS_INMUEBLE,
  TipoInmueble,
  crearFiltrosVacios,
} from '../../models';
import { InmobiliariaService } from '../../services/inmobiliaria.service';
import { NotificationService } from '../../services/notification.service';
import { PrecioEcPipe } from '../../shared/precio-ec.pipe';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [FormsModule, RouterLink, PrecioEcPipe],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css',
})
export class ReportesComponent {
  readonly service = inject(InmobiliariaService);
  private readonly notifications = inject(NotificationService);

  readonly tipos = TIPOS_INMUEBLE;
  readonly modalidades = MODALIDADES;
  readonly estados = ESTADOS_DISPONIBILIDAD;
  readonly fechaGeneracion = new Date().toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  readonly ciudad = signal('');
  readonly tipo = signal<TipoInmueble | ''>('');
  readonly modalidad = signal<ModalidadOperacion | ''>('');
  readonly disponibilidad = signal<EstadoDisponibilidad | ''>('');
  readonly oficinaId = signal('');

  readonly inmueblesResumen = computed(() =>
    this.service.consultarInmuebles({
      ...crearFiltrosVacios(),
      ciudad: this.ciudad(),
      tipo: this.tipo(),
      modalidad: this.modalidad(),
      disponibilidad: this.disponibilidad(),
      oficinaId: this.oficinaId(),
    })
  );

  readonly totales = computed(() => {
    const lista = this.inmueblesResumen();
    const superficieTotal = lista.reduce((acc, i) => acc + i.superficieM2, 0);
    const ventas = lista.map((i) => i.precioVenta).filter((p): p is number => p !== null);
    const alquileres = lista.map((i) => i.precioAlquiler).filter((p): p is number => p !== null);
    return {
      cantidad: lista.length,
      superficieTotal,
      promedioVenta: ventas.length ? Math.round(ventas.reduce((a, b) => a + b, 0) / ventas.length) : null,
      promedioAlquiler: alquileres.length
        ? Math.round(alquileres.reduce((a, b) => a + b, 0) / alquileres.length)
        : null,
    };
  });

  limpiar(): void {
    this.ciudad.set('');
    this.tipo.set('');
    this.modalidad.set('');
    this.disponibilidad.set('');
    this.oficinaId.set('');
  }

  imprimirResumen(): void {
    window.print();
  }

  exportarCSV(): void {
    const csv = this.service.exportarInmueblesCSV(this.inmueblesResumen());
    this.descargarArchivo(csv, `inmogestion360-resumen-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
    this.notifications.exito('Resumen exportado en formato CSV.');
  }

  exportarJSON(): void {
    const json = this.service.exportarBackupJSON();
    this.descargarArchivo(json, `inmogestion360-respaldo-${new Date().toISOString().slice(0, 10)}.json`, 'application/json;charset=utf-8;');
    this.notifications.exito('Respaldo completo exportado en formato JSON.');
  }

  nombrePropietario(id: string): string {
    return this.service.obtenerPropietarioPorId(id)?.nombreCompleto ?? '—';
  }

  nombreOficina(id: string | null): string {
    if (!id) return 'Propietario';
    return this.service.obtenerOficinaPorId(id)?.nombre ?? '—';
  }

  private descargarArchivo(contenido: string, nombre: string, tipoMime: string): void {
    const blob = new Blob([contenido], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }
}
