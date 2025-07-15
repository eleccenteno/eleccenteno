const express = require('express');
const app = express();
const port = 3092;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const preventivosRoutes = require('./src/routes/preventivos');
const adminRoutes = require('./src/routes/admin');

app.use('/api/preventivos', preventivosRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('API de imágenes funcionando');
});

require('./src/cron/maintenance');

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
