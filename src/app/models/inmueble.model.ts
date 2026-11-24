import {
  CondicionAcondicionamiento,
  EstadoDisponibilidad,
  ModalidadOperacion,
  TipoInmueble,
} from './enums';

export interface CaracteristicasVilla {
  parcelaM2: number;
  urbanizacion: string;
  habitaciones: number;
  banos: number;
  cocinas: number;
  equipamiento: string[];
}

export interface CaracteristicasLocal {
  numeroAccesos: number;
  acondicionamiento: CondicionAcondicionamiento;
  altilloM2?: number;
  vado?: boolean;
  aguaYLuz?: boolean;
  esquinero?: boolean;
}

export interface CaracteristicasCasa {
  plantas: number;
  habitaciones: number;
  banos: number;
  garaje: boolean;
  patio: boolean;
  equipamiento: string[];
}

export interface CaracteristicasDepartamento {
  piso: number;
  habitaciones: number;
  banos: number;
  ascensor: boolean;
  parqueadero: boolean;
  equipamiento: string[];
}

export interface CaracteristicasOficina {
  ambientes: number;
  banos: number;
  piso: number;
  salaReuniones: boolean;
  parqueaderos: number;
  equipamiento: string[];
}

export interface CaracteristicasInmueble {
  villa?: CaracteristicasVilla;
  local?: CaracteristicasLocal;
  casa?: CaracteristicasCasa;
  departamento?: CaracteristicasDepartamento;
  oficina?: CaracteristicasOficina;
}

export interface Inmueble {
  id: string;
  referencia: string;
  titulo: string;
  tipo: TipoInmueble;
  superficieM2: number;
  direccion: string;
  ciudad: string;
  canton: string;
  zona: string;
  descripcion: string;
  disponibilidad: EstadoDisponibilidad;
  modalidad: ModalidadOperacion;
  precioVenta: number | null;
  precioAlquiler: number | null;
  propietarioId: string;
  oficinaResponsableId: string;
  oficinaLlavesId: string | null;
  imagenPrincipal: string;
  galeria: string[];
  caracteristicas: CaracteristicasInmueble;
  fechaRegistro: string;
  esFavorito?: boolean;
}

export class InmuebleModel implements Inmueble {
  id: string;
  referencia: string;
  titulo: string;
  tipo: TipoInmueble;
  superficieM2: number;
  direccion: string;
  ciudad: string;
  canton: string;
  zona: string;
  descripcion: string;
  disponibilidad: EstadoDisponibilidad;
  modalidad: ModalidadOperacion;
  precioVenta: number | null;
  precioAlquiler: number | null;
  propietarioId: string;
  oficinaResponsableId: string;
  oficinaLlavesId: string | null;
  imagenPrincipal: string;
  galeria: string[];
  caracteristicas: CaracteristicasInmueble;
  fechaRegistro: string;
  esFavorito: boolean;

  constructor(data: Inmueble) {
    this.id = data.id;
    this.referencia = data.referencia.trim().toUpperCase();
    this.titulo = data.titulo.trim();
    this.tipo = data.tipo;
    this.superficieM2 = Number(data.superficieM2);
    this.direccion = data.direccion.trim();
    this.ciudad = data.ciudad.trim();
    this.canton = data.canton.trim();
    this.zona = data.zona.trim();
    this.descripcion = data.descripcion.trim();
    this.disponibilidad = data.disponibilidad;
    this.modalidad = data.modalidad;
    this.precioVenta =
      data.modalidad === 'Alquiler'
        ? null
        : data.precioVenta !== null && data.precioVenta !== undefined
          ? Number(data.precioVenta)
          : null;
    this.precioAlquiler =
      data.modalidad === 'Venta'
        ? null
        : data.precioAlquiler !== null && data.precioAlquiler !== undefined
          ? Number(data.precioAlquiler)
          : null;
    this.propietarioId = data.propietarioId;
    this.oficinaResponsableId = data.oficinaResponsableId;
    this.oficinaLlavesId = data.oficinaLlavesId || null;
    this.imagenPrincipal = data.imagenPrincipal.trim();
    this.galeria = Array.isArray(data.galeria)
      ? data.galeria.map((url) => url.trim()).filter(Boolean)
      : [];
    this.caracteristicas = data.caracteristicas ?? {};
    this.fechaRegistro = data.fechaRegistro || new Date().toISOString().slice(0, 10);
    this.esFavorito = Boolean(data.esFavorito);
  }

  get ofreceVenta(): boolean {
    return this.modalidad === 'Venta' || this.modalidad === 'Ambas';
  }

  get ofreceAlquiler(): boolean {
    return this.modalidad === 'Alquiler' || this.modalidad === 'Ambas';
  }

