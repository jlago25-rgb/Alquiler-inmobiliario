import { TestBed } from '@angular/core/testing';
import { InmobiliariaService } from './inmobiliaria.service';
import { crearFiltrosVacios } from '../models';

describe('InmobiliariaService', () => {
  let service: InmobiliariaService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(InmobiliariaService);
    service.restaurarDatosIniciales();
  });

  it('debe cargar el conjunto inicial mínimo (≥15 inmuebles, ≥5 propietarios, ≥3 oficinas, ≥12 visitas)', () => {
    expect(service.inmuebles().length).toBeGreaterThanOrEqual(15);
    expect(service.propietarios().length).toBeGreaterThanOrEqual(5);
    expect(service.oficinas().length).toBeGreaterThanOrEqual(3);
    expect(service.visitas().length).toBeGreaterThanOrEqual(12);
  });

  it('debe impedir referencias duplicadas al crear un inmueble', () => {
    const existente = service.inmuebles()[0];
    const res = service.crearInmueble({
      ...existente.toJSON(),
      titulo: 'Duplicado de prueba',
    });
    expect(res.ok).toBe(false);
    expect(res.mensaje).toContain(existente.referencia);
  });

  it('debe rechazar precios incompatibles con la modalidad elegida', () => {
    const base = service.inmuebles()[0].toJSON();
    const res = service.crearInmueble({
      ...base,
      referencia: 'REF-9991',
      modalidad: 'Venta',
      precioVenta: 90000,
      precioAlquiler: 500,
    });
    expect(res.ok).toBe(false);
  });

  it('debe proteger la integridad referencial al intentar eliminar un propietario u oficina con inmuebles', () => {
    const propConInmueble = service.inmuebles()[0].propietarioId;
    const ofiConInmueble = service.inmuebles()[0].oficinaResponsableId;

    expect(service.eliminarPropietario(propConInmueble).ok).toBe(false);
    expect(service.eliminarOficina(ofiConInmueble).ok).toBe(false);
  });

  it('debe impedir dos visitas activas en el mismo inmueble en la misma fecha y hora', () => {
    const visitaActiva = service.visitas().find((v) => v.estaActiva)!;
    const res = service.programarVisita({
      inmuebleId: visitaActiva.inmuebleId,
      clienteId: service.clientes()[0].id,
      fecha: visitaActiva.fecha,
      hora: visitaActiva.hora,
      estado: 'Programada',
      comentario: 'Conflicto esperado',
    });
    expect(res.ok).toBe(false);
    expect(res.mensaje).toContain('Conflicto de agenda');
  });

  it('debe combinar filtros sin alterar la lista original y resolver los casos de consulta', () => {
    const totalOriginal = service.inmuebles().length;

    // Caso 1: Casas disponibles en venta en Machala entre $80.000 y $150.000
    const casasMachala = service.consultarInmuebles({
      ...crearFiltrosVacios(),
      ciudad: 'Machala',
      tipo: 'Casa',
      modalidad: 'Venta',
      disponibilidad: 'Disponible',
      precioMin: 80000,
      precioMax: 150000,
    });
    expect(casasMachala.length).toBeGreaterThanOrEqual(2);
    expect(casasMachala.every((i) => i.ciudad === 'Machala' && i.tipo === 'Casa')).toBe(true);

    // Caso 3: Disponibles para alquiler ordenados de menor a mayor canon
    const alquilerOrdenado = service.consultarInmuebles({
      ...crearFiltrosVacios(),
      modalidad: 'Alquiler',
      disponibilidad: 'Disponible',
      orden: 'alquiler-asc',
    });
    expect(alquilerOrdenado.length).toBeGreaterThan(0);
    for (let i = 1; i < alquilerOrdenado.length; i++) {
      expect(alquilerOrdenado[i].precioAlquiler!).toBeGreaterThanOrEqual(
        alquilerOrdenado[i - 1].precioAlquiler!
      );
    }

    // La lista original no se mutó
    expect(service.inmuebles().length).toBe(totalOriginal);
  });

  it('debe actualizar dinámicamente las métricas del dashboard al registrar un inmueble', () => {
    const antes = service.metricas().totalInmuebles;
    const base = service.inmuebles()[0].toJSON();
    const res = service.crearInmueble({
      ...base,
      referencia: 'REF-8888',
      titulo: 'Nueva propiedad para prueba de dashboard',
      modalidad: 'Alquiler',
      precioVenta: null,
      precioAlquiler: 720,
      disponibilidad: 'Disponible',
    });
    expect(res.ok).toBe(true);
    expect(service.metricas().totalInmuebles).toBe(antes + 1);
  });
});
