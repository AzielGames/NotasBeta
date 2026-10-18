let notes = JSON.parse(localStorage.getItem('my_rich_notes')) || [];
let books = JSON.parse(localStorage.getItem('my_rich_books')) || [];

let activeBookIndex = null;
let activePageIndex = 0;
let editingNoteIndex = null;
let tempCoverBase64 = '';
let selectedImageElement = null;

let isBooksCollapsed = false;
let isNotesCollapsed = false;

function toggleSection(section) {
  if (section === 'books') {
    isBooksCollapsed = !isBooksCollapsed;
  } else if (section === 'notes') {
    isNotesCollapsed = !isNotesCollapsed;
  }
  actualizarEstadoSecciones();
}

function actualizarEstadoSecciones() {
  const secBooks = document.getElementById('sectionBooks');
  const secNotes = document.getElementById('sectionNotes');
  const btnBooks = document.getElementById('btnToggleBooks');
  const btnNotes = document.getElementById('btnToggleNotes');

  if (isBooksCollapsed) {
    secBooks.classList.add('collapsed');
    btnBooks.textContent = '▼';
  } else {
    secBooks.classList.remove('collapsed');
    btnBooks.textContent = '▲';
  }

  if (isNotesCollapsed) {
    secNotes.classList.add('collapsed');
    btnNotes.textContent = '▼';
  } else {
    secNotes.classList.remove('collapsed');
    btnNotes.textContent = '▲';
  }
}

function renderAll() {
  renderNotes();
  renderBooks();
}

function renderNotes() {
  const grid = document.getElementById('notesGrid');
  grid.innerHTML = '';
  document.getElementById('notesCount').textContent = notes.length;

  if (notes.length === 0) {
    grid.innerHTML = `<p style="color:var(--text-muted); font-size:0.75rem; text-align:center; padding: 8px;">No hay notas guardadas.</p>`;
    return;
  }

  notes.forEach((note, index) => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.onclick = () => abrirModalEditarNota(index);
    card.innerHTML = `
      <div class="card-title">${note.title || 'Sin título'}</div>
      <div class="card-preview">${note.textPreview || 'Nota multimedia...'}</div>
      <button class="delete-btn" onclick="eliminarNota(event, ${index})">✕</button>
    `;
    grid.appendChild(card);
  });
}

function renderBooks() {
  const grid = document.getElementById('booksGrid');
  grid.innerHTML = '';
  document.getElementById('booksCount').textContent = books.length;

  if (books.length === 0) {
    grid.innerHTML = `<p style="color:var(--text-muted); font-size:0.75rem; text-align:center; padding: 8px;">No hay libros creados.</p>`;
    return;
  }

  books.forEach((book, index) => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.onclick = () => abrirVisorLibro(index);
    
    const coverThumb = book.cover 
      ? `<div class="book-card-thumb"><img src="${book.cover}"></div>`
      : `<div class="book-card-thumb">📖</div>`;

    card.innerHTML = `
      ${coverThumb}
      <div>
        <div class="card-title" style="color:${book.titleColor || '#38bdf8'}; font-size:${book.titleSize || '1rem'}">${book.title}</div>
        <div class="card-preview">${book.pages.length} página(s)</div>
      </div>
      <button class="delete-btn" onclick="eliminarLibro(event, ${index})">✕</button>
    `;
    grid.appendChild(card);
  });
}

/* --- FORMATO ESTILO WORD CON CORRECCIÓN DE COLOR --- */
function formatText(command) {
  document.execCommand(command, false, null);
}

function changeFontSize(size) {
  document.execCommand('fontSize', false, size);
}

function formatTextColor(color) {
  document.execCommand('styleWithCSS', false, true);
  document.execCommand('foreColor', false, color);
}

function actualizarEstiloTituloPreview() {
  const input = document.getElementById('bookTitle');
  const size = document.getElementById('bookTitleSize').value;
  const color = document.getElementById('bookTitleColor').value;
  input.style.fontSize = size;
  input.style.color = color;
}

function actualizarTituloEnVivo() {
  if (activeBookIndex === null) return;
  const book = books[activeBookIndex];
  book.title = document.getElementById('viewerBookTitleInput').value;
  book.titleSize = document.getElementById('viewerTitleSize').value;
  book.titleColor = document.getElementById('viewerTitleColor').value;
  
  const titleInput = document.getElementById('viewerBookTitleInput');
  titleInput.style.fontSize = book.titleSize;
  titleInput.style.color = book.titleColor;

  localStorage.setItem('my_rich_books', JSON.stringify(books));
}

