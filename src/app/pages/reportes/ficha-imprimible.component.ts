import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { InmobiliariaService } from '../../services/inmobiliaria.service';
import { ImgFallbackDirective } from '../../shared/img-fallback.directive';
import { PrecioEcPipe } from '../../shared/precio-ec.pipe';

@Component({
  selector: 'app-ficha-imprimible',
  standalone: true,
  imports: [RouterLink, ImgFallbackDirective, PrecioEcPipe],
  templateUrl: './ficha-imprimible.component.html',
  styleUrl: './ficha-imprimible.component.css',
})
export class FichaImprimibleComponent {
  private readonly route = inject(ActivatedRoute);
  readonly service = inject(InmobiliariaService);

  readonly fechaEmision = new Date().toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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

  imprimir(): void {
    window.print();
  }

  nombreCliente(id: string): string {
    return this.service.obtenerClientePorId(id)?.nombreCompleto ?? '—';
  }
}
