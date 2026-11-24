import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  EQUIPAMIENTO_OPCIONES,
  ESTADOS_DISPONIBILIDAD,
  FiltroGuardado,
  FiltrosInmueble,
  MODALIDADES,
  OrdenInmueble,
  TIPOS_INMUEBLE,
  crearFiltrosVacios,
} from '../../models';
import { InmobiliariaService } from '../../services/inmobiliaria.service';
import { NotificationService } from '../../services/notification.service';
import { ImgFallbackDirective } from '../../shared/img-fallback.directive';
import { PrecioEcPipe } from '../../shared/precio-ec.pipe';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [FormsModule, RouterLink, ImgFallbackDirective, PrecioEcPipe],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.css',
})
export class CatalogoComponent {
  readonly service = inject(InmobiliariaService);
  private readonly notifications = inject(NotificationService);

  readonly tipos = TIPOS_INMUEBLE;
  readonly modalidades = MODALIDADES;
  readonly estados = ESTADOS_DISPONIBILIDAD;
  readonly equipamientos = EQUIPAMIENTO_OPCIONES;

  readonly filtros = signal<FiltrosInmueble>(crearFiltrosVacios());
  readonly vista = signal<'tarjetas' | 'tabla'>('tarjetas');
  readonly filtrosAvanzadosAbiertos = signal(true);
  readonly paginaActual = signal(1);
  readonly tamanioPagina = signal(6);
  readonly nombreNuevoFiltro = signal('');

  readonly resultados = computed(() => this.service.consultarInmuebles(this.filtros()));

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.resultados().length / this.tamanioPagina()))
  );

  readonly paginaSegura = computed(() => Math.min(this.paginaActual(), this.totalPaginas()));

  readonly inmueblesPaginados = computed(() => {
    const inicio = (this.paginaSegura() - 1) * this.tamanioPagina();
    return this.resultados().slice(inicio, inicio + this.tamanioPagina());
  });

  readonly paginasArray = computed(() =>
    Array.from({ length: this.totalPaginas() }, (_, idx) => idx + 1)
  );

  readonly rangoMostrado = computed(() => {
    const total = this.resultados().length;
    if (total === 0) return '0 resultados';
    const inicio = (this.paginaSegura() - 1) * this.tamanioPagina() + 1;
    const fin = Math.min(total, this.paginaSegura() * this.tamanioPagina());
    return `Mostrando ${inicio}–${fin} de ${total} inmuebles`;
  });

  actualizarFiltro<K extends keyof FiltrosInmueble>(clave: K, valor: FiltrosInmueble[K]): void {
    this.filtros.update((actual) => ({ ...actual, [clave]: valor }));
    this.paginaActual.set(1);
  }

  actualizarNumeroFiltro(
    clave: 'precioMin' | 'precioMax' | 'superficieMin' | 'superficieMax' | 'habitacionesMin',
    valorRaw: string | number | null
  ): void {
    const num =
      valorRaw === '' || valorRaw === null || valorRaw === undefined ? null : Number(valorRaw);
    this.actualizarFiltro(clave, num !== null && Number.isFinite(num) && num >= 0 ? num : null);
  }

  limpiarFiltros(): void {
    this.filtros.set(crearFiltrosVacios());
    this.paginaActual.set(1);
  }

  cambiarOrden(orden: OrdenInmueble): void {
    this.actualizarFiltro('orden', orden);
  }

  cambiarTamanioPagina(tam: number): void {
    this.tamanioPagina.set(Number(tam));
    this.paginaActual.set(1);
  }

  irAPagina(pagina: number): void {
    const segura = Math.max(1, Math.min(pagina, this.totalPaginas()));
    this.paginaActual.set(segura);
  }

  // Presets alineados con los casos de consulta de la Sección 7
  aplicarCasoCasasMachala(): void {
    this.filtros.set({
      ...crearFiltrosVacios(),
      ciudad: 'Machala',
      tipo: 'Casa',
      modalidad: 'Venta',
      disponibilidad: 'Disponible',
      precioMin: 80000,
      precioMax: 150000,
      orden: 'precio-asc',
    });
    this.paginaActual.set(1);
    this.notifications.mostrar('Caso aplicado: Casas disponibles en venta en Machala ($80.000 – $150.000).');
  }

  aplicarCasoVillasSuperficie(): void {
    this.filtros.set({
      ...crearFiltrosVacios(),
      tipo: 'Villa',
      superficieMin: 220,
      equipamiento: 'Piscina',
      orden: 'superficie-desc',
    });
    this.paginaActual.set(1);
    this.notifications.mostrar('Caso aplicado: Villas con superficie ≥ 220 m² y piscina.');
  }

  aplicarCasoAlquilerOrdenado(): void {
    this.filtros.set({
      ...crearFiltrosVacios(),
      modalidad: 'Alquiler',
      disponibilidad: 'Disponible',
      orden: 'alquiler-asc',
    });
    this.paginaActual.set(1);
    this.notifications.mostrar('Caso aplicado: Inmuebles disponibles en alquiler de menor a mayor canon.');
  }

  guardarFiltroActual(): void {
    const res = this.service.guardarFiltro(this.nombreNuevoFiltro(), this.filtros());
    if (res.ok) {
      this.nombreNuevoFiltro.set('');
      this.notifications.exito(res.mensaje);
    } else {
      this.notifications.advertencia(res.mensaje);
    }
  }

  aplicarFiltroGuardado(guardado: FiltroGuardado): void {
    this.filtros.set(structuredClone(guardado.filtros));
    this.paginaActual.set(1);
    this.notifications.mostrar(`Filtro "${guardado.nombre}" aplicado.`);
  }

  eliminarFiltroGuardado(id: string): void {
    this.service.eliminarFiltroGuardado(id);
    this.notifications.mostrar('Filtro guardado eliminado.');
  }

  nombreOficina(id: string | null): string {
    if (!id) return 'Propietario';
    return this.service.obtenerOficinaPorId(id)?.nombre ?? '—';
  }

  claseDisponibilidad(estado: string): string {
    return 'badge-' + estado.toLowerCase().replace(/\s+/g, '-');
  }

  claseModalidad(mod: string): string {
    return 'badge-' + mod.toLowerCase();
  }
}
