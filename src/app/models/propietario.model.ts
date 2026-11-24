export interface Propietario {
  id: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  direccion: string;
}

export class PropietarioModel implements Propietario {
  id: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  direccion: string;

  constructor(data: Propietario) {
    this.id = data.id;
    this.identificacion = data.identificacion.trim();
    this.nombres = data.nombres.trim();
    this.apellidos = data.apellidos.trim();
    this.telefono = data.telefono.trim();
    this.email = data.email.trim();
    this.direccion = data.direccion.trim();
  }

  get nombreCompleto(): string {
    return `${this.nombres} ${this.apellidos}`.trim();
  }

  toJSON(): Propietario {
    return {
      id: this.id,
      identificacion: this.identificacion,
      nombres: this.nombres,
      apellidos: this.apellidos,
      telefono: this.telefono,
      email: this.email,
      direccion: this.direccion,
    };
  }

  static fromJSON(raw: Propietario): PropietarioModel {
    return new PropietarioModel(raw);
  }
}
