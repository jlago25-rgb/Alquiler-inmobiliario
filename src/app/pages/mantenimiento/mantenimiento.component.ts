import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CONDICIONES_ACONDICIONAMIENTO,
  CaracteristicasInmueble,
  ClienteModel,
  EQUIPAMIENTO_OPCIONES,
  ESTADOS_DISPONIBILIDAD,
  Inmueble,
  InmuebleModel,
  MODALIDADES,
  ModalidadOperacion,
  OficinaModel,
  PropietarioModel,
  TIPOS_INMUEBLE,
  TipoInmueble,
} from '../../models';
import { InmobiliariaService } from '../../services/inmobiliaria.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { ImgFallbackDirective } from '../../shared/img-fallback.directive';
import { PrecioEcPipe } from '../../shared/precio-ec.pipe';

type TabMantenimiento = 'inmuebles' | 'propietarios' | 'oficinas' | 'clientes';

interface ConfirmacionPendiente {
  entidad: TabMantenimiento;
  id: string;
  titulo: string;
  mensaje: string;
}

const IMAGENES_SUGERIDAS: Record<TipoInmueble, string> = {
  Casa: 'images/casa-1.svg',
  Departamento: 'images/departamento-1.svg',
  Villa: 'images/villa-1.svg',
  'Local comercial': 'images/local-1.svg',
  Oficina: 'images/oficina-1.svg',
};

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ConfirmDialogComponent,
    ImgFallbackDirective,
    PrecioEcPipe,
  ],
  templateUrl: './mantenimiento.component.html',
  styleUrl: './mantenimiento.component.css',
})
export class MantenimientoComponent {
  readonly service = inject(InmobiliariaService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  readonly tipos = TIPOS_INMUEBLE;
  readonly modalidades = MODALIDADES;
  readonly estados = ESTADOS_DISPONIBILIDAD;
  readonly condicionesLocal = CONDICIONES_ACONDICIONAMIENTO;
  readonly equipamientosOpciones = EQUIPAMIENTO_OPCIONES;

  readonly tabActiva = signal<TabMantenimiento>('inmuebles');
  readonly busqueda = signal('');

  // Modal state
  readonly modalInmueble = signal(false);
  readonly modalPropietario = signal(false);
  readonly modalOficina = signal(false);
  readonly modalCliente = signal(false);

  readonly editandoId = signal<string | null>(null);
  readonly equipamientoSeleccionado = signal<string[]>([]);
  readonly confirmacion = signal<ConfirmacionPendiente | null>(null);

  // Filtered lists
  readonly inmueblesFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return this.service.inmuebles();
    return this.service.inmuebles().filter((i) =>
      [i.referencia, i.titulo, i.tipo, i.ciudad, i.canton, i.zona, i.disponibilidad]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  });