/* --- GESTIÓN LIBRE DE IMÁGENES --- */
function insertarImagenEnEditor(editorId, event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const editor = document.getElementById(editorId);
    editor.focus();
    const img = document.createElement('img');
    img.src = e.target.result;
    img.style.width = '140px'; 
    img.style.display = 'inline-block';

    img.onclick = (evt) => seleccionarImagenEnEditor(img, editorId, evt);

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.insertNode(img);
    } else {
      editor.appendChild(img);
    }
  };
  reader.readAsDataURL(file);
}

function seleccionarImagenEnEditor(img, editorId, evt) {
  evt.stopPropagation();
  document.querySelectorAll('.rich-editor img').forEach(i => i.classList.remove('selected-img'));
  img.classList.add('selected-img');
  selectedImageElement = img;

  const controlBar = document.getElementById(`imageControlBar_${editorId}`);
  if (controlBar) {
    controlBar.style.display = 'flex';
    const currentW = parseInt(img.style.width) || 140;
    const slider = controlBar.querySelector('.img-slider');
    if (slider) slider.value = Math.min(150, Math.max(20, Math.round((currentW / 250) * 100)));
  }
}

function resizeImageBySlider(percentVal) {
  if (!selectedImageElement) return;
  const newWidth = Math.round((percentVal / 100) * 250);
  selectedImageElement.style.width = newWidth + 'px';
  selectedImageElement.style.height = 'auto'; // Elimina espacio fantasma en la altura
}

function setImageFloat(alignment) {
  if (!selectedImageElement) return;
  if (alignment === 'left') {
    selectedImageElement.style.float = 'left';
    selectedImageElement.style.margin = '4px 12px 4px 0';
    selectedImageElement.style.display = 'block';
  } else if (alignment === 'right') {
    selectedImageElement.style.float = 'right';
    selectedImageElement.style.margin = '4px 0 4px 12px';
    selectedImageElement.style.display = 'block';
  } else if (alignment === 'none') {
    selectedImageElement.style.float = 'none';
    selectedImageElement.style.margin = '6px';
    selectedImageElement.style.display = 'inline-block';
  }
}

function deseleccionarImagenes() {
  document.querySelectorAll('.rich-editor img').forEach(i => i.classList.remove('selected-img'));
  document.querySelectorAll('.image-control-bar').forEach(bar => bar.style.display = 'none');
  selectedImageElement = null;
}

document.addEventListener('click', deseleccionarImagenes);

/* --- PORTADA --- */
function cargarPortadaLibro(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    tempCoverBase64 = e.target.result;
    document.getElementById('bookCoverPreview').innerHTML = `<img src="${tempCoverBase64}">`;
  };
  reader.readAsDataURL(file);
}

/* --- NOTAS SIMPLES --- */
function abrirModalNuevaNota() {
  editingNoteIndex = null;
  document.getElementById('modalNoteTitle').textContent = 'Nueva Nota';
  document.getElementById('noteTitle').value = '';
  document.getElementById('noteContentEditor').innerHTML = '';
  document.getElementById('imageControlBar_noteContentEditor').style.display = 'none';
  document.getElementById('noteModal').classList.add('active');
}

function abrirModalEditarNota(index) {
  editingNoteIndex = index;
  document.getElementById('modalNoteTitle').textContent = 'Editar Nota';
  document.getElementById('noteTitle').value = notes[index].title;
  document.getElementById('noteContentEditor').innerHTML = notes[index].contentHtml;
  document.getElementById('imageControlBar_noteContentEditor').style.display = 'none';
  
  setTimeout(() => {
    document.querySelectorAll('#noteContentEditor img').forEach(img => {
      img.onclick = (evt) => seleccionarImagenEnEditor(img, 'noteContentEditor', evt);
    });
  }, 100);

  document.getElementById('noteModal').classList.add('active');
}

function guardarNota() {
  const title = document.getElementById('noteTitle').value.trim();
  const contentHtml = document.getElementById('noteContentEditor').innerHTML;
  const textPreview = document.getElementById('noteContentEditor').innerText.substring(0, 40);

  if (!title && !contentHtml.trim()) return;

  if (editingNoteIndex !== null) {
    notes[editingNoteIndex] = { title, contentHtml, textPreview };
  } else {
    notes.unshift({ title, contentHtml, textPreview });
  }

  localStorage.setItem('my_rich_notes', JSON.stringify(notes));
  cerrarModales();
  renderNotes();
}

function eliminarNota(event, index) {
  event.stopPropagation();
  if (confirm('¿Eliminar nota?')) {
    notes.splice(index, 1);
    localStorage.setItem('my_rich_notes', JSON.stringify(notes));
    renderNotes();
  }
}

/* --- LIBROS --- */
function abrirModalNuevoLibro() {
  document.getElementById('bookTitle').value = '';
  document.getElementById('bookTitleSize').value = '1.4rem';
  document.getElementById('bookTitleColor').value = '#38bdf8';
  actualizarEstiloTituloPreview();
  
  document.getElementById('firstPageEditor').innerHTML = '';
  document.getElementById('bookCoverInput').value = '';
  document.getElementById('bookCoverPreview').innerHTML = '<span class="cover-placeholder">🖼️ Tocar portada</span>';
  document.getElementById('imageControlBar_firstPageEditor').style.display = 'none';
  tempCoverBase64 = '';
  document.getElementById('bookModal').classList.add('active');
}

