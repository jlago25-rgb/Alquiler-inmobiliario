import { EstadoVisita } from './enums';

export interface Visita {
  id: string;
  inmuebleId: string;
  clienteId: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm
  estado: EstadoVisita;
  comentario: string;
}

export class VisitaModel implements Visita {
  id: string;
  inmuebleId: string;
  clienteId: string;
  fecha: string;
  hora: string;
  estado: EstadoVisita;
  comentario: string;

  constructor(data: Visita) {
    this.id = data.id;
    this.inmuebleId = data.inmuebleId;
    this.clienteId = data.clienteId;
    this.fecha = data.fecha.trim();
    this.hora = data.hora.trim();
    this.estado = data.estado;
    this.comentario = (data.comentario ?? '').trim();
  }

  get estaActiva(): boolean {
    return this.estado === 'Programada' || this.estado === 'Reprogramada';
  }

  get claveHorario(): string {
    return `${this.inmuebleId}|${this.fecha}|${this.hora}`;
  }

  toJSON(): Visita {
    return {
      id: this.id,
      inmuebleId: this.inmuebleId,
      clienteId: this.clienteId,
      fecha: this.fecha,
      hora: this.hora,
      estado: this.estado,
      comentario: this.comentario,
    };
  }

  static fromJSON(raw: Visita): VisitaModel {
    return new VisitaModel(raw);
  }
}
