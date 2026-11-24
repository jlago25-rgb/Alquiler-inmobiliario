export interface Cliente {
  id: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  presupuestoMax?: number | null;
  notas?: string;
}

export class ClienteModel implements Cliente {
  id: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  presupuestoMax: number | null;
  notas: string;

  constructor(data: Cliente) {
    this.id = data.id;
    this.identificacion = data.identificacion.trim();
    this.nombres = data.nombres.trim();
    this.apellidos = data.apellidos.trim();
    this.telefono = data.telefono.trim();
    this.email = data.email.trim();
    this.presupuestoMax = data.presupuestoMax ?? null;
    this.notas = (data.notas ?? '').trim();
  }

  get nombreCompleto(): string {
    return `${this.nombres} ${this.apellidos}`.trim();
  }

  toJSON(): Cliente {
    return {
      id: this.id,
      identificacion: this.identificacion,
      nombres: this.nombres,
      apellidos: this.apellidos,
      telefono: this.telefono,
      email: this.email,
      presupuestoMax: this.presupuestoMax,
      notas: this.notas,
    };
  }

  static fromJSON(raw: Cliente): ClienteModel {
    return new ClienteModel(raw);
  }
}
