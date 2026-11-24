export interface Oficina {
  id: string;
  codigo: string;
  nombre: string;
  ciudad: string;
  canton: string;
  direccion: string;
  telefono: string;
  email: string;
  encargado: string;
  activa: boolean;
}

export class OficinaModel implements Oficina {
  id: string;
  codigo: string;
  nombre: string;
  ciudad: string;
  canton: string;
  direccion: string;
  telefono: string;
  email: string;
  encargado: string;
  activa: boolean;

  constructor(data: Oficina) {
    this.id = data.id;
    this.codigo = data.codigo.trim().toUpperCase();
    this.nombre = data.nombre.trim();
    this.ciudad = data.ciudad.trim();
    this.canton = data.canton.trim();
    this.direccion = data.direccion.trim();
    this.telefono = data.telefono.trim();
    this.email = data.email.trim();
    this.encargado = data.encargado.trim();
    this.activa = data.activa;
  }

  get ubicacionCompleta(): string {
    return `${this.ciudad}, cantón ${this.canton}`;
  }

  toJSON(): Oficina {
    return {
      id: this.id,
      codigo: this.codigo,
      nombre: this.nombre,
      ciudad: this.ciudad,
      canton: this.canton,
      direccion: this.direccion,
      telefono: this.telefono,
      email: this.email,
      encargado: this.encargado,
      activa: this.activa,
    };
  }

  static fromJSON(raw: Oficina): OficinaModel {
    return new OficinaModel(raw);
  }
}
