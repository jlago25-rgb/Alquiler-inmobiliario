import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  Cliente,
  ClienteModel,
  DashboardMetricas,
  DatoGrafico,
  ESTADOS_VISITA,
  FiltroGuardado,
  FiltrosInmueble,
  IndicadorOficina,
  Inmueble,
  InmuebleModel,
  Oficina,
  OficinaModel,
  Propietario,
  PropietarioModel,
  TIPOS_INMUEBLE,
  Visita,
  VisitaModel,
} from '../models';
import {
  SEED_CLIENTES,
  SEED_INMUEBLES,
  SEED_OFICINAS,
  SEED_PROPIETARIOS,
  SEED_VISITAS,
} from '../data/seed-data';
import { StorageService } from './storage.service';

export interface ResultadoOperacion<T = void> {
  ok: boolean;
  mensaje: string;
  data?: T;
}

const PALETA_GRAFICOS = [
  '#1b7a6e',
  '#2b6cb0',
  '#132a46',
  '#d97706',
  '#475569',
  '#0f766e',
  '#2563eb',
];

const COLORES_VISITA: Record<string, string> = {
  Programada: '#2b6cb0',
  Reprogramada: '#d97706',
  Realizada: '#1b7a6e',
  Cancelada: '#dc2626',
};

@Injectable({ providedIn: 'root' })
export class InmobiliariaService {
  private readonly storage = inject(StorageService);

  private readonly _oficinas = signal<OficinaModel[]>(
    this.storage.load<Oficina[]>('oficinas', SEED_OFICINAS).map((o) => OficinaModel.fromJSON(o))
  );
  private readonly _propietarios = signal<PropietarioModel[]>(
    this.storage
      .load<Propietario[]>('propietarios', SEED_PROPIETARIOS)
      .map((p) => PropietarioModel.fromJSON(p))
  );
  private readonly _clientes = signal<ClienteModel[]>(
    this.storage.load<Cliente[]>('clientes', SEED_CLIENTES).map((c) => ClienteModel.fromJSON(c))
  );
  private readonly _inmuebles = signal<InmuebleModel[]>(
    this.storage.load<Inmueble[]>('inmuebles', SEED_INMUEBLES).map((i) => InmuebleModel.fromJSON(i))
  );
  private readonly _visitas = signal<VisitaModel[]>(
    this.storage.load<Visita[]>('visitas', SEED_VISITAS).map((v) => VisitaModel.fromJSON(v))
  );
  private readonly _filtrosGuardados = signal<FiltroGuardado[]>(
    this.storage.load<FiltroGuardado[]>('filtros_guardados', [])
  );

  readonly oficinas = this._oficinas.asReadonly();
  readonly propietarios = this._propietarios.asReadonly();
  readonly clientes = this._clientes.asReadonly();
  readonly inmuebles = this._inmuebles.asReadonly();
  readonly visitas = this._visitas.asReadonly();
  readonly filtrosGuardados = this._filtrosGuardados.asReadonly();

  readonly ciudadesDisponibles = computed(() =>
    Array.from(new Set(this._inmuebles().map((i) => i.ciudad))).sort((a, b) => a.localeCompare(b))
  );

  readonly cantonesDisponibles = computed(() =>
    Array.from(new Set(this._inmuebles().map((i) => i.canton))).sort((a, b) => a.localeCompare(b))
  );

  readonly zonasDisponibles = computed(() =>
    Array.from(new Set(this._inmuebles().map((i) => i.zona))).sort((a, b) => a.localeCompare(b))
  );

