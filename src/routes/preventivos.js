const express = require('express');
const router = express.Router();
const preventivosController = require('../controllers/preventivos');
const upload = require('../middlewares/upload');

router.post('/subir-fotos', upload.array('imagenes', 20), preventivosController.subirFotos);

module.exports = router;