  get estaDisponible(): boolean {
    return this.disponibilidad === 'Disponible';
  }

  get ubicacionResumen(): string {
    return `${this.ciudad} · ${this.zona}`;
  }

  get habitaciones(): number {
    if (this.tipo === 'Villa') return this.caracteristicas.villa?.habitaciones ?? 0;
    if (this.tipo === 'Casa') return this.caracteristicas.casa?.habitaciones ?? 0;
    if (this.tipo === 'Departamento') return this.caracteristicas.departamento?.habitaciones ?? 0;
    if (this.tipo === 'Oficina') return this.caracteristicas.oficina?.ambientes ?? 0;
    return 0;
  }

  get equipamientoLista(): string[] {
    if (this.tipo === 'Villa') return this.caracteristicas.villa?.equipamiento ?? [];
    if (this.tipo === 'Casa') return this.caracteristicas.casa?.equipamiento ?? [];
    if (this.tipo === 'Departamento') return this.caracteristicas.departamento?.equipamiento ?? [];
    if (this.tipo === 'Oficina') return this.caracteristicas.oficina?.equipamiento ?? [];
    return [];
  }

  get precioOrdenReferencia(): number {
    if (this.modalidad === 'Alquiler') {
      return this.precioAlquiler ?? 0;
    }
    return this.precioVenta ?? this.precioAlquiler ?? 0;
  }

  get todasLasImagenes(): string[] {
    const imgs = [this.imagenPrincipal, ...this.galeria].filter(Boolean);
    return Array.from(new Set(imgs));
  }

  resumenCaracteristicas(): string[] {
    const items: string[] = [`${this.superficieM2} m²`];
    switch (this.tipo) {
      case 'Villa': {
        const v = this.caracteristicas.villa;
        if (v) {
          items.push(`Parcela ${v.parcelaM2} m²`);
          items.push(`${v.habitaciones} hab.`);
          items.push(`${v.banos} baños`);
          items.push(`${v.cocinas} coc.`);
          if (v.urbanizacion) items.push(`Urb. ${v.urbanizacion}`);
        }
        break;
      }
      case 'Local comercial': {
        const l = this.caracteristicas.local;
        if (l) {
          items.push(`${l.numeroAccesos} acceso${l.numeroAccesos === 1 ? '' : 's'}`);
          items.push(l.acondicionamiento);
          if (l.altilloM2) items.push(`Altillo ${l.altilloM2} m²`);
          if (l.esquinero) items.push('Esquinero');
        }
        break;
      }
      case 'Casa': {
        const c = this.caracteristicas.casa;
        if (c) {
          items.push(`${c.plantas} planta${c.plantas === 1 ? '' : 's'}`);
          items.push(`${c.habitaciones} hab.`);
          items.push(`${c.banos} baños`);
          if (c.garaje) items.push('Garaje');
          if (c.patio) items.push('Patio');
        }
        break;
      }
      case 'Departamento': {
        const d = this.caracteristicas.departamento;
        if (d) {
          items.push(`Piso ${d.piso}`);
          items.push(`${d.habitaciones} hab.`);
          items.push(`${d.banos} baños`);
          if (d.ascensor) items.push('Ascensor');
          if (d.parqueadero) items.push('Parqueadero');
        }
        break;
      }
      case 'Oficina': {
        const o = this.caracteristicas.oficina;
        if (o) {
          items.push(`${o.ambientes} amb.`);
          items.push(`Piso ${o.piso}`);
          items.push(`${o.banos} baños`);
          if (o.salaReuniones) items.push('Sala de reuniones');
          if (o.parqueaderos > 0) items.push(`${o.parqueaderos} parq.`);
        }
        break;
      }
    }
    return items;
  }

  toJSON(): Inmueble {
    return {
      id: this.id,
      referencia: this.referencia,
      titulo: this.titulo,
      tipo: this.tipo,
      superficieM2: this.superficieM2,
      direccion: this.direccion,
      ciudad: this.ciudad,
      canton: this.canton,
      zona: this.zona,
      descripcion: this.descripcion,
      disponibilidad: this.disponibilidad,
      modalidad: this.modalidad,
      precioVenta: this.precioVenta,
      precioAlquiler: this.precioAlquiler,
      propietarioId: this.propietarioId,
      oficinaResponsableId: this.oficinaResponsableId,
      oficinaLlavesId: this.oficinaLlavesId,
      imagenPrincipal: this.imagenPrincipal,
      galeria: [...this.galeria],
      caracteristicas: structuredClone(this.caracteristicas),
      fechaRegistro: this.fechaRegistro,
      esFavorito: this.esFavorito,
    };
  }

  static fromJSON(raw: Inmueble): InmuebleModel {
    return new InmuebleModel(raw);
  }
}
