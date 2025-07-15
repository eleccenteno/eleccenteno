const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { exec } = require('child_process');

// Cron job para ejecutarse todos los domingos a las 2 AM
cron.schedule('0 2 * * 0', async () => {
  console.log('Ejecutando cron job de mantenimiento...');
  const log = {
    timestamp: new Date(),
    duplicates: [],
    orphaned_paths: [],
  };

  try {
    // Detectar imágenes duplicadas (basado en el nombre de archivo y centro)
    const { rows: duplicates } = await db.query(`
      SELECT nombre_archivo, centro_id, COUNT(*)
      FROM imagenes_preventivos
      GROUP BY nombre_archivo, centro_id
      HAVING COUNT(*) > 1;
    `);
    log.duplicates = duplicates;

    // Detectar rutas huérfanas
    const { rows: centros } = await db.query('SELECT id FROM centros');
    const existing_centros = centros.map(c => c.id.toString());
    const uploads_path = path.join(__dirname, '../../uploads');

    const propietarios = fs.readdirSync(uploads_path);
    for (const propietario of propietarios) {
      const propietario_path = path.join(uploads_path, propietario);
      if (fs.statSync(propietario_path).isDirectory()) {
        const years = fs.readdirSync(propietario_path);
        for (const year of years) {
          const year_path = path.join(propietario_path, year);
          if (fs.statSync(year_path).isDirectory()) {
            const centros_dirs = fs.readdirSync(year_path);
            for (const centro_dir of centros_dirs) {
              const centro_path = path.join(year_path, centro_dir);
              // Esta es una simplificación. Se necesitaría una forma de mapear el nombre de la carpeta al id del centro.
              // Por ahora, solo se añade al log.
              log.orphaned_paths.push(centro_path);
            }
          }
        }
      }
    }

  } catch (error) {
    log.error = error.message;
  } finally {
    const log_path = path.join(__dirname, '../../logs');
    fs.mkdirSync(log_path, { recursive: true });
    fs.writeFileSync(path.join(log_path, `maintenance-${Date.now()}.json`), JSON.stringify(log, null, 2));
    console.log('Cron job de mantenimiento finalizado.');
  }
});
