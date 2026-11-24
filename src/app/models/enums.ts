export const TIPOS_INMUEBLE = [
  'Casa',
  'Departamento',
  'Villa',
  'Local comercial',
  'Oficina',
] as const;
export type TipoInmueble = (typeof TIPOS_INMUEBLE)[number];

export const MODALIDADES = ['Venta', 'Alquiler', 'Ambas'] as const;
export type ModalidadOperacion = (typeof MODALIDADES)[number];

export const ESTADOS_DISPONIBILIDAD = [
  'Disponible',
  'Reservado',
  'Vendido',
  'Alquilado',
  'No disponible',
] as const;
export type EstadoDisponibilidad = (typeof ESTADOS_DISPONIBILIDAD)[number];

export const ESTADOS_VISITA = [
  'Programada',
  'Reprogramada',
  'Realizada',
  'Cancelada',
] as const;
export type EstadoVisita = (typeof ESTADOS_VISITA)[number];

export const CONDICIONES_ACONDICIONAMIENTO = [
  'Acondicionado',
  'Parcialmente acondicionado',
  'Diáfano',
  'En obra gris',
] as const;
export type CondicionAcondicionamiento = (typeof CONDICIONES_ACONDICIONAMIENTO)[number];

export const EQUIPAMIENTO_OPCIONES = [
  'Piscina',
  'Aire acondicionado',
  'Garaje',
  'Terraza',
  'Jardín',
  'Seguridad 24/7',
  'Gas centralizado',
  'Calefacción',
  'Amoblado',
  'Ascensor',
  'Área BBQ',
  'Cisterna',
] as const;
