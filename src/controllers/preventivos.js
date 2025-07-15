const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const db = require('../db');

exports.subirFotos = async (req, res) => {
  const { centro_id, fecha_preventivo, usuario_id } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).send({ message: 'No se han subido imágenes' });
  }

  try {
    const { rows } = await db.query('SELECT propietario, nombre FROM centros WHERE id = $1', [centro_id]);
    const propietario = rows[0].propietario;
    const nombre_centro = rows[0].nombre;
    const year = new Date(fecha_preventivo).getFullYear();

    const uploadPath = path.join(__dirname, `../../uploads/${propietario}/${year}/${nombre_centro}`);
    fs.mkdirSync(uploadPath, { recursive: true });

    for (const file of files) {
      const original_size_mb = file.size / (1024 * 1024);
      let sharp_instance = sharp(file.buffer);

      if (original_size_mb > 5) {
        sharp_instance = sharp_instance.jpeg({ quality: 70 });
      } else if (original_size_mb > 2) {
        sharp_instance = sharp_instance.jpeg({ quality: 85 });
      } else {
        const metadata = await sharp_instance.metadata();
        if (metadata.width > 1920) {
          sharp_instance = sharp_instance.resize({ width: 1920 });
        }
      }

      const new_filename = file.originalname;
      const final_path = path.join(uploadPath, new_filename);
      const processed_image = await sharp_instance.toBuffer();
      fs.writeFileSync(final_path, processed_image);

      const final_size_mb = processed_image.length / (1024 * 1024);

      await db.query(
        'INSERT INTO imagenes_preventivos (centro_id, ruta_archivo, nombre_archivo, usuario_id, estado, tamaño_original, tamaño_final) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [centro_id, final_path, new_filename, usuario_id, 'ok', original_size_mb, final_size_mb]
      );
    }

    res.status(200).send({ message: 'Imágenes subidas y procesadas correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error al procesar las imágenes', error: error.message });
  }
};