  readonly propietariosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return this.service.propietarios();
    return this.service.propietarios().filter((p) =>
      [p.identificacion, p.nombreCompleto, p.telefono, p.email].join(' ').toLowerCase().includes(q)
    );
  });

  readonly oficinasFiltradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return this.service.oficinas();
    return this.service.oficinas().filter((o) =>
      [o.codigo, o.nombre, o.ciudad, o.canton, o.encargado].join(' ').toLowerCase().includes(q)
    );
  });

  readonly clientesFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return this.service.clientes();
    return this.service.clientes().filter((c) =>
      [c.identificacion, c.nombreCompleto, c.telefono, c.email].join(' ').toLowerCase().includes(q)
    );
  });

  // ===== FORMULARIO INMUEBLE (RF-04 con validaciones condicionales) =====
  readonly formInmueble = this.fb.group({
    referencia: ['', [Validators.required, Validators.minLength(4), this.validadorReferenciaUnica.bind(this)]],
    titulo: ['', [Validators.required, Validators.minLength(5)]],
    tipo: ['Casa' as TipoInmueble, [Validators.required]],
    superficieM2: [120, [Validators.required, Validators.min(1)]],
    direccion: ['', [Validators.required, Validators.minLength(5)]],
    ciudad: ['Machala', [Validators.required]],
    canton: ['Machala', [Validators.required]],
    zona: ['Norte', [Validators.required]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    disponibilidad: ['Disponible' as Inmueble['disponibilidad'], [Validators.required]],
    modalidad: ['Venta' as ModalidadOperacion, [Validators.required]],
    precioVenta: [95000 as number | null],
    precioAlquiler: [{ value: null as number | null, disabled: true }],
    propietarioId: ['', [Validators.required]],
    oficinaResponsableId: ['', [Validators.required]],
    oficinaLlavesId: [''],
    imagenPrincipal: ['images/casa-1.svg', [Validators.required]],
    galeriaTexto: ['images/interior-sala.svg, images/interior-cocina.svg'],

    // Características Villa
    villaParcelaM2: [500 as number | null],
    villaUrbanizacion: [''],
    villaHabitaciones: [4 as number | null],
    villaBanos: [3 as number | null],
    villaCocinas: [1 as number | null],

    // Características Local comercial
    localAccesos: [1 as number | null],
    localAcondicionamiento: ['Acondicionado' as (typeof CONDICIONES_ACONDICIONAMIENTO)[number]],
    localAltilloM2: [0 as number | null],
    localVado: [false],
    localAguaYLuz: [true],
    localEsquinero: [false],

    // Características Casa
    casaPlantas: [2 as number | null],
    casaHabitaciones: [3 as number | null],
    casaBanos: [2 as number | null],
    casaGaraje: [true],
    casaPatio: [true],

    // Características Departamento
    deptoPiso: [2 as number | null],
    deptoHabitaciones: [2 as number | null],
    deptoBanos: [2 as number | null],
    deptoAscensor: [true],
    deptoParqueadero: [true],

    // Características Oficina
    oficinaAmbientes: [3 as number | null],
    oficinaPiso: [2 as number | null],
    oficinaBanos: [1 as number | null],
    oficinaSalaReuniones: [true],
    oficinaParqueaderos: [1 as number | null],
  });

  // ===== FORMULARIO PROPIETARIO =====
  readonly formPropietario = this.fb.group({
    identificacion: ['', [Validators.required, Validators.pattern(/^\d{10,13}$/)]],
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    telefono: ['', [Validators.required, Validators.minLength(7)]],
    email: ['', [Validators.required, Validators.email]],
    direccion: ['', [Validators.required, Validators.minLength(5)]],
  });

  // ===== FORMULARIO OFICINA =====
  readonly formOficina = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(3)]],
    nombre: ['', [Validators.required, Validators.minLength(4)]],
    ciudad: ['', [Validators.required]],
    canton: ['', [Validators.required]],
    direccion: ['', [Validators.required, Validators.minLength(5)]],
    telefono: ['', [Validators.required, Validators.minLength(7)]],
    email: ['', [Validators.required, Validators.email]],
    encargado: ['', [Validators.required, Validators.minLength(4)]],
    activa: [true],
  });

  // ===== FORMULARIO CLIENTE =====
  readonly formCliente = this.fb.group({
    identificacion: ['', [Validators.required, Validators.pattern(/^\d{10,13}$/)]],
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    telefono: ['', [Validators.required, Validators.minLength(7)]],
    email: ['', [Validators.required, Validators.email]],
    presupuestoMax: [null as number | null, [Validators.min(0)]],
    notas: [''],
  });

  constructor() {
    const tabParam = this.route.snapshot.queryParamMap.get('tab') as TabMantenimiento | null;
    if (tabParam && ['inmuebles', 'propietarios', 'oficinas', 'clientes'].includes(tabParam)) {
      this.tabActiva.set(tabParam);
    }

    this.formInmueble.controls.modalidad.valueChanges.subscribe((mod) => {
      if (mod) this.aplicarValidacionModalidad(mod);
    });

    this.formInmueble.controls.tipo.valueChanges.subscribe((tipo) => {
      if (tipo) {
        this.aplicarValidacionTipo(tipo);
        const imgActual = this.formInmueble.controls.imagenPrincipal.value ?? '';
        if (!imgActual || Object.values(IMAGENES_SUGERIDAS).includes(imgActual)) {
          this.formInmueble.controls.imagenPrincipal.setValue(IMAGENES_SUGERIDAS[tipo]);
        }
      }
    });
  }

  cambiarTab(tab: TabMantenimiento): void {
    this.tabActiva.set(tab);
    this.busqueda.set('');
  }

  // ==================== INMUEBLES ====================

  abrirNuevoInmueble(): void {
    this.editandoId.set(null);
    this.equipamientoSeleccionado.set(['Aire acondicionado', 'Garaje']);
    const primerProp = this.service.propietarios()[0]?.id ?? '';
    const primeraOfi = this.service.oficinas()[0]?.id ?? '';
    const siguienteNum = 1001 + this.service.inmuebles().length;

    this.formInmueble.reset({
      referencia: `REF-${siguienteNum}`,
      titulo: '',
      tipo: 'Casa',
      superficieM2: 120,
      direccion: '',
      ciudad: 'Machala',
      canton: 'Machala',
      zona: 'Norte',
      descripcion: '',
      disponibilidad: 'Disponible',
      modalidad: 'Venta',
      precioVenta: 95000,
      precioAlquiler: null,
      propietarioId: primerProp,
      oficinaResponsableId: primeraOfi,
      oficinaLlavesId: primeraOfi,
      imagenPrincipal: 'images/casa-1.svg',
      galeriaTexto: 'images/interior-sala.svg, images/interior-cocina.svg',
      villaParcelaM2: 500,
      villaUrbanizacion: '',
      villaHabitaciones: 4,
      villaBanos: 3,
      villaCocinas: 1,
      localAccesos: 1,
      localAcondicionamiento: 'Acondicionado',
      localAltilloM2: 0,
      localVado: false,
      localAguaYLuz: true,
      localEsquinero: false,
      casaPlantas: 2,
      casaHabitaciones: 3,
      casaBanos: 2,
      casaGaraje: true,
      casaPatio: true,
      deptoPiso: 2,
      deptoHabitaciones: 2,
      deptoBanos: 2,
      deptoAscensor: true,
      deptoParqueadero: true,
      oficinaAmbientes: 3,
      oficinaPiso: 2,
      oficinaBanos: 1,
      oficinaSalaReuniones: true,
      oficinaParqueaderos: 1,
    });
    this.aplicarValidacionModalidad('Venta');
    this.aplicarValidacionTipo('Casa');
    this.modalInmueble.set(true);
  }

  abrirEditarInmueble(inm: InmuebleModel): void {
    this.editandoId.set(inm.id);
    this.equipamientoSeleccionado.set([...inm.equipamientoLista]);

    this.formInmueble.reset({
      referencia: inm.referencia,
      titulo: inm.titulo,
      tipo: inm.tipo,
      superficieM2: inm.superficieM2,
      direccion: inm.direccion,
      ciudad: inm.ciudad,
      canton: inm.canton,
      zona: inm.zona,
      descripcion: inm.descripcion,
      disponibilidad: inm.disponibilidad,
      modalidad: inm.modalidad,
      precioVenta: inm.precioVenta,
      precioAlquiler: inm.precioAlquiler,
      propietarioId: inm.propietarioId,
      oficinaResponsableId: inm.oficinaResponsableId,
      oficinaLlavesId: inm.oficinaLlavesId ?? '',
      imagenPrincipal: inm.imagenPrincipal,
      galeriaTexto: inm.galeria.join(', '),
      villaParcelaM2: inm.caracteristicas.villa?.parcelaM2 ?? 500,
      villaUrbanizacion: inm.caracteristicas.villa?.urbanizacion ?? '',
      villaHabitaciones: inm.caracteristicas.villa?.habitaciones ?? 4,
      villaBanos: inm.caracteristicas.villa?.banos ?? 3,
      villaCocinas: inm.caracteristicas.villa?.cocinas ?? 1,
      localAccesos: inm.caracteristicas.local?.numeroAccesos ?? 1,
      localAcondicionamiento: inm.caracteristicas.local?.acondicionamiento ?? 'Acondicionado',
      localAltilloM2: inm.caracteristicas.local?.altilloM2 ?? 0,
      localVado: inm.caracteristicas.local?.vado ?? false,
      localAguaYLuz: inm.caracteristicas.local?.aguaYLuz ?? true,
      localEsquinero: inm.caracteristicas.local?.esquinero ?? false,
      casaPlantas: inm.caracteristicas.casa?.plantas ?? 2,
      casaHabitaciones: inm.caracteristicas.casa?.habitaciones ?? 3,
      casaBanos: inm.caracteristicas.casa?.banos ?? 2,
      casaGaraje: inm.caracteristicas.casa?.garaje ?? true,
      casaPatio: inm.caracteristicas.casa?.patio ?? true,
      deptoPiso: inm.caracteristicas.departamento?.piso ?? 2,
      deptoHabitaciones: inm.caracteristicas.departamento?.habitaciones ?? 2,
      deptoBanos: inm.caracteristicas.departamento?.banos ?? 2,
      deptoAscensor: inm.caracteristicas.departamento?.ascensor ?? true,
      deptoParqueadero: inm.caracteristicas.departamento?.parqueadero ?? true,
      oficinaAmbientes: inm.caracteristicas.oficina?.ambientes ?? 3,
      oficinaPiso: inm.caracteristicas.oficina?.piso ?? 2,
      oficinaBanos: inm.caracteristicas.oficina?.banos ?? 1,
      oficinaSalaReuniones: inm.caracteristicas.oficina?.salaReuniones ?? true,
      oficinaParqueaderos: inm.caracteristicas.oficina?.parqueaderos ?? 1,
    });

    this.aplicarValidacionModalidad(inm.modalidad);
    this.aplicarValidacionTipo(inm.tipo);
    this.formInmueble.controls.referencia.updateValueAndValidity();
    this.modalInmueble.set(true);
  }

  toggleEquipamiento(item: string): void {
    this.equipamientoSeleccionado.update((actual) =>
      actual.includes(item) ? actual.filter((x) => x !== item) : [...actual, item]
    );
  }

  guardarInmueble(): void {
    this.formInmueble.markAllAsTouched();
    if (this.formInmueble.invalid) {
      this.notifications.advertencia('Revise los campos marcados en rojo antes de guardar.');
      return;
    }

    const v = this.formInmueble.getRawValue();
    const tipo = v.tipo as TipoInmueble;
    const modalidad = v.modalidad as ModalidadOperacion;

    const caracteristicas: CaracteristicasInmueble = {};
    if (tipo === 'Villa') {
      caracteristicas.villa = {
        parcelaM2: Number(v.villaParcelaM2),
        urbanizacion: (v.villaUrbanizacion ?? '').trim(),
        habitaciones: Number(v.villaHabitaciones),
        banos: Number(v.villaBanos),
        cocinas: Number(v.villaCocinas),
        equipamiento: [...this.equipamientoSeleccionado()],
      };
    } else if (tipo === 'Local comercial') {
      caracteristicas.local = {
        numeroAccesos: Number(v.localAccesos),
        acondicionamiento: v.localAcondicionamiento ?? 'Acondicionado',
        altilloM2: Number(v.localAltilloM2 ?? 0),
        vado: Boolean(v.localVado),
        aguaYLuz: Boolean(v.localAguaYLuz),
        esquinero: Boolean(v.localEsquinero),
      };
    } else if (tipo === 'Casa') {
      caracteristicas.casa = {
        plantas: Number(v.casaPlantas),
        habitaciones: Number(v.casaHabitaciones),
        banos: Number(v.casaBanos),
        garaje: Boolean(v.casaGaraje),
        patio: Boolean(v.casaPatio),
        equipamiento: [...this.equipamientoSeleccionado()],
      };
    } else if (tipo === 'Departamento') {
      caracteristicas.departamento = {
        piso: Number(v.deptoPiso),
        habitaciones: Number(v.deptoHabitaciones),
        banos: Number(v.deptoBanos),
        ascensor: Boolean(v.deptoAscensor),
        parqueadero: Boolean(v.deptoParqueadero),
        equipamiento: [...this.equipamientoSeleccionado()],
      };
    } else if (tipo === 'Oficina') {
      caracteristicas.oficina = {
        ambientes: Number(v.oficinaAmbientes),
        piso: Number(v.oficinaPiso),
        banos: Number(v.oficinaBanos),
        salaReuniones: Boolean(v.oficinaSalaReuniones),
        parqueaderos: Number(v.oficinaParqueaderos ?? 0),
        equipamiento: [...this.equipamientoSeleccionado()],
      };
    }

    const galeria = (v.galeriaTexto ?? '')
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Omit<Inmueble, 'id' | 'fechaRegistro'> = {
      referencia: (v.referencia ?? '').trim().toUpperCase(),
      titulo: (v.titulo ?? '').trim(),
      tipo,
      superficieM2: Number(v.superficieM2),
      direccion: (v.direccion ?? '').trim(),
      ciudad: (v.ciudad ?? '').trim(),
      canton: (v.canton ?? '').trim(),
      zona: (v.zona ?? '').trim(),
      descripcion: (v.descripcion ?? '').trim(),
      disponibilidad: v.disponibilidad ?? 'Disponible',
      modalidad,
      precioVenta: modalidad === 'Alquiler' ? null : Number(v.precioVenta),
      precioAlquiler: modalidad === 'Venta' ? null : Number(v.precioAlquiler),
      propietarioId: v.propietarioId ?? '',
      oficinaResponsableId: v.oficinaResponsableId ?? '',
      oficinaLlavesId: v.oficinaLlavesId ? v.oficinaLlavesId : null,
      imagenPrincipal: (v.imagenPrincipal ?? '').trim(),
      galeria,
      caracteristicas,
    };

    const id = this.editandoId();
    const res = id
      ? this.service.actualizarInmueble(id, payload)
      : this.service.crearInmueble(payload);

    if (res.ok) {
      this.notifications.exito(res.mensaje);
      this.modalInmueble.set(false);
    } else {
      this.notifications.error(res.mensaje);
    }
  }

  private aplicarValidacionModalidad(mod: ModalidadOperacion): void {
    const ventaCtrl = this.formInmueble.controls.precioVenta;
    const alqCtrl = this.formInmueble.controls.precioAlquiler;

    if (mod === 'Venta') {
      ventaCtrl.enable({ emitEvent: false });
      ventaCtrl.setValidators([Validators.required, Validators.min(1)]);
      alqCtrl.setValue(null, { emitEvent: false });
      alqCtrl.clearValidators();
      alqCtrl.disable({ emitEvent: false });
    } else if (mod === 'Alquiler') {
      alqCtrl.enable({ emitEvent: false });
      alqCtrl.setValidators([Validators.required, Validators.min(1)]);
      ventaCtrl.setValue(null, { emitEvent: false });
      ventaCtrl.clearValidators();
      ventaCtrl.disable({ emitEvent: false });
    } else {
      ventaCtrl.enable({ emitEvent: false });
      ventaCtrl.setValidators([Validators.required, Validators.min(1)]);
      alqCtrl.enable({ emitEvent: false });
      alqCtrl.setValidators([Validators.required, Validators.min(1)]);
    }

    ventaCtrl.updateValueAndValidity({ emitEvent: false });
    alqCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private aplicarValidacionTipo(tipo: TipoInmueble): void {
    const c = this.formInmueble.controls;
    const condicionales = [
      c.villaParcelaM2,
      c.villaUrbanizacion,
      c.villaHabitaciones,
      c.villaBanos,
      c.villaCocinas,
      c.localAccesos,
      c.localAcondicionamiento,
      c.localAltilloM2,
      c.casaPlantas,
      c.casaHabitaciones,
      c.casaBanos,
      c.deptoPiso,
      c.deptoHabitaciones,
      c.deptoBanos,
      c.oficinaAmbientes,
      c.oficinaPiso,
      c.oficinaBanos,
      c.oficinaParqueaderos,
    ];
    condicionales.forEach((ctrl) => ctrl.clearValidators());

    if (tipo === 'Villa') {
      c.villaParcelaM2.setValidators([Validators.required, Validators.min(1)]);
      c.villaUrbanizacion.setValidators([Validators.required, Validators.minLength(2)]);
      c.villaHabitaciones.setValidators([Validators.required, Validators.min(1)]);
      c.villaBanos.setValidators([Validators.required, Validators.min(1)]);
      c.villaCocinas.setValidators([Validators.required, Validators.min(1)]);
    } else if (tipo === 'Local comercial') {
      c.localAccesos.setValidators([Validators.required, Validators.min(1)]);
      c.localAcondicionamiento.setValidators([Validators.required]);
      c.localAltilloM2.setValidators([Validators.min(0)]);
    } else if (tipo === 'Casa') {
      c.casaPlantas.setValidators([Validators.required, Validators.min(1)]);
      c.casaHabitaciones.setValidators([Validators.required, Validators.min(1)]);
      c.casaBanos.setValidators([Validators.required, Validators.min(1)]);
    } else if (tipo === 'Departamento') {
      c.deptoPiso.setValidators([Validators.required, Validators.min(0)]);
      c.deptoHabitaciones.setValidators([Validators.required, Validators.min(1)]);
      c.deptoBanos.setValidators([Validators.required, Validators.min(1)]);
    } else if (tipo === 'Oficina') {
      c.oficinaAmbientes.setValidators([Validators.required, Validators.min(1)]);
      c.oficinaPiso.setValidators([Validators.required, Validators.min(0)]);
      c.oficinaBanos.setValidators([Validators.required, Validators.min(1)]);
      c.oficinaParqueaderos.setValidators([Validators.required, Validators.min(0)]);
    }

    condicionales.forEach((ctrl) => ctrl.updateValueAndValidity({ emitEvent: false }));
  }

  private validadorReferenciaUnica(control: AbstractControl): ValidationErrors | null {
    const val = String(control.value ?? '').trim();
    if (!val) return null;
    return this.service.referenciaExiste(val, this.editandoId() ?? undefined)
      ? { referenciaDuplicada: true }
      : null;
  }

  // ==================== PROPIETARIOS ====================

  abrirNuevoPropietario(): void {
    this.editandoId.set(null);
    this.formPropietario.reset();
    this.modalPropietario.set(true);
  }

  abrirEditarPropietario(prop: PropietarioModel): void {
    this.editandoId.set(prop.id);
    this.formPropietario.reset(prop.toJSON());
    this.modalPropietario.set(true);
  }

  guardarPropietario(): void {
    this.formPropietario.markAllAsTouched();
    if (this.formPropietario.invalid) {
      this.notifications.advertencia('Complete correctamente todos los datos del propietario.');
      return;
    }
    const v = this.formPropietario.getRawValue();
    const payload = {
      identificacion: v.identificacion ?? '',
      nombres: v.nombres ?? '',
      apellidos: v.apellidos ?? '',
      telefono: v.telefono ?? '',
      email: v.email ?? '',
      direccion: v.direccion ?? '',
    };
    const id = this.editandoId();
    const res = id
      ? this.service.actualizarPropietario(id, payload)
      : this.service.crearPropietario(payload);

    if (res.ok) {
      this.notifications.exito(res.mensaje);
      this.modalPropietario.set(false);
    } else {
      this.notifications.error(res.mensaje);
    }
  }

  // ==================== OFICINAS ====================

  abrirNuevaOficina(): void {
    this.editandoId.set(null);
    this.formOficina.reset({ activa: true });
    this.modalOficina.set(true);
  }

  abrirEditarOficina(ofi: OficinaModel): void {
    this.editandoId.set(ofi.id);
    this.formOficina.reset(ofi.toJSON());
    this.modalOficina.set(true);
  }

  guardarOficina(): void {
    this.formOficina.markAllAsTouched();
    if (this.formOficina.invalid) {
      this.notifications.advertencia('Complete correctamente todos los campos de la oficina.');
      return;
    }
    const v = this.formOficina.getRawValue();
    const payload = {
      codigo: v.codigo ?? '',
      nombre: v.nombre ?? '',
      ciudad: v.ciudad ?? '',
      canton: v.canton ?? '',
      direccion: v.direccion ?? '',
      telefono: v.telefono ?? '',
      email: v.email ?? '',
      encargado: v.encargado ?? '',
      activa: Boolean(v.activa),
    };
    const id = this.editandoId();
    const res = id
      ? this.service.actualizarOficina(id, payload)
      : this.service.crearOficina(payload);

    if (res.ok) {
      this.notifications.exito(res.mensaje);
      this.modalOficina.set(false);
    } else {
      this.notifications.error(res.mensaje);
    }
  }

  // ==================== CLIENTES ====================

  abrirNuevoCliente(): void {
    this.editandoId.set(null);
    this.formCliente.reset();
    this.modalCliente.set(true);
  }

  abrirEditarCliente(cli: ClienteModel): void {
    this.editandoId.set(cli.id);
    this.formCliente.reset(cli.toJSON());
    this.modalCliente.set(true);
  }

  guardarCliente(): void {
    this.formCliente.markAllAsTouched();
    if (this.formCliente.invalid) {
      this.notifications.advertencia('Complete correctamente los datos del cliente.');
      return;
    }
    const v = this.formCliente.getRawValue();
    const payload = {
      identificacion: v.identificacion ?? '',
      nombres: v.nombres ?? '',
      apellidos: v.apellidos ?? '',
      telefono: v.telefono ?? '',
      email: v.email ?? '',
      presupuestoMax: v.presupuestoMax !== null && v.presupuestoMax !== undefined ? Number(v.presupuestoMax) : null,
      notas: v.notas ?? '',
    };
    const id = this.editandoId();
    const res = id
      ? this.service.actualizarCliente(id, payload)
      : this.service.crearCliente(payload);

    if (res.ok) {
      this.notifications.exito(res.mensaje);
      this.modalCliente.set(false);
    } else {
      this.notifications.error(res.mensaje);
    }
  }

  // ==================== CONFIRMACIÓN DE ELIMINACIÓN ====================

  solicitarEliminar(entidad: TabMantenimiento, id: string, etiqueta: string): void {
    this.confirmacion.set({
      entidad,
      id,
      titulo: 'Confirmar eliminación',
      mensaje: `¿Está seguro de eliminar "${etiqueta}"?`,
    });
  }

  ejecutarEliminacion(): void {
    const c = this.confirmacion();
    if (!c) return;
    this.confirmacion.set(null);

    let res;
    if (c.entidad === 'inmuebles') res = this.service.eliminarInmueble(c.id);
    else if (c.entidad === 'propietarios') res = this.service.eliminarPropietario(c.id);
    else if (c.entidad === 'oficinas') res = this.service.eliminarOficina(c.id);
    else res = this.service.eliminarCliente(c.id);

    if (res.ok) this.notifications.exito(res.mensaje);
    else this.notifications.error(res.mensaje);
  }

  // ==================== HELPERS ====================

  esInvalido(ctrl: AbstractControl): boolean {
    return ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  contarInmueblesPropietario(propId: string): number {
    return this.service.inmuebles().filter((i) => i.propietarioId === propId).length;
  }

  contarInmueblesOficina(ofiId: string): number {
    return this.service.inmuebles().filter((i) => i.oficinaResponsableId === ofiId).length;
  }

  contarLlavesOficina(ofiId: string): number {
    return this.service.inmuebles().filter((i) => i.oficinaLlavesId === ofiId).length;
  }

  contarVisitasCliente(clienteId: string): number {
    return this.service.visitas().filter((v) => v.clienteId === clienteId).length;
  }

  nombrePropietario(id: string): string {
    return this.service.obtenerPropietarioPorId(id)?.nombreCompleto ?? '—';
  }

  nombreOficina(id: string | null): string {
    if (!id) return 'Propietario';
    return this.service.obtenerOficinaPorId(id)?.nombre ?? '—';
  }
}
