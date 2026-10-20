// Estado de la App
let cuadernos = JSON.parse(localStorage.getItem('cuadernos')) || [];
let notas = JSON.parse(localStorage.getItem('notas')) || [];
let currentDeleteTarget = null; // Para el modal de confirmacion

// Elementos DOM
const themeSelect = document.getElementById('themeSelect');
const sectionCuadernos = document.getElementById('sectionCuadernos');
const sectionNotas = document.getElementById('sectionNotas');

const gridCuadernos = document.getElementById('gridCuadernos');
const gridNotas = document.getElementById('gridNotas');

const emptyCuadernos = document.getElementById('emptyCuadernos');
const emptyNotas = document.getElementById('emptyNotas');

const badgeCuadernos = document.getElementById('badgeCuadernos');
const badgeNotas = document.getElementById('badgeNotas');

// Modales y FAB
const fabAdd = document.getElementById('fabAdd');
const fabMenu = document.getElementById('fabMenu');
const modalNota = document.getElementById('modalNota');
const modalConfirm = document.getElementById('modalConfirm');

// Inicializacion
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  renderAll();
});

// Selector de Temas
themeSelect.addEventListener('change', (e) => {
  document.body.className = `theme-${e.target.value}`;
  localStorage.setItem('selectedTheme', e.target.value);
});

function loadTheme() {
  const savedTheme = localStorage.getItem('selectedTheme') || 'cobalt';
  themeSelect.value = savedTheme;
  document.body.className = `theme-${savedTheme}`;
}

// Control del Acordeon
document.getElementById('btnToggleCuadernos').addEventListener('click', () => {
  sectionCuadernos.classList.toggle('collapsed');
});

document.getElementById('btnToggleNotas').addEventListener('click', () => {
  sectionNotas.classList.toggle('collapsed');
});

// Renderizado y Regla de Cierre Inicial (Si esta vacio = colapsado)
function renderAll() {
  // Cuadernos
  badgeCuadernos.textContent = cuadernos.length;
  gridCuadernos.innerHTML = '';
  if (cuadernos.length === 0) {
    emptyCuadernos.style.display = 'block';
    sectionCuadernos.classList.add('collapsed'); // Cierra si esta vacio
  } else {
    emptyCuadernos.style.display = 'none';
    cuadernos.forEach((c, idx) => {
      gridCuadernos.appendChild(createCard(c.title, 'Cuaderno', null, () => confirmDelete('cuaderno', idx)));
    });
  }

  // Notas
  badgeNotas.textContent = notas.length;
  gridNotas.innerHTML = '';
  if (notas.length === 0) {
    emptyNotas.style.display = 'block';
    sectionNotas.classList.add('collapsed'); // Cierra si esta vacio
  } else {
    emptyNotas.style.display = 'none';
    notas.forEach((n, idx) => {
      gridNotas.appendChild(createCard(n.title, n.content, n.cover, () => confirmDelete('nota', idx)));
    });
  }
}

// Creador de Tarjetas Generico
function createCard(title, desc, coverUrl, onDelete) {
  const card = document.createElement('div');
  card.className = 'card';
  
  if (coverUrl) {
    const img = document.createElement('img');
    img.src = coverUrl;
    img.className = 'card-cover';
    card.appendChild(img);
  }

  const body = document.createElement('div');
  body.className = 'card-body';
  body.innerHTML = `<h4 class="card-title">${title}</h4><p class="card-desc">${desc}</p>`;
  
  const delBtn = document.createElement('button');
  delBtn.className = 'card-delete';
  delBtn.textContent = '×';
  delBtn.onclick = (e) => {
    e.stopPropagation();
    onDelete();
  };

  card.appendChild(body);
  card.appendChild(delBtn);
  return card;
}

// Boton Flotante (+)
fabAdd.addEventListener('click', () => {
  fabMenu.classList.toggle('active');
});

document.getElementById('btnNewNota').addEventListener('click', () => {
  fabMenu.classList.remove('active');
  modalNota.classList.add('active');
});

document.getElementById('btnNewCuaderno').addEventListener('click', () => {
  fabMenu.classList.remove('active');
  const title = prompt('Nombre del nuevo cuaderno:');
  if (title) {
    cuadernos.push({ title });
    saveAndRender();
  }
});

// Guardar Nota con Portada
document.getElementById('btnSaveNota').addEventListener('click', () => {
  const title = document.getElementById('inputNotaTitle').value;
  const cover = document.getElementById('inputNotaCover').value;
  const content = document.getElementById('inputNotaContent').value;

  if (title) {
    notas.push({ title, cover, content });
    saveAndRender();
    modalNota.classList.remove('active');
    document.getElementById('inputNotaTitle').value = '';
    document.getElementById('inputNotaCover').value = '';
    document.getElementById('inputNotaContent').value = '';
  }
});

document.getElementById('btnCancelNota').addEventListener('click', () => {
  modalNota.classList.remove('active');
});

// Modal de Confirmacion Personalizado para Eliminar
function confirmDelete(type, index) {
  currentDeleteTarget = { type, index };
  modalConfirm.classList.add('active');
}

document.getElementById('btnAcceptConfirm').addEventListener('click', () => {
  if (currentDeleteTarget) {
    if (currentDeleteTarget.type === 'cuaderno') {
      cuadernos.splice(currentDeleteTarget.index, 1);
    } else {
      notas.splice(currentDeleteTarget.index, 1);
    }
    saveAndRender();
  }
  modalConfirm.classList.remove('active');
});

document.getElementById('btnCancelConfirm').addEventListener('click', () => {
  modalConfirm.classList.remove('active');
});

function saveAndRender() {
  localStorage.setItem('cuadernos', JSON.stringify(cuadernos));
  localStorage.setItem('notas', JSON.stringify(notas));
  renderAll();
}
