import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InmobiliariaService } from '../../services/inmobiliaria.service';
import { DatoGrafico } from '../../models';

interface SegmentoDonut {
  etiqueta: string;
  valor: number;
  porcentaje: number;
  color: string;
  dashArray: string;
  dashOffset: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly service = inject(InmobiliariaService);
  readonly metricas = this.service.metricas;

  readonly maxTipo = computed(() =>
    Math.max(1, ...this.metricas().porTipo.map((d) => d.valor))
  );

  readonly maxCiudad = computed(() =>
    Math.max(1, ...this.metricas().porCiudad.map((d) => d.valor))
  );

  readonly segmentosVisitas = computed<SegmentoDonut[]>(() => {
    const datos = this.metricas().visitasPorEstado;
    const total = datos.reduce((acc, d) => acc + d.valor, 0);
    const circunferencia = 2 * Math.PI * 52; // r = 52
    let acumulado = 0;

    return datos.map((d) => {
      const fraccion = total > 0 ? d.valor / total : 0;
      const longitud = fraccion * circunferencia;
      const seg: SegmentoDonut = {
        etiqueta: d.etiqueta,
        valor: d.valor,
        porcentaje: d.porcentaje,
        color: d.color,
        dashArray: `${longitud} ${circunferencia - longitud}`,
        dashOffset: -acumulado,
      };
      acumulado += longitud;
      return seg;
    });
  });

  readonly proximasVisitas = computed(() => {
    return this.service
      .visitas()
      .filter((v) => v.estaActiva)
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
      .slice(0, 5)
      .map((v) => ({
        visita: v,
        inmueble: this.service.obtenerInmueblePorId(v.inmuebleId),
        cliente: this.service.obtenerClientePorId(v.clienteId),
      }));
  });

  alturaBarra(dato: DatoGrafico, maximo: number): number {
    if (maximo <= 0) return 0;
    return Math.max(dato.valor > 0 ? 10 : 0, Math.round((dato.valor / maximo) * 100));
  }
}
