import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { InmobiliariaService } from '../../services/inmobiliaria.service';
import { ImgFallbackDirective } from '../../shared/img-fallback.directive';
import { PrecioEcPipe } from '../../shared/precio-ec.pipe';

@Component({
  selector: 'app-inmueble-detalle',
  standalone: true,
  imports: [RouterLink, ImgFallbackDirective, PrecioEcPipe],
  templateUrl: './inmueble-detalle.component.html',
  styleUrl: './inmueble-detalle.component.css',
})
export class InmuebleDetalleComponent {
  private readonly route = inject(ActivatedRoute);
  readonly service = inject(InmobiliariaService);

  readonly inmuebleId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });

  readonly inmueble = computed(() => this.service.obtenerInmueblePorId(this.inmuebleId()));
  readonly propietario = computed(() =>
    this.service.obtenerPropietarioPorId(this.inmueble()?.propietarioId)
  );
  readonly oficinaResponsable = computed(() =>
    this.service.obtenerOficinaPorId(this.inmueble()?.oficinaResponsableId)
  );
  readonly oficinaLlaves = computed(() =>
    this.service.obtenerOficinaPorId(this.inmueble()?.oficinaLlavesId)
  );
  readonly visitas = computed(() =>
    this.inmueble() ? this.service.obtenerVisitasPorInmueble(this.inmueble()!.id) : []
  );

  readonly imagenActiva = signal('');

  constructor() {
    effect(() => {
      const inm = this.inmueble();
      this.imagenActiva.set(inm?.imagenPrincipal ?? '');
    });
  }

  seleccionarImagen(url: string): void {
    this.imagenActiva.set(url);
  }

  nombreCliente(clienteId: string): string {
    return this.service.obtenerClientePorId(clienteId)?.nombreCompleto ?? 'Cliente no registrado';
  }

  claseEstado(estado: string): string {
    return 'badge-' + estado.toLowerCase().replace(/\s+/g, '-');
  }
}
