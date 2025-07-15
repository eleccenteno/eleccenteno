# API de Subida de Imágenes

Esta es una API REST para subir, procesar y almacenar imágenes de preventivos.

## Características

- Subida de múltiples imágenes.
- Compresión adaptativa de imágenes.
- Estructura de carpetas dinámica.
- Almacenamiento de metadatos en PostgreSQL.
- Cron job para mantenimiento.
- Endpoint de estadísticas.

## Instalación

1. Clona el repositorio.
2. Instala las dependencias: `npm install`
3. Crea un archivo `.env` a partir de `.env.example` y configúralo con tus credenciales de PostgreSQL.
4. Ejecuta el script `src/db/init.sql` en tu base de datos para crear la tabla `imagenes_preventivos`.
5. Inicia el servidor: `node index.js`

## Endpoints

- `POST /api/preventivos/subir-fotos`: Sube imágenes.
  - `centro_id`: ID del centro.
  - `fecha_preventivo`: Fecha del preventivo.
  - `usuario_id`: ID del usuario (opcional).
  - `imagenes`: Archivos de imagen (hasta 20).
- `GET /api/admin/stats`: Obtiene estadísticas.

## Recomendaciones para el Frontend

### Reintento de subida

En caso de que la subida de una o más imágenes falle, se recomienda que el frontend guarde las imágenes localmente (por ejemplo, en `localStorage` o una base de datos local como `IndexedDB`) y las reintente subir automáticamente en segundo plano cuando se restablezca la conexión.

### Copia local en el teléfono

Para asegurar que no se pierdan las imágenes, se recomienda que el frontend guarde una copia de cada imagen subida en una carpeta local del teléfono llamada `CentenoAPP`.

## Cron Job

El cron job de mantenimiento se ejecuta todos los domingos a las 2 AM. Detecta imágenes duplicadas y rutas huérfanas, y genera un log en la carpeta `/logs`.
