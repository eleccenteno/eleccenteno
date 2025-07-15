const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/propietarios', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT DISTINCT propietario FROM centros');
    res.json(rows.map(r => r.propietario));
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener propietarios' });
  }
});

router.get('/anios', async (req, res) => {
  try {
    const { rows } = await db.query("SELECT DISTINCT EXTRACT(YEAR FROM fecha_subida) as year FROM imagenes_preventivos");
    res.json(rows.map(r => r.year));
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener años' });
  }
});

router.get('/centros', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, nombre FROM centros');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener centros' });
  }
});

module.exports = router;