  readonly metricas = computed<DashboardMetricas>(() => {
    const inmuebles = this._inmuebles();
    const visitas = this._visitas();
    const oficinas = this._oficinas();
    const total = inmuebles.length;

    const disponibles = inmuebles.filter((i) => i.disponibilidad === 'Disponible').length;
    const enVenta = inmuebles.filter((i) => i.ofreceVenta).length;
    const enAlquiler = inmuebles.filter((i) => i.ofreceAlquiler).length;
    const ambasModalidades = inmuebles.filter((i) => i.modalidad === 'Ambas').length;
    const favoritos = inmuebles.filter((i) => i.esFavorito).length;

    const visitasProgramadas = visitas.filter(
      (v) => v.estado === 'Programada' || v.estado === 'Reprogramada'
    ).length;
    const visitasRealizadas = visitas.filter((v) => v.estado === 'Realizada').length;
    const visitasCanceladas = visitas.filter((v) => v.estado === 'Cancelada').length;

    // Inmuebles por ciudad
    const mapaCiudad = new Map<string, number>();
    for (const inm of inmuebles) {
      mapaCiudad.set(inm.ciudad, (mapaCiudad.get(inm.ciudad) ?? 0) + 1);
    }
    const porCiudad: DatoGrafico[] = Array.from(mapaCiudad.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([etiqueta, valor], idx) => ({
        etiqueta,
        valor,
        porcentaje: total > 0 ? Math.round((valor / total) * 100) : 0,
        color: PALETA_GRAFICOS[idx % PALETA_GRAFICOS.length],
      }));

    // Inmuebles por tipo
    const porTipo: DatoGrafico[] = TIPOS_INMUEBLE.map((tipo, idx) => {
      const valor = inmuebles.filter((i) => i.tipo === tipo).length;
      return {
        etiqueta: tipo,
        valor,
        porcentaje: total > 0 ? Math.round((valor / total) * 100) : 0,
        color: PALETA_GRAFICOS[idx % PALETA_GRAFICOS.length],
      };
    });

    // Visitas por estado
    const totalVisitas = visitas.length;
    const visitasPorEstado: DatoGrafico[] = ESTADOS_VISITA.map((estado) => {
      const valor = visitas.filter((v) => v.estado === estado).length;
      return {
        etiqueta: estado,
        valor,
        porcentaje: totalVisitas > 0 ? Math.round((valor / totalVisitas) * 100) : 0,
        color: COLORES_VISITA[estado] ?? '#475569',
      };
    });

    // Indicadores por oficina
    const porOficina: IndicadorOficina[] = oficinas.map((oficina) => {
      const asociados = inmuebles.filter((i) => i.oficinaResponsableId === oficina.id);
      const idsAsociados = new Set(asociados.map((i) => i.id));
      return {
        oficinaId: oficina.id,
        nombre: oficina.nombre,
        ciudad: oficina.ciudad,
        inmueblesResponsable: asociados.length,
        disponibles: asociados.filter((i) => i.disponibilidad === 'Disponible').length,
        custodiaLlaves: inmuebles.filter((i) => i.oficinaLlavesId === oficina.id).length,
        visitasActivas: visitas.filter((v) => idsAsociados.has(v.inmuebleId) && v.estaActiva).length,
      };
    });

    return {
      totalInmuebles: total,
      disponibles,
      enVenta,
      enAlquiler,
      ambasModalidades,
      totalVisitas,
      visitasProgramadas,
      visitasRealizadas,
      visitasCanceladas,
      favoritos,
      porCiudad,
      porTipo,
      visitasPorEstado,
      porOficina,
    };
  });

  constructor() {
    effect(() => {
      this.storage.save(
        'oficinas',
        this._oficinas().map((o) => o.toJSON())
      );
    });
    effect(() => {
      this.storage.save(
        'propietarios',
        this._propietarios().map((p) => p.toJSON())
      );
    });
    effect(() => {
      this.storage.save(
        'clientes',
        this._clientes().map((c) => c.toJSON())
      );
    });
    effect(() => {
      this.storage.save(
        'inmuebles',
        this._inmuebles().map((i) => i.toJSON())
      );
    });
    effect(() => {
      this.storage.save(
        'visitas',
        this._visitas().map((v) => v.toJSON())
      );
    });
    effect(() => {
      this.storage.save('filtros_guardados', this._filtrosGuardados());
    });
  }

  // ==================== LOOKUPS ====================

  obtenerInmueblePorId(id: string): InmuebleModel | undefined {
    return this._inmuebles().find((i) => i.id === id);
  }

  obtenerOficinaPorId(id: string | null | undefined): OficinaModel | undefined {
    if (!id) return undefined;
    return this._oficinas().find((o) => o.id === id);
  }

  obtenerPropietarioPorId(id: string | null | undefined): PropietarioModel | undefined {
    if (!id) return undefined;
    return this._propietarios().find((p) => p.id === id);
  }

  obtenerClientePorId(id: string | null | undefined): ClienteModel | undefined {
    if (!id) return undefined;
    return this._clientes().find((c) => c.id === id);
  }

