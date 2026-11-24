import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'precioEc',
  standalone: true,
})
export class PrecioEcPipe implements PipeTransform {
  transform(value: number | null | undefined, sufijo = ''): string {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return '—';
    }
    const formatted = new Intl.NumberFormat('es-EC', {
      maximumFractionDigits: 0,
    }).format(value);
    return `$ ${formatted}${sufijo}`;
  }
}
