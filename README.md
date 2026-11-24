# InmoGestión 360 · Plataforma de Gestión Inmobiliaria (Angular 22)

Prototipo funcional web responsive desarrollado en **Angular 22** con componentes standalone, Signals, formularios reactivos y persistencia local (`localStorage`), diseñado para centralizar la gestión de inmuebles, oficinas, propietarios, clientes, visitas, reportes y analítica en tiempo real.

## Requisitos previos

- **Node.js** >= 20
- **npm** >= 10
- **Angular CLI** 22 (`@angular/cli`)

## Instalación y ejecución

```bash
npm install
npm start
```

Abrir en el navegador: `http://localhost:4200`

## Compilación y pruebas unitarias

```bash
npm run build
npm test
```

## Módulos y rutas principales

| Ruta | Descripción |
| :--- | :--- |
| `/dashboard` | Indicadores KPI dinámicos, 3 gráficos interactivos (por tipo, por ciudad y visitas por estado), indicadores por oficina y próximas visitas. |
| `/catalogo` | Catálogo visual en **tarjetas y tabla**, búsqueda textual, ordenamiento, paginación, filtros avanzados combinables, casos rápidos de demostración, favoritos y filtros guardados. |
| `/catalogo/:id` | Vista detallada con galería de imágenes (con imagen alternativa automática si falla una URL), características particulares, oficina responsable, ubicación de llaves e historial de visitas. |
| `/mantenimiento` | Administración CRUD completa de **Inmuebles**, **Propietarios**, **Oficinas** y **Clientes** con validaciones obligatorias, numéricas y condicionales, confirmación previa y control de integridad referencial. |
| `/visitas` | Programación, reprogramación, registro de impresión/realización y cancelación de visitas, con bloqueo de conflictos de horario en un mismo inmueble e historial por inmueble y cliente. |
| `/reportes` | Resumen filtrable del portafolio con impresión directa, exportación a **CSV** y respaldo completo en **JSON**. |
| `/reportes/ficha/:id` | Ficha técnica imprimible por inmueble con fotografías, características, propietario, oficina/llaves y registro de visitas. |
| `/**` | Gestión amigable de rutas inexistentes (404). |

## Documentación técnica y diagrama UML

El análisis completo del dominio, el **diagrama de clases UML**, las decisiones de arquitectura y la guía para demostrar los casos de consulta se encuentran en [`docs/DOCUMENTACION_TECNICA.md`](docs/DOCUMENTACION_TECNICA.md).
