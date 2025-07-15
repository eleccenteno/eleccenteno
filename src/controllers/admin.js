const db = require('../db');
const { exec } = require('child_process');

const fs = require('fs');
const path = require('path');

exports.getStats = async (req, res) => {
  try {
    const { rows: total_images } = await db.query('SELECT COUNT(*) FROM imagenes_preventivos');
    const { rows: total_size } = await db.query('SELECT SUM(tamaño_final) FROM imagenes_preventivos');
    const { rows: images_per_center } = await db.query(`
      SELECT c.nombre, COUNT(i.id)
      FROM centros c
      LEFT JOIN imagenes_preventivos i ON c.id = i.centro_id
      GROUP BY c.nombre;
    `);
    const { rows: images_per_owner } = await db.query(`
      SELECT c.propietario, COUNT(i.id)
      FROM centros c
      LEFT JOIN imagenes_preventivos i ON c.id = i.centro_id
      GROUP BY c.propietario;
    `);
    const { rows: centers_without_images } = await db.query(`
      SELECT c.nombre
      FROM centros c
      LEFT JOIN imagenes_preventivos i ON c.id = i.centro_id
      WHERE i.id IS NULL;
    `);

    exec('df -h /', (err, stdout) => {
      let disk_usage = 'No disponible';
      if (!err) {
        const lines = stdout.split('\n');
        const main_line = lines[1];
        const parts = main_line.split(/\s+/);
        disk_usage = parts[4];
      }

      res.status(200).send({
        total_images: total_images[0].count,
        total_size_mb: total_size[0].sum,
        images_per_center,
        images_per_owner,
        centers_without_images,
        disk_usage,
        disk_alert: parseInt(disk_usage) > 80,
      });
    });

  } catch (error) {
    res.status(500).send({ message: 'Error al obtener las estadísticas', error: error.message });
  }
};

exports.getLogs = (req, res) => {
  const logDir = path.join(__dirname, '../../logs');
  fs.readdir(logDir, (err, files) => {
    if (err) {
      return res.status(500).send({ message: 'No se pudo leer el directorio de logs' });
    }
    const logs = files.map(file => {
      const content = fs.readFileSync(path.join(logDir, file), 'utf-8');
      return JSON.parse(content);
    });
    res.json(logs);
  });
};