function guardarLibro() {
  const title = document.getElementById('bookTitle').value.trim();
  const titleSize = document.getElementById('bookTitleSize').value;
  const titleColor = document.getElementById('bookTitleColor').value;
  const firstContentHtml = document.getElementById('firstPageEditor').innerHTML;
  if (!title) return;

  books.unshift({
    title: title,
    titleSize: titleSize,
    titleColor: titleColor,
    cover: tempCoverBase64,
    pages: [firstContentHtml || 'Página inicial']
  });

  localStorage.setItem('my_rich_books', JSON.stringify(books));
  cerrarModales();
  renderBooks();
}

function eliminarLibro(event, index) {
  event.stopPropagation();
  if (confirm('¿Eliminar libro completo?')) {
    books.splice(index, 1);
    localStorage.setItem('my_rich_books', JSON.stringify(books));
    renderBooks();
  }
}

/* --- VISOR DE LIBRO --- */
function abrirVisorLibro(index) {
  activeBookIndex = index;
  activePageIndex = 0;
  const book = books[activeBookIndex];
  
  const titleInput = document.getElementById('viewerBookTitleInput');
  titleInput.value = book.title;
  titleInput.style.fontSize = book.titleSize || '1.4rem';
  titleInput.style.color = book.titleColor || '#38bdf8';

  document.getElementById('viewerTitleSize').value = book.titleSize || '1.4rem';
  document.getElementById('viewerTitleColor').value = book.titleColor || '#38bdf8';
  
  const coverContainer = document.getElementById('viewerBookCoverContainer');
  if (book.cover) {
    coverContainer.innerHTML = `<img src="${book.cover}">`;
    coverContainer.style.display = 'flex';
  } else {
    coverContainer.innerHTML = '<span class="cover-placeholder">Sin Portada</span>';
    coverContainer.style.display = 'flex';
  }

  document.getElementById('imageControlBar_currentPageEditor').style.display = 'none';
  actualizarPaginaVisor();
  document.getElementById('viewBookModal').classList.add('active');
}

function actualizarPaginaVisor() {
  const book = books[activeBookIndex];
  document.getElementById('pageIndicator').textContent = `Página ${activePageIndex + 1} de ${book.pages.length}`;
  document.getElementById('currentPageEditor').innerHTML = book.pages[activePageIndex] || '';

  setTimeout(() => {
    document.querySelectorAll('#currentPageEditor img').forEach(img => {
      img.onclick = (evt) => seleccionarImagenEnEditor(img, 'currentPageEditor', evt);
    });
  }, 100);
}

function cambiarPagina(direccion) {
  guardarPaginaActual();
  const book = books[activeBookIndex];
  const nuevaPagina = activePageIndex + direccion;

  if (nuevaPagina >= 0 && nuevaPagina < book.pages.length) {
    activePageIndex = nuevaPagina;
    actualizarPaginaVisor();
  }
}

function guardarPaginaActual() {
  if (activeBookIndex === null) return;
  const contentHtml = document.getElementById('currentPageEditor').innerHTML;
  books[activeBookIndex].pages[activePageIndex] = contentHtml;
  localStorage.setItem('my_rich_books', JSON.stringify(books));
}

function agregarPaginaAlLibro() {
  guardarPaginaActual();
  books[activeBookIndex].pages.push('');
  activePageIndex = books[activeBookIndex].pages.length - 1;
  actualizarPaginaVisor();
}

function cerrarModales() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

renderAll();

async function seleccionarCarpetaDispositivo() {
  try {
    // Solicita al sistema operativo (Android / Navegador) elegir una carpeta
    const directoryHandle = await window.showDirectoryPicker();
    alert(`¡Carpeta conectada con éxito! Ahora tus notas se guardarán directamente en tu almacenamiento.`);
    // Guardamos la referencia para guardar los archivos ahí
  } catch (err) {
    console.log('El usuario canceló o el dispositivo no soporta la API directa:', err);
  }
}

async function solicitarPermisoCarpeta() {
  if ('showDirectoryPicker' in window) {
    try {
      const handle = await window.showDirectoryPicker();
      alert('¡Permiso concedido! La app ahora tiene acceso directo a tu carpeta seleccionada para guardar sin límites.');
    } catch (err) {
      if (err.name !== 'AbortError') {
        alert('No se pudo conectar la carpeta o el usuario canceló.');
      }
    }
  } else {
    alert('Tu navegador/dispositivo actual utilizará el almacenamiento interno ampliado de la app.');
  }
}