  obtenerVisitasPorInmueble(inmuebleId: string): VisitaModel[] {
    return this._visitas()
      .filter((v) => v.inmuebleId === inmuebleId)
      .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));
  }

  obtenerVisitasPorCliente(clienteId: string): VisitaModel[] {
    return this._visitas()
      .filter((v) => v.clienteId === clienteId)
      .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));
  }

  referenciaExiste(referencia: string, ignorarId?: string): boolean {
    const norm = referencia.trim().toUpperCase();
    return this._inmuebles().some(
      (i) => i.referencia.toUpperCase() === norm && i.id !== ignorarId
    );
  }

  // ==================== CONSULTAS AVANZADAS (INMUTABLE) ====================

  consultarInmuebles(filtros: FiltrosInmueble): InmuebleModel[] {
    const texto = filtros.busqueda.trim().toLowerCase();

    const resultado = this._inmuebles().filter((inm) => {
      if (texto) {
        const prop = this.obtenerPropietarioPorId(inm.propietarioId);
        const ofi = this.obtenerOficinaPorId(inm.oficinaResponsableId);
        const haystack = [
          inm.referencia,
          inm.titulo,
          inm.tipo,
          inm.direccion,
          inm.ciudad,
          inm.canton,
          inm.zona,
          inm.descripcion,
          prop?.nombreCompleto ?? '',
          ofi?.nombre ?? '',
          inm.caracteristicas.villa?.urbanizacion ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(texto)) return false;
      }

      if (filtros.ciudad && inm.ciudad.toLowerCase() !== filtros.ciudad.toLowerCase()) {
        return false;
      }
      if (filtros.canton && inm.canton.toLowerCase() !== filtros.canton.toLowerCase()) {
        return false;
      }
      if (filtros.zona && !inm.zona.toLowerCase().includes(filtros.zona.toLowerCase())) {
        return false;
      }
      if (filtros.tipo && inm.tipo !== filtros.tipo) {
        return false;
      }
      if (filtros.modalidad) {
        if (filtros.modalidad === 'Venta' && !inm.ofreceVenta) return false;
        if (filtros.modalidad === 'Alquiler' && !inm.ofreceAlquiler) return false;
        if (filtros.modalidad === 'Ambas' && inm.modalidad !== 'Ambas') return false;
      }
      if (filtros.disponibilidad && inm.disponibilidad !== filtros.disponibilidad) {
        return false;
      }
      if (filtros.oficinaId) {
        const coincideOficina =
          inm.oficinaResponsableId === filtros.oficinaId ||
          inm.oficinaLlavesId === filtros.oficinaId;
        if (!coincideOficina) return false;
      }
      if (filtros.soloFavoritos && !inm.esFavorito) {
        return false;
      }

      // Rango de superficie
      if (filtros.superficieMin !== null && inm.superficieM2 < filtros.superficieMin) {
        return false;
      }
      if (filtros.superficieMax !== null && inm.superficieM2 > filtros.superficieMax) {
        return false;
      }

      // Rango de precios respetando la modalidad filtrada
      if (filtros.precioMin !== null || filtros.precioMax !== null) {
        const preciosComparables: number[] = [];
        if (filtros.modalidad === 'Venta') {
          if (inm.precioVenta !== null) preciosComparables.push(inm.precioVenta);
        } else if (filtros.modalidad === 'Alquiler') {
          if (inm.precioAlquiler !== null) preciosComparables.push(inm.precioAlquiler);
        } else {
          if (inm.precioVenta !== null) preciosComparables.push(inm.precioVenta);
          if (inm.precioAlquiler !== null) preciosComparables.push(inm.precioAlquiler);
        }

        if (preciosComparables.length === 0) return false;
        const cumpleRango = preciosComparables.some((p) => {
          const minOk = filtros.precioMin === null || p >= filtros.precioMin;
          const maxOk = filtros.precioMax === null || p <= filtros.precioMax;
          return minOk && maxOk;
        });
        if (!cumpleRango) return false;
      }

      // Características específicas
      if (filtros.habitacionesMin !== null && inm.habitaciones < filtros.habitacionesMin) {
        return false;
      }
      if (filtros.equipamiento) {
        const eqNorm = filtros.equipamiento.toLowerCase();
        const tieneEq = inm.equipamientoLista.some((e) => e.toLowerCase() === eqNorm);
        if (!tieneEq) return false;
      }

      return true;
    });

    // Ordenamiento sobre copia sin mutar la lista original
    return [...resultado].sort((a, b) => {
      switch (filtros.orden) {
        case 'precio-asc':
          return a.precioOrdenReferencia - b.precioOrdenReferencia;
        case 'precio-desc':
          return b.precioOrdenReferencia - a.precioOrdenReferencia;
        case 'alquiler-asc':
          return (a.precioAlquiler ?? Number.MAX_SAFE_INTEGER) - (b.precioAlquiler ?? Number.MAX_SAFE_INTEGER);
        case 'alquiler-desc':
          return (b.precioAlquiler ?? -1) - (a.precioAlquiler ?? -1);
        case 'superficie-asc':
          return a.superficieM2 - b.superficieM2;
        case 'superficie-desc':
          return b.superficieM2 - a.superficieM2;
        case 'referencia-asc':
        default:
          return a.referencia.localeCompare(b.referencia);
      }
    });
  }

  // ==================== CRUD INMUEBLES ====================

  crearInmueble(datos: Omit<Inmueble, 'id' | 'fechaRegistro'>): ResultadoOperacion<InmuebleModel> {
    const validacion = this.validarInmueble(datos);
    if (!validacion.ok) return { ok: false, mensaje: validacion.mensaje };

    const nuevo = new InmuebleModel({
      ...datos,
      id: this.generarId('INM', this._inmuebles().map((i) => i.id)),
      fechaRegistro: new Date().toISOString().slice(0, 10),
    });

    this._inmuebles.update((lista) => [nuevo, ...lista]);
    return { ok: true, mensaje: `Inmueble ${nuevo.referencia} registrado correctamente.`, data: nuevo };
  }

  actualizarInmueble(id: string, datos: Omit<Inmueble, 'id' | 'fechaRegistro'>): ResultadoOperacion<InmuebleModel> {
    const existente = this.obtenerInmueblePorId(id);
    if (!existente) {
      return { ok: false, mensaje: 'No se encontró el inmueble seleccionado.' };
    }

    const validacion = this.validarInmueble(datos, id);
    if (!validacion.ok) return { ok: false, mensaje: validacion.mensaje };

    const actualizado = new InmuebleModel({
      ...datos,
      id,
      fechaRegistro: existente.fechaRegistro,
      esFavorito: datos.esFavorito ?? existente.esFavorito,
    });

    this._inmuebles.update((lista) => lista.map((item) => (item.id === id ? actualizado : item)));
    return {
      ok: true,
      mensaje: `Inmueble ${actualizado.referencia} actualizado correctamente.`,
      data: actualizado,
    };
  }

  eliminarInmueble(id: string): ResultadoOperacion {
    const inmueble = this.obtenerInmueblePorId(id);
    if (!inmueble) {
      return { ok: false, mensaje: 'El inmueble no existe.' };
    }
    const visitasActivas = this._visitas().filter((v) => v.inmuebleId === id && v.estaActiva);
    if (visitasActivas.length > 0) {
      return {
        ok: false,
        mensaje: `No se puede eliminar ${inmueble.referencia} porque tiene ${visitasActivas.length} visita(s) activa(s). Cancele o finalice las visitas primero.`,
      };
    }

    // Limpiar historial de visitas canceladas/realizadas vinculadas
    this._visitas.update((lista) => lista.filter((v) => v.inmuebleId !== id));
    this._inmuebles.update((lista) => lista.filter((i) => i.id !== id));
    return { ok: true, mensaje: `Inmueble ${inmueble.referencia} eliminado correctamente.` };
  }

  alternarFavorito(id: string): void {
    this._inmuebles.update((lista) =>
      lista.map((inm) => {
        if (inm.id !== id) return inm;
        const json = inm.toJSON();
        json.esFavorito = !inm.esFavorito;
        return new InmuebleModel(json);
      })
    );
  }

  private validarInmueble(
    datos: Omit<Inmueble, 'id' | 'fechaRegistro'>,
    ignorarId?: string
  ): ResultadoOperacion {
    const ref = datos.referencia.trim().toUpperCase();
    if (!ref) {
      return { ok: false, mensaje: 'La referencia única es obligatoria.' };
    }
    if (this.referenciaExiste(ref, ignorarId)) {
      return { ok: false, mensaje: `Ya existe un inmueble con la referencia ${ref}.` };
    }
    if (!Number.isFinite(datos.superficieM2) || datos.superficieM2 <= 0) {
      return { ok: false, mensaje: 'La superficie en m² debe ser mayor que cero.' };
    }
    if (datos.modalidad === 'Venta') {
      if (datos.precioVenta === null || datos.precioVenta <= 0) {
        return { ok: false, mensaje: 'Debe ingresar un precio de venta positivo.' };
      }
      if (datos.precioAlquiler !== null && datos.precioAlquiler !== undefined) {
        return { ok: false, mensaje: 'Un inmueble solo en Venta no puede registrar precio de alquiler.' };
      }
    } else if (datos.modalidad === 'Alquiler') {
      if (datos.precioAlquiler === null || datos.precioAlquiler <= 0) {
        return { ok: false, mensaje: 'Debe ingresar un canon de alquiler positivo.' };
      }
      if (datos.precioVenta !== null && datos.precioVenta !== undefined) {
        return { ok: false, mensaje: 'Un inmueble solo en Alquiler no puede registrar precio de venta.' };
      }
    } else if (datos.modalidad === 'Ambas') {
      if (
        datos.precioVenta === null ||
        datos.precioVenta <= 0 ||
        datos.precioAlquiler === null ||
        datos.precioAlquiler <= 0
      ) {
        return {
          ok: false,
          mensaje: 'La modalidad Ambas requiere precio de venta y precio de alquiler positivos.',
        };
      }
    }

    if (!this.obtenerPropietarioPorId(datos.propietarioId)) {
      return { ok: false, mensaje: 'Debe seleccionar un propietario válido.' };
    }
    if (!this.obtenerOficinaPorId(datos.oficinaResponsableId)) {
      return { ok: false, mensaje: 'Debe seleccionar una oficina responsable válida.' };
    }
    if (datos.oficinaLlavesId && !this.obtenerOficinaPorId(datos.oficinaLlavesId)) {
      return { ok: false, mensaje: 'La oficina que custodia las llaves no es válida.' };
    }

    return { ok: true, mensaje: 'Válido' };
  }

  // ==================== CRUD PROPIETARIOS ====================

  crearPropietario(datos: Omit<Propietario, 'id'>): ResultadoOperacion<PropietarioModel> {
    const idNorm = datos.identificacion.trim();
    if (this._propietarios().some((p) => p.identificacion === idNorm)) {
      return { ok: false, mensaje: `Ya existe un propietario con identificación ${idNorm}.` };
    }
    const nuevo = new PropietarioModel({
      ...datos,
      id: this.generarId('PROP', this._propietarios().map((p) => p.id)),
    });
    this._propietarios.update((lista) => [nuevo, ...lista]);
    return { ok: true, mensaje: `Propietario ${nuevo.nombreCompleto} registrado.`, data: nuevo };
  }

  actualizarPropietario(id: string, datos: Omit<Propietario, 'id'>): ResultadoOperacion<PropietarioModel> {
    const idNorm = datos.identificacion.trim();
    if (this._propietarios().some((p) => p.identificacion === idNorm && p.id !== id)) {
      return { ok: false, mensaje: `Otro propietario ya usa la identificación ${idNorm}.` };
    }
    const actualizado = new PropietarioModel({ ...datos, id });
    this._propietarios.update((lista) => lista.map((p) => (p.id === id ? actualizado : p)));
    return { ok: true, mensaje: `Propietario ${actualizado.nombreCompleto} actualizado.`, data: actualizado };
  }

  eliminarPropietario(id: string): ResultadoOperacion {
    const prop = this.obtenerPropietarioPorId(id);
    if (!prop) return { ok: false, mensaje: 'Propietario no encontrado.' };

    const inmueblesAsociados = this._inmuebles().filter((i) => i.propietarioId === id);
    if (inmueblesAsociados.length > 0) {
      const refs = inmueblesAsociados.map((i) => i.referencia).join(', ');
      return {
        ok: false,
        mensaje: `No se puede eliminar a ${prop.nombreCompleto}: tiene ${inmueblesAsociados.length} inmueble(s) asociado(s) (${refs}). Reasigne o elimine esos inmuebles primero.`,
      };
    }

    this._propietarios.update((lista) => lista.filter((p) => p.id !== id));
    return { ok: true, mensaje: `Propietario ${prop.nombreCompleto} eliminado.` };
  }

  // ==================== CRUD OFICINAS ====================

  crearOficina(datos: Omit<Oficina, 'id'>): ResultadoOperacion<OficinaModel> {
    const codNorm = datos.codigo.trim().toUpperCase();
    if (this._oficinas().some((o) => o.codigo.toUpperCase() === codNorm)) {
      return { ok: false, mensaje: `Ya existe una oficina con el código ${codNorm}.` };
    }
    const nueva = new OficinaModel({
      ...datos,
      id: this.generarId('OFI', this._oficinas().map((o) => o.id)),
    });
    this._oficinas.update((lista) => [nueva, ...lista]);
    return { ok: true, mensaje: `Oficina ${nueva.nombre} registrada.`, data: nueva };
  }

  actualizarOficina(id: string, datos: Omit<Oficina, 'id'>): ResultadoOperacion<OficinaModel> {
    const codNorm = datos.codigo.trim().toUpperCase();
    if (this._oficinas().some((o) => o.codigo.toUpperCase() === codNorm && o.id !== id)) {
      return { ok: false, mensaje: `Otra oficina ya utiliza el código ${codNorm}.` };
    }
    const actualizada = new OficinaModel({ ...datos, id });
    this._oficinas.update((lista) => lista.map((o) => (o.id === id ? actualizada : o)));
    return { ok: true, mensaje: `Oficina ${actualizada.nombre} actualizada.`, data: actualizada };
  }

  eliminarOficina(id: string): ResultadoOperacion {
    const oficina = this.obtenerOficinaPorId(id);
    if (!oficina) return { ok: false, mensaje: 'Oficina no encontrada.' };

    const inmueblesResp = this._inmuebles().filter((i) => i.oficinaResponsableId === id);
    const inmueblesLlaves = this._inmuebles().filter((i) => i.oficinaLlavesId === id);
    if (inmueblesResp.length > 0 || inmueblesLlaves.length > 0) {
      const refs = Array.from(
        new Set([...inmueblesResp, ...inmueblesLlaves].map((i) => i.referencia))
      ).join(', ');
      return {
        ok: false,
        mensaje: `No se puede eliminar ${oficina.nombre}: gestiona o custodia llaves de inmuebles asociados (${refs}). Reasigne esas relaciones antes de eliminar.`,
      };
    }

    this._oficinas.update((lista) => lista.filter((o) => o.id !== id));
    return { ok: true, mensaje: `Oficina ${oficina.nombre} eliminada.` };
  }

  // ==================== CRUD CLIENTES ====================

  crearCliente(datos: Omit<Cliente, 'id'>): ResultadoOperacion<ClienteModel> {
    const idNorm = datos.identificacion.trim();
    if (this._clientes().some((c) => c.identificacion === idNorm)) {
      return { ok: false, mensaje: `Ya existe un cliente con identificación ${idNorm}.` };
    }
    const nuevo = new ClienteModel({
      ...datos,
      id: this.generarId('CLI', this._clientes().map((c) => c.id)),
    });
    this._clientes.update((lista) => [nuevo, ...lista]);
    return { ok: true, mensaje: `Cliente ${nuevo.nombreCompleto} registrado.`, data: nuevo };
  }

  actualizarCliente(id: string, datos: Omit<Cliente, 'id'>): ResultadoOperacion<ClienteModel> {
    const idNorm = datos.identificacion.trim();
    if (this._clientes().some((c) => c.identificacion === idNorm && c.id !== id)) {
      return { ok: false, mensaje: `Otro cliente ya usa la identificación ${idNorm}.` };
    }
    const actualizado = new ClienteModel({ ...datos, id });
    this._clientes.update((lista) => lista.map((c) => (c.id === id ? actualizado : c)));
    return { ok: true, mensaje: `Cliente ${actualizado.nombreCompleto} actualizado.`, data: actualizado };
  }

  eliminarCliente(id: string): ResultadoOperacion {
    const cliente = this.obtenerClientePorId(id);
    if (!cliente) return { ok: false, mensaje: 'Cliente no encontrado.' };

    const visitasAsociadas = this._visitas().filter((v) => v.clienteId === id && v.estaActiva);
    if (visitasAsociadas.length > 0) {
      return {
        ok: false,
        mensaje: `No se puede eliminar a ${cliente.nombreCompleto}: tiene ${visitasAsociadas.length} visita(s) activa(s).`,
      };
    }

    this._visitas.update((lista) => lista.filter((v) => v.clienteId !== id));
    this._clientes.update((lista) => lista.filter((c) => c.id !== id));
    return { ok: true, mensaje: `Cliente ${cliente.nombreCompleto} eliminado.` };
  }

  // ==================== GESTIÓN DE VISITAS ====================

  programarVisita(datos: Omit<Visita, 'id'>): ResultadoOperacion<VisitaModel> {
    const validacion = this.validarVisita(datos);
    if (!validacion.ok) return { ok: false, mensaje: validacion.mensaje };

    const nueva = new VisitaModel({
      ...datos,
      id: this.generarId('VIS', this._visitas().map((v) => v.id)),
    });
    this._visitas.update((lista) => [nueva, ...lista]);
    return { ok: true, mensaje: 'Visita programada correctamente.', data: nueva };
  }

  actualizarVisita(id: string, datos: Omit<Visita, 'id'>): ResultadoOperacion<VisitaModel> {
    const existente = this._visitas().find((v) => v.id === id);
    if (!existente) return { ok: false, mensaje: 'Visita no encontrada.' };

    const validacion = this.validarVisita(datos, id);
    if (!validacion.ok) return { ok: false, mensaje: validacion.mensaje };

    const actualizada = new VisitaModel({ ...datos, id });
    this._visitas.update((lista) => lista.map((v) => (v.id === id ? actualizada : v)));
    return { ok: true, mensaje: 'Visita actualizada correctamente.', data: actualizada };
  }

  reprogramarVisita(
    id: string,
    nuevaFecha: string,
    nuevaHora: string,
    comentario?: string
  ): ResultadoOperacion<VisitaModel> {
    const visita = this._visitas().find((v) => v.id === id);
    if (!visita) return { ok: false, mensaje: 'Visita no encontrada.' };

    return this.actualizarVisita(id, {
      ...visita.toJSON(),
      fecha: nuevaFecha,
      hora: nuevaHora,
      estado: 'Reprogramada',
      comentario: comentario !== undefined ? comentario : visita.comentario,
    });
  }

  cancelarVisita(id: string, motivo?: string): ResultadoOperacion {
    const visita = this._visitas().find((v) => v.id === id);
    if (!visita) return { ok: false, mensaje: 'Visita no encontrada.' };

    const comentarioFinal = motivo?.trim()
      ? `${visita.comentario ? visita.comentario + ' | ' : ''}Cancelada: ${motivo.trim()}`
      : visita.comentario;

    const actualizada = new VisitaModel({
      ...visita.toJSON(),
      estado: 'Cancelada',
      comentario: comentarioFinal,
    });
    this._visitas.update((lista) => lista.map((v) => (v.id === id ? actualizada : v)));
    return { ok: true, mensaje: 'Visita cancelada.' };
  }

  marcarVisitaRealizada(id: string, impresion: string): ResultadoOperacion {
    const visita = this._visitas().find((v) => v.id === id);
    if (!visita) return { ok: false, mensaje: 'Visita no encontrada.' };

    const actualizada = new VisitaModel({
      ...visita.toJSON(),
      estado: 'Realizada',
      comentario: impresion.trim() || visita.comentario,
    });
    this._visitas.update((lista) => lista.map((v) => (v.id === id ? actualizada : v)));
    return { ok: true, mensaje: 'Visita marcada como realizada.' };
  }

  eliminarVisita(id: string): ResultadoOperacion {
    const existe = this._visitas().some((v) => v.id === id);
    if (!existe) return { ok: false, mensaje: 'Visita no encontrada.' };
    this._visitas.update((lista) => lista.filter((v) => v.id !== id));
    return { ok: true, mensaje: 'Registro de visita eliminado.' };
  }

  private validarVisita(datos: Omit<Visita, 'id'>, ignorarId?: string): ResultadoOperacion {
    if (!this.obtenerInmueblePorId(datos.inmuebleId)) {
      return { ok: false, mensaje: 'Debe seleccionar un inmueble existente.' };
    }
    if (!this.obtenerClientePorId(datos.clienteId)) {
      return { ok: false, mensaje: 'Debe seleccionar un cliente existente.' };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha)) {
      return { ok: false, mensaje: 'La fecha de la visita no tiene un formato válido.' };
    }
    if (!/^\d{2}:\d{2}$/.test(datos.hora)) {
      return { ok: false, mensaje: 'La hora de la visita no tiene un formato válido.' };
    }

    // Regla RF-06: Impedir dos visitas activas en el mismo inmueble en la misma fecha y hora
    const esActiva = datos.estado === 'Programada' || datos.estado === 'Reprogramada';
    if (esActiva) {
      const conflicto = this._visitas().find(
        (v) =>
          v.id !== ignorarId &&
          v.estaActiva &&
          v.inmuebleId === datos.inmuebleId &&
          v.fecha === datos.fecha &&
          v.hora === datos.hora
      );
      if (conflicto) {
        const clienteConflicto = this.obtenerClientePorId(conflicto.clienteId)?.nombreCompleto ?? 'otro cliente';
        return {
          ok: false,
          mensaje: `Conflicto de agenda: ya existe una visita activa para este inmueble el ${datos.fecha} a las ${datos.hora} (${clienteConflicto}).`,
        };
      }
    }

    return { ok: true, mensaje: 'Válido' };
  }

  // ==================== FILTROS GUARDADOS (BONUS) ====================

  guardarFiltro(nombre: string, filtros: FiltrosInmueble): ResultadoOperacion<FiltroGuardado> {
    const limpio = nombre.trim();
    if (!limpio) return { ok: false, mensaje: 'Ingrese un nombre para el filtro.' };

    const nuevo: FiltroGuardado = {
      id: `FLT-${Date.now()}`,
      nombre: limpio,
      filtros: structuredClone(filtros),
      creadoEn: new Date().toISOString().slice(0, 10),
    };
    this._filtrosGuardados.update((lista) => [nuevo, ...lista]);
    return { ok: true, mensaje: `Filtro "${limpio}" guardado.`, data: nuevo };
  }

  eliminarFiltroGuardado(id: string): void {
    this._filtrosGuardados.update((lista) => lista.filter((f) => f.id !== id));
  }

  // ==================== EXPORTACIÓN Y RESTAURACIÓN ====================

  exportarInmueblesCSV(lista: InmuebleModel[]): string {
    const encabezados = [
      'Referencia',
      'Título',
      'Tipo',
      'Ciudad',
      'Cantón',
      'Zona',
      'Superficie (m2)',
      'Modalidad',
      'Precio Venta',
      'Precio Alquiler',
      'Disponibilidad',
      'Propietario',
      'Oficina Responsable',
      'Custodia de Llaves',
    ];

    const escapar = (val: string | number | null | undefined) => {
      const str = val === null || val === undefined ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const filas = lista.map((inm) => {
      const prop = this.obtenerPropietarioPorId(inm.propietarioId)?.nombreCompleto ?? '';
      const ofiResp = this.obtenerOficinaPorId(inm.oficinaResponsableId)?.nombre ?? '';
      const ofiLlaves = inm.oficinaLlavesId
        ? (this.obtenerOficinaPorId(inm.oficinaLlavesId)?.nombre ?? '')
        : 'En poder del propietario';
      return [
        inm.referencia,
        inm.titulo,
        inm.tipo,
        inm.ciudad,
        inm.canton,
        inm.zona,
        inm.superficieM2,
        inm.modalidad,
        inm.precioVenta ?? '',
        inm.precioAlquiler ?? '',
        inm.disponibilidad,
        prop,
        ofiResp,
        ofiLlaves,
      ]
        .map(escapar)
        .join(',');
    });

    return '\uFEFF' + [encabezados.map(escapar).join(','), ...filas].join('\r\n');
  }

  exportarBackupJSON(): string {
    return JSON.stringify(
      {
        exportadoEn: new Date().toISOString(),
        oficinas: this._oficinas().map((o) => o.toJSON()),
        propietarios: this._propietarios().map((p) => p.toJSON()),
        clientes: this._clientes().map((c) => c.toJSON()),
        inmuebles: this._inmuebles().map((i) => i.toJSON()),
        visitas: this._visitas().map((v) => v.toJSON()),
      },
      null,
      2
    );
  }

  restaurarDatosIniciales(): void {
    this.storage.clearAll();
    this._oficinas.set(SEED_OFICINAS.map((o) => OficinaModel.fromJSON(o)));
    this._propietarios.set(SEED_PROPIETARIOS.map((p) => PropietarioModel.fromJSON(p)));
    this._clientes.set(SEED_CLIENTES.map((c) => ClienteModel.fromJSON(c)));
    this._inmuebles.set(SEED_INMUEBLES.map((i) => InmuebleModel.fromJSON(i)));
    this._visitas.set(SEED_VISITAS.map((v) => VisitaModel.fromJSON(v)));
    this._filtrosGuardados.set([]);
  }

  private generarId(prefijo: string, existentes: string[]): string {
    const nums = existentes
      .map((id) => Number(id.replace(`${prefijo}-`, '')))
      .filter((n) => Number.isFinite(n));
    const siguiente = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
    return `${prefijo}-${String(siguiente).padStart(2, '0')}`;
  }
}
