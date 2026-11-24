import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    title: 'Dashboard · InmoGestión 360',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'catalogo',
    title: 'Catálogo y Consultas · InmoGestión 360',
    loadComponent: () =>
      import('./pages/catalogo/catalogo.component').then((m) => m.CatalogoComponent),
  },
  {
    path: 'catalogo/:id',
    title: 'Detalle de Inmueble · InmoGestión 360',
    loadComponent: () =>
      import('./pages/inmueble-detalle/inmueble-detalle.component').then(
        (m) => m.InmuebleDetalleComponent
      ),
  },
  {
    path: 'mantenimiento',
    title: 'Mantenimiento CRUD · InmoGestión 360',
    loadComponent: () =>
      import('./pages/mantenimiento/mantenimiento.component').then((m) => m.MantenimientoComponent),
  },
  {
    path: 'visitas',
    title: 'Gestión de Visitas · InmoGestión 360',
    loadComponent: () =>
      import('./pages/visitas/visitas.component').then((m) => m.VisitasComponent),
  },
  {
    path: 'reportes',
    title: 'Reportes · InmoGestión 360',
    loadComponent: () =>
      import('./pages/reportes/reportes.component').then((m) => m.ReportesComponent),
  },
  {
    path: 'reportes/ficha/:id',
    title: 'Ficha Imprimible · InmoGestión 360',
    loadComponent: () =>
      import('./pages/reportes/ficha-imprimible.component').then((m) => m.FichaImprimibleComponent),
  },
  {
    path: '**',
    title: 'Página no encontrada · InmoGestión 360',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
