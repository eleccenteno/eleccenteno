CREATE TABLE imagenes_preventivos (
  id SERIAL PRIMARY KEY,
  centro_id INTEGER NOT NULL,
  ruta_archivo VARCHAR(255) NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  fecha_subida TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_id INTEGER,
  estado VARCHAR(10) NOT NULL,
  tamaño_original REAL NOT NULL,
  tamaño_final REAL NOT NULL
);
