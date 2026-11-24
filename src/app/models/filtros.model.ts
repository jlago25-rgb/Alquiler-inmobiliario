import { EstadoDisponibilidad, ModalidadOperacion, TipoInmueble } from './enums';

export type OrdenInmueble =
  | 'referencia-asc'
  | 'precio-asc'
  | 'precio-desc'
  | 'alquiler-asc'
  | 'alquiler-desc'
  | 'superficie-asc'
  | 'superficie-desc';

export interface FiltrosInmueble {
  busqueda: string;
  ciudad: string;
  canton: string;
  zona: string;
  tipo: TipoInmueble | '';
  modalidad: ModalidadOperacion | '';
  disponibilidad: EstadoDisponibilidad | '';
  precioMin: number | null;
  precioMax: number | null;
  superficieMin: number | null;
  superficieMax: number | null;
  habitacionesMin: number | null;
  equipamiento: string;
  oficinaId: string;
  soloFavoritos: boolean;
  orden: OrdenInmueble;
}

export interface FiltroGuardado {
  id: string;
  nombre: string;
  filtros: FiltrosInmueble;
  creadoEn: string;
}

export interface DatoGrafico {
  etiqueta: string;
  valor: number;
  porcentaje: number;
  color: string;
}

export interface IndicadorOficina {
  oficinaId: string;
  nombre: string;
  ciudad: string;
  inmueblesResponsable: number;
  disponibles: number;
  custodiaLlaves: number;
  visitasActivas: number;
}

export interface DashboardMetricas {
  totalInmuebles: number;
  disponibles: number;
  enVenta: number;
  enAlquiler: number;
  ambasModalidades: number;
  totalVisitas: number;
  visitasProgramadas: number;
  visitasRealizadas: number;
  visitasCanceladas: number;
  favoritos: number;
  porCiudad: DatoGrafico[];
  porTipo: DatoGrafico[];
  visitasPorEstado: DatoGrafico[];
  porOficina: IndicadorOficina[];
}

export function crearFiltrosVacios(): FiltrosInmueble {
  return {
    busqueda: '',
    ciudad: '',
    canton: '',
    zona: '',
    tipo: '',
    modalidad: '',
    disponibilidad: '',
    precioMin: null,
    precioMax: null,
    superficieMin: null,
    superficieMax: null,
    habitacionesMin: null,
    equipamiento: '',
    oficinaId: '',
    soloFavoritos: false,
    orden: 'referencia-asc',
  };
}
