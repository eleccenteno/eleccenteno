document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('upload-form');
  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('file-input');
  const preview = document.getElementById('preview');
  let filesToUpload = [];

  // Abrir selector de archivos al hacer clic en el área de drop
  dropArea.addEventListener('click', () => fileInput.click());

  // Manejar drag and drop
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('bg-light');
  });

  dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('bg-light');
  });

  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('bg-light');
    const files = e.dataTransfer.files;
    handleFiles(files);
  });

  // Manejar selección de archivos
  fileInput.addEventListener('change', () => {
    const files = fileInput.files;
    handleFiles(files);
  });

  function handleFiles(files) {
    for (const file of files) {
      if (validateFile(file)) {
        filesToUpload.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement('img');
          img.src = e.target.result;
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  function validateFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 6 * 1024 * 1024; // 6MB

    if (!allowedTypes.includes(file.type)) {
      alert(`Error: El archivo ${file.name} no es una imagen válida.`);
      return false;
    }

    if (file.size > maxSize) {
      alert(`Error: El archivo ${file.name} supera el tamaño máximo de 6MB.`);
      return false;
    }

    return true;
  }

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const centroId = document.getElementById('centro-id').value;
    const fechaPreventivo = document.getElementById('fecha-preventivo').value;
    const usuarioId = document.getElementById('usuario-id').value;

    if (filesToUpload.length === 0) {
      alert('Por favor, selecciona al menos una imagen.');
      return;
    }

    const formData = new FormData();
    formData.append('centro_id', centroId);
    formData.append('fecha_preventivo', fechaPreventivo);
    if (usuarioId) {
      formData.append('usuario_id', usuarioId);
    }

    for (const file of filesToUpload) {
      formData.append('imagenes', file);
    }

    try {
      const response = await fetch('/api/preventivos/subir-fotos', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Imágenes subidas correctamente.');
        preview.innerHTML = '';
        filesToUpload = [];
        loadImages();
      } else {
        const error = await response.json();
        alert(`Error al subir las imágenes: ${error.message}`);
      }
    } catch (error) {
      alert(`Error de red: ${error.message}`);
    }
  });

  // Listado de imágenes
  const imageList = document.getElementById('image-list');
  const pagination = document.getElementById('pagination');
  let currentPage = 1;
  const itemsPerPage = 10;

  async function loadImages(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    try {
      const response = await fetch(`/api/imagenes?${query}`);
      const images = await response.json();
      renderImages(images);
    } catch (error) {
      console.error('Error al cargar las imágenes:', error);
    }
  }

  function renderImages(images) {
    imageList.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedImages = images.slice(start, end);

    for (const image of paginatedImages) {
      const col = document.createElement('div');
      col.className = 'col-md-3 mb-3';
      col.innerHTML = `
        <div class="card">
          <img src="${image.ruta_archivo.replace('/app/API-IMAGENES', '')}" class="card-img-top" alt="${image.nombre_archivo}">
          <div class="card-body">
            <p class="card-text">${image.nombre_archivo}</p>
            <p class="card-text">Original: ${image.tamaño_original.toFixed(2)} MB</p>
            <p class="card-text">Final: ${image.tamaño_final.toFixed(2)} MB</p>
            <button class="btn btn-danger btn-sm" onclick="deleteImage(${image.id})">Eliminar</button>
          </div>
        </div>
      `;
      imageList.appendChild(col);
    }
    renderPagination(images.length);
  }

  function renderPagination(totalItems) {
    pagination.innerHTML = '';
    const pageCount = Math.ceil(totalItems / itemsPerPage);
    for (let i = 1; i <= pageCount; i++) {
      const li = document.createElement('li');
      li.className = `page-item ${i === currentPage ? 'active' : ''}`;
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener('click', (e) => {
        e.preventDefault();
        currentPage = i;
        loadImages();
      });
      pagination.appendChild(li);
    }
  }

  async function deleteImage(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      try {
        const response = await fetch(`/api/imagenes/${id}`, { method: 'DELETE' });
        if (response.ok) {
          loadImages();
        } else {
          alert('Error al eliminar la imagen.');
        }
      } catch (error) {
        console.error('Error al eliminar la imagen:', error);
      }
    }
  }

  loadImages();
  loadFilters();
  loadStats();
  loadLogs();

  // Cargar filtros
  async function loadFilters() {
    try {
      const [propietariosRes, aniosRes, centrosRes] = await Promise.all([
        fetch('/api/filtros/propietarios'),
        fetch('/api/filtros/anios'),
        fetch('/api/filtros/centros'),
      ]);
      const propietarios = await propietariosRes.json();
      const anios = await aniosRes.json();
      const centros = await centrosRes.json();

      const propietarioFilter = document.getElementById('filter-propietario');
      propietarios.forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p;
        propietarioFilter.appendChild(option);
      });

      const anioFilter = document.getElementById('filter-año');
      anios.forEach(a => {
        const option = document.createElement('option');
        option.value = a;
        option.textContent = a;
        anioFilter.appendChild(option);
      });

      const centroFilter = document.getElementById('filter-centro');
      centros.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.nombre;
        centroFilter.appendChild(option);
      });
    } catch (error) {
      console.error('Error al cargar los filtros:', error);
    }
  }

  document.getElementById('filter-propietario').addEventListener('change', () => applyFilters());
  document.getElementById('filter-año').addEventListener('change', () => applyFilters());
  document.getElementById('filter-centro').addEventListener('change', () => applyFilters());

  function applyFilters() {
    const filters = {
      propietario: document.getElementById('filter-propietario').value,
      año: document.getElementById('filter-año').value,
      centro: document.getElementById('filter-centro').value,
    };
    loadImages(filters);
  }

  // Cargar métricas
  async function loadStats() {
    try {
      const response = await fetch('/api/admin/stats');
      const stats = await response.json();
      const statsContainer = document.getElementById('stats');
      statsContainer.innerHTML = `
        <p><strong>Total de imágenes:</strong> ${stats.total_images}</p>
        <p><strong>Espacio total ocupado:</strong> ${stats.total_size_mb.toFixed(2)} MB</p>
        <p><strong>Uso del disco:</strong> ${stats.disk_usage}</p>
        ${stats.disk_alert ? '<p class="text-danger"><strong>Alerta:</strong> El uso del disco supera el 80%</p>' : ''}
        <h5>Imágenes por centro</h5>
        <ul>
          ${stats.images_per_center.map(c => `<li>${c.nombre}: ${c.count}</li>`).join('')}
        </ul>
        <h5>Imágenes por propietario</h5>
        <ul>
          ${stats.images_per_owner.map(o => `<li>${o.propietario}: ${o.count}</li>`).join('')}
        </ul>
        <h5>Centros sin imágenes</h5>
        <ul>
          ${stats.centers_without_images.map(c => `<li>${c.nombre}</li>`).join('')}
        </ul>
      `;
    } catch (error) {
      console.error('Error al cargar las métricas:', error);
    }
  }

  // Cargar logs
  async function loadLogs() {
    try {
      const response = await fetch('/api/admin/logs'); // Asume que este endpoint existe
      const logs = await response.json();
      const logsContainer = document.getElementById('logs');
      logsContainer.innerHTML = `
        <pre>${JSON.stringify(logs, null, 2)}</pre>
      `;
    } catch (error) {
      console.error('Error al cargar los logs:', error);
      document.getElementById('logs').innerHTML = '<p>No se pudieron cargar los logs.</p>';
    }
  }

  // Reintento de subida
  window.addEventListener('load', () => {
    const pendingUploads = JSON.parse(localStorage.getItem('pendingUploads') || '[]');
    if (pendingUploads.length > 0) {
      if (confirm(`Tienes ${pendingUploads.length} subidas pendientes. ¿Quieres reintentar ahora?`)) {
        // Lógica para reintentar la subida
      }
    }
  });

  // Sobrescribir el evento de submit para guardar en localStorage en caso de fallo
  const originalSubmit = uploadForm.onsubmit;
  uploadForm.onsubmit = async (e) => {
    e.preventDefault();
    try {
      await originalSubmit(e);
    } catch (error) {
      const pendingUploads = JSON.parse(localStorage.getItem('pendingUploads') || '[]');
      pendingUploads.push({
        centroId: document.getElementById('centro-id').value,
        fechaPreventivo: document.getElementById('fecha-preventivo').value,
        usuarioId: document.getElementById('usuario-id').value,
        files: filesToUpload.map(f => f.name), // Simplificado, se necesitaría una forma de almacenar los archivos
      });
      localStorage.setItem('pendingUploads', JSON.stringify(pendingUploads));
      alert('Error al subir. La subida se ha guardado para reintentar más tarde.');
    }
  };
});
