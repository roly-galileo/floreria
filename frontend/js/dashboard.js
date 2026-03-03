/* ================================================
   ENCANTOS ETERNOS – dashboard.js
   Lógica completa del panel administrativo
================================================ */
'use strict';

// ─── Verificar autenticación ───────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!window.auth || !window.auth.isLoggedIn() || !window.auth.isAdmin()) {
    window.location.href = 'login.html';
    return;
  }
  initDashboard();
});

// ─── Estado global ─────────────────────────────
let chartVentas7 = null;
let chartVentasPeriodo = null;
let chartTopProd = null;
let chartEgresosCat = null;
let fotosPendientes = [];

// ─── INIT ───────────────────────────────────────
function initDashboard() {
  // Nombre usuario
  const session = window.auth.getSession();
  const nameEl = document.getElementById('sidebarUserName');
  if (nameEl) nameEl.textContent = session?.nombre || 'Admin';

  // Fecha en topbar
  const dateEl = document.getElementById('topbarDate');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Fechas por defecto
  const today = new Date().toISOString().split('T')[0];
  const setDate = id => { const el = document.getElementById(id); if (el) el.value = today; };
  setDate('ventaFecha'); setDate('egresoFecha');

  // Inicializar datos demo si vacío
  initDemoData();

  // Poblar selects
  poblarSelectProductos();

  // Renderizar páginas
  renderDashboard();
  renderTablaVentas();
  renderTablaProductos();
  renderInventario();
  renderGaleriaAdmin();
  renderEgresos();
  renderTrabajadores();
  initCharts();
}

// ─── DATOS DEMO ─────────────────────────────────
function initDemoData() {
  // Productos
  if (!localStorage.getItem('encantos_products')) {
    const demo = [
      { id: 1, nombre: 'Docena de Rosas Rojas', emoji: '🌹', categoria: 'amor aniversario', precio: 45, precioAnterior: 60, etiqueta: 'Oferta', stock: 15, descripcion: '12 rosas rojas frescas del campo andino.' },
      { id: 2, nombre: 'Ramo de Girasoles', emoji: '🌻', categoria: 'cumpleanos amor', precio: 35, precioAnterior: null, etiqueta: 'Nuevo', stock: 8, descripcion: '6 girasoles alegres y radiantes.' },
      { id: 3, nombre: 'Arreglo Primaveral', emoji: '💐', categoria: 'aniversario cumpleanos', precio: 75, precioAnterior: null, etiqueta: 'Favorito', stock: 5, descripcion: 'Mix de flores de temporada.' },
      { id: 4, nombre: 'Corona de Condolencias', emoji: '🤍', categoria: 'condolencias', precio: 120, precioAnterior: null, etiqueta: null, stock: 3, descripcion: 'Arreglo fúnebre con flores blancas.' },
      { id: 5, nombre: 'Rosas Arco Iris', emoji: '🌈', categoria: 'amor cumpleanos', precio: 55, precioAnterior: 70, etiqueta: 'Oferta', stock: 12, descripcion: 'Rosas teñidas en colores vibrantes.' },
      { id: 6, nombre: 'Bouquet Andino', emoji: '🌺', categoria: 'amor aniversario', precio: 40, precioAnterior: null, etiqueta: 'Favorito', stock: 10, descripcion: 'Flores silvestres andinas.' },
      { id: 7, nombre: 'Tulipanes Pastel', emoji: '🌷', categoria: 'aniversario amor', precio: 50, precioAnterior: null, etiqueta: null, stock: 7, descripcion: '8 tulipanes en tonos pastel.' },
      { id: 8, nombre: 'Caja Preservadas', emoji: '🎁', categoria: 'amor aniversario cumpleanos', precio: 95, precioAnterior: null, etiqueta: 'Nuevo', stock: 6, descripcion: 'Rosas tratadas que duran meses.' },
    ];
    localStorage.setItem('encantos_products', JSON.stringify(demo));
  }

  // Ventas demo
  if (!localStorage.getItem('encantos_ventas')) {
    const prods = getProducts();
    const ventas = [];
    const now = new Date();
    let id = 1;
    for (let d = 30; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const num = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < num; i++) {
        const p = prods[Math.floor(Math.random() * prods.length)];
        ventas.push({ id: id++, fecha: date.toISOString().split('T')[0], productoId: p.id, productoNombre: p.nombre, cantidad: Math.floor(Math.random() * 3) + 1, precio: p.precio });
      }
    }
    localStorage.setItem('encantos_ventas', JSON.stringify(ventas));
  }

  // Egresos demo
  if (!localStorage.getItem('encantos_egresos')) {
    const now = new Date();
    const cats = ['flores', 'materiales', 'salarios', 'servicios', 'transporte'];
    const descs = { flores: 'Compra flores mercado', materiales: 'Cintas y papel kraft', salarios: 'Pago semanal', servicios: 'Recibo de luz', transporte: 'Gasolina mototaxi' };
    const montos = { flores: [50, 120], materiales: [15, 45], salarios: [80, 150], servicios: [25, 60], transporte: [10, 30] };
    const egresos = [];
    let id = 1;
    for (let d = 30; d >= 0; d--) {
      if (Math.random() > 0.4) {
        const date = new Date(now); date.setDate(date.getDate() - d);
        const cat = cats[Math.floor(Math.random() * cats.length)];
        const [min, max] = montos[cat];
        egresos.push({ id: id++, fecha: date.toISOString().split('T')[0], categoria: cat, descripcion: descs[cat], monto: parseFloat((Math.random() * (max - min) + min).toFixed(2)) });
      }
    }
    localStorage.setItem('encantos_egresos', JSON.stringify(egresos));
  }

  // Trabajadores demo
  if (!localStorage.getItem('encantos_trabajadores')) {
    const trabajadores = [
      { id: 1, nombre: 'María Quispe Huanca', cargo: 'Florista', telefono: '+51 987 654 321', ingreso: '2022-03-15', sueldo: 1200, estado: 'activo', bonos: 100, descuentos: 0 },
      { id: 2, nombre: 'Rosa Condori Mamani', cargo: 'Vendedora', telefono: '+51 976 543 210', ingreso: '2023-01-10', sueldo: 1000, estado: 'activo', bonos: 50, descuentos: 0 },
      { id: 3, nombre: 'Juan Corimanya', cargo: 'Repartidor', telefono: '+51 965 432 109', ingreso: '2023-06-01', sueldo: 900, estado: 'activo', bonos: 80, descuentos: 0 },
    ];
    localStorage.setItem('encantos_trabajadores', JSON.stringify(trabajadores));
  }

  // Movimientos de inventario
  if (!localStorage.getItem('encantos_movimientos')) {
    localStorage.setItem('encantos_movimientos', JSON.stringify([]));
  }

  // Fotos
  if (!localStorage.getItem('encantos_fotos_admin')) {
    localStorage.setItem('encantos_fotos_admin', JSON.stringify([]));
  }
}

// ─── HELPERS ─────────────────────────────────────
function getProducts() { return JSON.parse(localStorage.getItem('encantos_products') || '[]'); }
function saveProducts(p) { localStorage.setItem('encantos_products', JSON.stringify(p)); syncProductsJSON(); }
function getVentas() { return JSON.parse(localStorage.getItem('encantos_ventas') || '[]'); }
function saveVentas(v) { localStorage.setItem('encantos_ventas', JSON.stringify(v)); }
function getEgresos() { return JSON.parse(localStorage.getItem('encantos_egresos') || '[]'); }
function saveEgresos(e) { localStorage.setItem('encantos_egresos', JSON.stringify(e)); }
function getTrabajadores() { return JSON.parse(localStorage.getItem('encantos_trabajadores') || '[]'); }
function saveTrabajadores(t) { localStorage.setItem('encantos_trabajadores', JSON.stringify(t)); }
function getMovimientos() { return JSON.parse(localStorage.getItem('encantos_movimientos') || '[]'); }
function saveMovimientos(m) { localStorage.setItem('encantos_movimientos', JSON.stringify(m)); }
function getFotosAdmin() { return JSON.parse(localStorage.getItem('encantos_fotos_admin') || '[]'); }
function saveFotosAdmin(f) {
  localStorage.setItem('encantos_fotos_admin', JSON.stringify(f));
  // Sync galería pública
  const galeriaPublica = f.filter(x => x.seccion === 'galeria');
  localStorage.setItem('encantos_galeria', JSON.stringify(galeriaPublica));
  const hero = f.find(x => x.seccion === 'hero');
  if (hero) localStorage.setItem('encantos_hero_img', JSON.stringify(hero.url));
}

function syncProductsJSON() {
  // En entorno web real, aquí haría un fetch POST. Con localStorage, simplemente lo dejamos disponible.
  // Los productos del JSON se reemplazan con los de localStorage en app3.js
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast-msg ${type}`;
  el.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ─── NAVEGACIÓN ──────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link-s').forEach(l => l.classList.remove('active'));
  const page = document.getElementById(`page-${name}`);
  if (page) page.classList.add('active');
  const link = document.querySelector(`.nav-link-s[onclick*="${name}"]`);
  if (link) link.classList.add('active');
  const titles = { dashboard: '🌸 Dashboard', ventas: '📈 Estadísticas de ventas', productos: '🌹 Gestión de productos', inventario: '📦 Control de inventario', fotos: '📸 Fotos y galería', egresos: '💸 Control de egresos', trabajadores: '👥 Trabajadores' };
  const titleEl = document.getElementById('topbarTitle');
  if (titleEl) titleEl.textContent = titles[name] || name;
  window.scrollTo(0, 0);

  // Actualizar datos según página
  if (name === 'dashboard') renderDashboard();
  if (name === 'ventas') { renderTablaVentas(); actualizarGraficas(); }
  if (name === 'inventario') renderInventario();
  if (name === 'egresos') { renderEgresos(); renderChartEgresos(); }
  if (name === 'trabajadores') renderTrabajadores();
  if (name === 'fotos') renderGaleriaAdmin();
  if (name === 'productos') renderTablaProductos();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('active');
}

function doLogout() {
  window.auth.logout();
  window.location.href = 'login.html';
}

// ─── DASHBOARD ───────────────────────────────────
function renderDashboard() {
  const ventas = getVentas();
  const egresos = getEgresos();
  const prods = getProducts();
  const trabajadores = getTrabajadores();

  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const ventasMes = ventas.filter(v => { const d = new Date(v.fecha); return d.getFullYear() === y && d.getMonth() === m; });
  const ingresosMes = ventasMes.reduce((s, v) => s + v.precio * v.cantidad, 0);

  const prevM = m === 0 ? 11 : m - 1;
  const prevY = m === 0 ? y - 1 : y;
  const ventasPrevMes = ventas.filter(v => { const d = new Date(v.fecha); return d.getFullYear() === prevY && d.getMonth() === prevM; });
  const ingresosPrev = ventasPrevMes.reduce((s, v) => s + v.precio * v.cantidad, 0);

  const ingDelta = ingresosPrev > 0 ? Math.round((ingresosMes - ingresosPrev) / ingresosPrev * 100) : 0;
  const venDelta = ventasPrevMes.length > 0 ? Math.round((ventasMes.length - ventasPrevMes.length) / ventasPrevMes.length * 100) : 0;

  setText('stat-ingresos', `S/ ${ingresosMes.toFixed(0)}`);
  setText('stat-ventas', ventasMes.length);
  const stockTotal = prods.reduce((s, p) => s + (p.stock || 0), 0);
  setText('stat-stock', stockTotal);
  setText('stat-stock-delta', `${prods.length} productos`);
  setText('stat-trabajadores', trabajadores.filter(t => t.estado === 'activo').length);

  const ingD = document.getElementById('stat-ing-delta');
  if (ingD) { ingD.textContent = `${ingDelta >= 0 ? '↑' : '↓'} ${Math.abs(ingDelta)}% vs mes anterior`; ingD.className = `stat-delta ${ingDelta >= 0 ? 'up' : 'down'}`; }
  const venD = document.getElementById('stat-ven-delta');
  if (venD) { venD.textContent = `${venDelta >= 0 ? '↑' : '↓'} ${Math.abs(venDelta)}% vs mes anterior`; venD.className = `stat-delta ${venDelta >= 0 ? 'up' : 'down'}`; }

  // Top productos
  const topList = document.getElementById('topProductsList');
  if (topList) {
    const conteo = {};
    ventas.forEach(v => { conteo[v.productoNombre] = (conteo[v.productoNombre] || 0) + v.cantidad; });
    const top5 = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = top5[0]?.[1] || 1;
    topList.innerHTML = top5.map(([name, cnt]) => `
      <div style="margin-bottom:.75rem">
        <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:.2rem">
          <span style="font-weight:600;color:var(--texto)">${name}</span>
          <span style="color:var(--terracota);font-weight:700">${cnt}</span>
        </div>
        <div class="progress-bar-flor"><div class="progress-fill" style="width:${(cnt/max*100).toFixed(0)}%"></div></div>
      </div>`).join('') || '<p style="color:var(--muted);font-size:.875rem">Sin ventas registradas</p>';
  }

  // Stock bajo
  const lowStockList = document.getElementById('lowStockList');
  if (lowStockList) {
    const bajo = prods.filter(p => (p.stock || 0) <= 3).slice(0, 5);
    lowStockList.innerHTML = bajo.map(p => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem 0;border-bottom:1px dashed var(--line)">
        <span>${p.emoji} ${p.nombre}</span>
        <span class="badge-flor ${p.stock === 0 ? 'badge-out' : 'badge-low'}">${p.stock === 0 ? 'Agotado' : `${p.stock} unid.`}</span>
      </div>`).join('') || '<p style="color:var(--muted);font-size:.875rem">✅ Todo el stock está bien</p>';
  }

  // Últimos egresos
  const lastEgresosList = document.getElementById('lastEgresosList');
  if (lastEgresosList) {
    const ult = getEgresos().slice(-5).reverse();
    const catIco = { flores: '🌸', materiales: '🎀', salarios: '👥', servicios: '💡', transporte: '🚚', otros: '📦' };
    lastEgresosList.innerHTML = ult.map(e => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem 0;border-bottom:1px dashed var(--line)">
        <div style="display:flex;align-items:center;gap:.5rem">
          <span>${catIco[e.categoria] || '📦'}</span>
          <div><div style="font-size:.82rem;font-weight:600">${e.descripcion}</div><div style="font-size:.72rem;color:var(--muted)">${formatDate(e.fecha)}</div></div>
        </div>
        <span style="font-family:'Caveat',cursive;font-size:1.1rem;color:var(--terracota);font-weight:700">S/ ${e.monto.toFixed(0)}</span>
      </div>`).join('') || '<p style="color:var(--muted);font-size:.875rem">Sin egresos registrados</p>';
  }

  // Chart 7 días
  initChart7Dias();
}

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

// ─── CHARTS ──────────────────────────────────────
function initCharts() {
  initChart7Dias();
}

function initChart7Dias() {
  const ventas = getVentas();
  const labels = [];
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    labels.push(d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' }));
    const dayVentas = ventas.filter(v => v.fecha === key);
    data.push(dayVentas.reduce((s, v) => s + v.precio * v.cantidad, 0));
  }
  const canvas = document.getElementById('chartVentas7');
  if (!canvas) return;
  if (chartVentas7) chartVentas7.destroy();
  chartVentas7 = new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Ingresos (S/)', data, backgroundColor: 'rgba(196,98,45,.7)', borderColor: '#c4622d', borderRadius: 8, borderWidth: 1 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Nunito', size: 11 } } },
        y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { family: 'Nunito', size: 11 }, callback: v => `S/ ${v}` } }
      }
    }
  });
}

function actualizarGraficas() {
  const periodo = parseInt(document.getElementById('filtroVentasPeriodo')?.value || 30);
  const ventas = getVentas();
  const now = new Date();

  // Chart periodo
  const labels = [], data = [];
  for (let i = periodo - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (periodo <= 30) {
      labels.push(d.getDate());
    } else {
      labels.push(d.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' }));
    }
    data.push(ventas.filter(v => v.fecha === key).reduce((s, v) => s + v.precio * v.cantidad, 0));
  }

  const c1 = document.getElementById('chartVentasPeriodo');
  if (c1) {
    if (chartVentasPeriodo) chartVentasPeriodo.destroy();
    chartVentasPeriodo = new Chart(c1, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Ingresos', data, borderColor: '#c4622d', backgroundColor: 'rgba(196,98,45,.08)', fill: true, tension: .4, pointBackgroundColor: '#c4622d', pointRadius: 3 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Nunito', size: 10 }, maxTicksLimit: 10 } },
          y: { ticks: { callback: v => `S/ ${v}`, font: { family: 'Nunito', size: 10 } } }
        }
      }
    });
  }

  // Chart top productos donut
  const conteo = {};
  const ventasPeriodo = ventas.filter(v => { const diff = (now - new Date(v.fecha)) / 86400000; return diff <= periodo; });
  ventasPeriodo.forEach(v => { conteo[v.productoNombre] = (conteo[v.productoNombre] || 0) + v.cantidad; });
  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const c2 = document.getElementById('chartTopProd');
  if (c2 && top.length > 0) {
    if (chartTopProd) chartTopProd.destroy();
    chartTopProd = new Chart(c2, {
      type: 'doughnut',
      data: {
        labels: top.map(([n]) => n.length > 18 ? n.slice(0, 18) + '…' : n),
        datasets: [{ data: top.map(([, c]) => c), backgroundColor: ['#c4622d', '#d4932a', '#4a7c59', '#f0b84a', '#e07a45', '#6aab7a'], borderWidth: 2, borderColor: 'white' }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { family: 'Nunito', size: 10 }, boxWidth: 12 } } }
      }
    });
  }
}

function renderChartEgresos() {
  const egresos = getEgresos();
  const catLabels = { flores: '🌸 Flores', materiales: '🎀 Materiales', salarios: '👥 Salarios', servicios: '💡 Servicios', transporte: '🚚 Transporte', otros: '📦 Otros' };
  const conteo = {};
  egresos.forEach(e => { conteo[e.categoria] = (conteo[e.categoria] || 0) + e.monto; });
  const keys = Object.keys(conteo);
  const vals = keys.map(k => conteo[k]);

  const c = document.getElementById('chartEgresosCat');
  if (c) {
    if (chartEgresosCat) chartEgresosCat.destroy();
    chartEgresosCat = new Chart(c, {
      type: 'pie',
      data: {
        labels: keys.map(k => catLabels[k] || k),
        datasets: [{ data: vals, backgroundColor: ['#c4622d', '#d4932a', '#4a7c59', '#f0b84a', '#e07a45', '#6aab7a'], borderWidth: 2, borderColor: 'white' }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Nunito', size: 10 }, boxWidth: 12 } } } }
    });
  }

  const resumen = document.getElementById('egresosResumenCat');
  if (resumen) {
    const total = vals.reduce((s, v) => s + v, 0);
    resumen.innerHTML = keys.map(k => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:.4rem 0;border-bottom:1px dashed var(--line)">
        <span style="font-size:.82rem;font-weight:600">${catLabels[k] || k}</span>
        <div style="text-align:right">
          <div style="font-family:'Caveat',cursive;font-size:1.1rem;color:var(--terracota);font-weight:700">S/ ${conteo[k].toFixed(0)}</div>
          <div style="font-size:.7rem;color:var(--muted)">${(conteo[k]/total*100).toFixed(0)}%</div>
        </div>
      </div>`).join('');
  }
}

// ─── VENTAS ──────────────────────────────────────
function poblarSelectProductos() {
  const prods = getProducts();
  ['ventaProducto', 'fotoProductoRelacion', 'ajusteProducto'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    if (id === 'fotoProductoRelacion') sel.innerHTML = '<option value="">— Sin producto asociado —</option>';
    else sel.innerHTML = '';
    prods.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.emoji} ${p.nombre}`;
      if (id === 'ventaProducto') opt.dataset.precio = p.precio;
      sel.appendChild(opt);
    });
  });

  // Auto-fill precio
  const ventaSel = document.getElementById('ventaProducto');
  const ventaPrecio = document.getElementById('ventaPrecio');
  if (ventaSel && ventaPrecio) {
    const setPrecio = () => {
      const opt = ventaSel.options[ventaSel.selectedIndex];
      ventaPrecio.value = opt?.dataset.precio || '';
    };
    ventaSel.addEventListener('change', setPrecio);
    setPrecio();
  }
}

function registrarVenta() {
  const prodId = parseInt(document.getElementById('ventaProducto')?.value);
  const cantidad = parseInt(document.getElementById('ventaCantidad')?.value || 1);
  const precio = parseFloat(document.getElementById('ventaPrecio')?.value || 0);
  const fecha = document.getElementById('ventaFecha')?.value;

  if (!prodId || !fecha || precio <= 0) { toast('Completa todos los campos', 'error'); return; }

  const prod = getProducts().find(p => p.id === prodId);
  const ventas = getVentas();
  const newId = ventas.length > 0 ? Math.max(...ventas.map(v => v.id)) + 1 : 1;
  ventas.push({ id: newId, fecha, productoId: prodId, productoNombre: prod?.nombre || 'Producto', cantidad, precio });
  saveVentas(ventas);

  // Reducir stock
  const prods = getProducts();
  const p = prods.find(pr => pr.id === prodId);
  if (p) {
    p.stock = Math.max(0, (p.stock || 0) - cantidad);
    saveProducts(prods);
    registrarMovimiento(prodId, prod?.nombre, -cantidad, 'Venta registrada');
  }

  toast(`Venta registrada: ${prod?.nombre} x${cantidad} 🌸`);
  renderTablaVentas();
  renderDashboard();
  renderInventario();
  actualizarGraficas();
  document.getElementById('ventaCantidad').value = 1;
}

function renderTablaVentas() {
  const tbody = document.getElementById('tablaVentasBody');
  if (!tbody) return;
  const ventas = getVentas().slice().reverse();
  tbody.innerHTML = ventas.map(v => `
    <tr>
      <td>${formatDate(v.fecha)}</td>
      <td style="font-weight:600">${v.productoNombre}</td>
      <td>${v.cantidad}</td>
      <td>S/ ${v.precio.toFixed(2)}</td>
      <td style="font-family:'Caveat',cursive;color:var(--terracota);font-size:1.1rem;font-weight:700">S/ ${(v.precio * v.cantidad).toFixed(2)}</td>
      <td><button class="btn-flor btn-danger btn-sm-flor" onclick="eliminarVenta(${v.id})"><i class="bi bi-trash"></i></button></td>
    </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:2rem">Sin ventas registradas</td></tr>';
}

function eliminarVenta(id) {
  if (!confirm('¿Eliminar esta venta?')) return;
  saveVentas(getVentas().filter(v => v.id !== id));
  renderTablaVentas(); renderDashboard(); toast('Venta eliminada');
}

function exportarVentas() {
  const ventas = getVentas();
  const csv = ['Fecha,Producto,Cantidad,Precio,Total', ...ventas.map(v => `${v.fecha},"${v.productoNombre}",${v.cantidad},${v.precio},${(v.precio * v.cantidad).toFixed(2)}`)].join('\n');
  descargarCSV(csv, 'ventas_encantos_eternos.csv');
}

// ─── PRODUCTOS ───────────────────────────────────
function renderTablaProductos() {
  const tbody = document.getElementById('tablaProductosBody');
  if (!tbody) return;
  const prods = getProducts();
  tbody.innerHTML = prods.map(p => `
    <tr>
      <td style="font-size:1.5rem">${p.emoji}</td>
      <td style="font-weight:700">${p.nombre}</td>
      <td><span style="font-size:.75rem;color:var(--verde-dk);font-weight:600">${p.categoria}</span></td>
      <td style="font-family:'Caveat',cursive;font-size:1.1rem;color:var(--terracota);font-weight:700">S/ ${p.precio}</td>
      <td>${p.precioAnterior ? `<span style="text-decoration:line-through;color:var(--muted)">S/ ${p.precioAnterior}</span>` : '—'}</td>
      <td>${p.etiqueta ? `<span class="badge-flor badge-ok">${p.etiqueta}</span>` : '—'}</td>
      <td><span class="badge-flor ${p.stock > 3 ? 'badge-ok' : p.stock > 0 ? 'badge-low' : 'badge-out'}">${p.stock || 0}</span></td>
      <td>
        <div class="d-flex gap-1">
          <button class="btn-flor btn-mostaza btn-sm-flor" onclick="editarProducto(${p.id})"><i class="bi bi-pencil"></i></button>
          <button class="btn-flor btn-danger btn-sm-flor" onclick="eliminarProducto(${p.id})"><i class="bi bi-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
}

function abrirModalProducto(id = null) {
  const modalEl = document.getElementById('modalProducto');
  document.getElementById('prodId').value = '';
  document.getElementById('prodEmoji').value = '🌹';
  document.getElementById('prodNombre').value = '';
  document.getElementById('prodDesc').value = '';
  document.getElementById('prodPrecio').value = '';
  document.getElementById('prodPrecioAnt').value = '';
  document.getElementById('prodStock').value = 0;
  document.getElementById('prodEtiqueta').value = '';
  ['catAmor', 'catAniversario', 'catCumple', 'catCondolencias'].forEach(id => { document.getElementById(id).checked = false; });
  document.getElementById('modalProductoTitle').textContent = '🌸 Nuevo Producto';
  new bootstrap.Modal(modalEl).show();
}

function editarProducto(id) {
  const p = getProducts().find(pr => pr.id === id);
  if (!p) return;
  document.getElementById('prodId').value = p.id;
  document.getElementById('prodEmoji').value = p.emoji;
  document.getElementById('prodNombre').value = p.nombre;
  document.getElementById('prodDesc').value = p.descripcion;
  document.getElementById('prodPrecio').value = p.precio;
  document.getElementById('prodPrecioAnt').value = p.precioAnterior || '';
  document.getElementById('prodStock').value = p.stock || 0;
  document.getElementById('prodEtiqueta').value = p.etiqueta || '';
  const cats = (p.categoria || '').split(' ');
  document.getElementById('catAmor').checked = cats.includes('amor');
  document.getElementById('catAniversario').checked = cats.includes('aniversario');
  document.getElementById('catCumple').checked = cats.includes('cumpleanos');
  document.getElementById('catCondolencias').checked = cats.includes('condolencias');
  document.getElementById('modalProductoTitle').textContent = '✏️ Editar Producto';
  new bootstrap.Modal(document.getElementById('modalProducto')).show();
}

function guardarProducto() {
  const idVal = document.getElementById('prodId').value;
  const cats = [];
  if (document.getElementById('catAmor').checked) cats.push('amor');
  if (document.getElementById('catAniversario').checked) cats.push('aniversario');
  if (document.getElementById('catCumple').checked) cats.push('cumpleanos');
  if (document.getElementById('catCondolencias').checked) cats.push('condolencias');

  const producto = {
    id: idVal ? parseInt(idVal) : Date.now(),
    emoji: document.getElementById('prodEmoji').value || '🌸',
    nombre: document.getElementById('prodNombre').value.trim(),
    descripcion: document.getElementById('prodDesc').value.trim(),
    precio: parseFloat(document.getElementById('prodPrecio').value) || 0,
    precioAnterior: parseFloat(document.getElementById('prodPrecioAnt').value) || null,
    stock: parseInt(document.getElementById('prodStock').value) || 0,
    etiqueta: document.getElementById('prodEtiqueta').value || null,
    categoria: cats.join(' ') || 'amor',
  };

  if (!producto.nombre || producto.precio <= 0) { toast('Nombre y precio son obligatorios', 'error'); return; }

  const prods = getProducts();
  if (idVal) {
    const idx = prods.findIndex(p => p.id === producto.id);
    if (idx >= 0) prods[idx] = producto;
  } else {
    prods.push(producto);
  }
  saveProducts(prods);
  bootstrap.Modal.getInstance(document.getElementById('modalProducto')).hide();
  renderTablaProductos();
  renderInventario();
  poblarSelectProductos();
  toast(`Producto ${idVal ? 'actualizado' : 'creado'}: ${producto.nombre} 🌸`);
}

function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  saveProducts(getProducts().filter(p => p.id !== id));
  renderTablaProductos(); renderInventario(); poblarSelectProductos();
  toast('Producto eliminado');
}

// ─── INVENTARIO ──────────────────────────────────
function renderInventario() {
  const prods = getProducts();
  const bajo = prods.filter(p => (p.stock || 0) <= 3 && (p.stock || 0) > 0).length;
  const agotado = prods.filter(p => (p.stock || 0) === 0).length;
  const total = prods.reduce((s, p) => s + (p.stock || 0), 0);
  setText('inv-total', total); setText('inv-bajo', bajo); setText('inv-agotado', agotado);

  const tbody = document.getElementById('tablaInventarioBody');
  if (!tbody) return;
  tbody.innerHTML = prods.map(p => {
    const stock = p.stock || 0;
    const estado = stock === 0 ? 'badge-out' : stock <= 3 ? 'badge-low' : 'badge-ok';
    const estadoText = stock === 0 ? '❌ Agotado' : stock <= 3 ? '⚠️ Bajo' : '✅ OK';
    return `<tr>
      <td>${p.emoji} <strong>${p.nombre}</strong></td>
      <td style="font-family:'Caveat',cursive;font-size:1.3rem;color:var(--terracota);font-weight:700">${stock}</td>
      <td><span class="badge-flor ${estado}">${estadoText}</span></td>
      <td>
        <input type="number" class="form-flor-input" style="width:80px;padding:.3rem .5rem" 
          id="stockMin_${p.id}" value="${p.stockMin || 3}" min="0"/>
      </td>
      <td>
        <div class="d-flex gap-1">
          <button class="btn-flor btn-verde btn-sm-flor" onclick="quickStock(${p.id}, 1)">+1</button>
          <button class="btn-flor btn-terra btn-sm-flor" onclick="quickStock(${p.id}, -1)">−1</button>
          <button class="btn-flor btn-outline btn-sm-flor" onclick="setStockMin(${p.id})">💾</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  const movs = getMovimientos().slice().reverse().slice(0, 20);
  const tbody2 = document.getElementById('tablaMovimientosBody');
  if (tbody2) {
    tbody2.innerHTML = movs.map(m => `
      <tr>
        <td>${formatDate(m.fecha)}</td>
        <td>${m.productoNombre}</td>
        <td><span class="badge-flor ${m.cantidad > 0 ? 'badge-ok' : 'badge-low'}">${m.cantidad > 0 ? '+' : ''}${m.cantidad}</span></td>
        <td>${m.stockResultante}</td>
        <td style="color:var(--muted);font-size:.8rem">${m.nota || '—'}</td>
      </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:1rem">Sin movimientos</td></tr>';
  }
}

function quickStock(prodId, delta) {
  const prods = getProducts();
  const p = prods.find(pr => pr.id === prodId);
  if (!p) return;
  p.stock = Math.max(0, (p.stock || 0) + delta);
  saveProducts(prods);
  registrarMovimiento(prodId, p.nombre, delta, delta > 0 ? 'Entrada manual' : 'Salida manual');
  renderInventario(); renderDashboard();
  toast(`Stock de ${p.nombre}: ${p.stock} unidades`);
}

function setStockMin(prodId) {
  const prods = getProducts();
  const p = prods.find(pr => pr.id === prodId);
  const input = document.getElementById(`stockMin_${prodId}`);
  if (!p || !input) return;
  p.stockMin = parseInt(input.value) || 3;
  saveProducts(prods);
  toast(`Stock mínimo actualizado`);
}

function abrirModalAjuste() {
  const prods = getProducts();
  const sel = document.getElementById('ajusteProducto');
  if (sel) {
    sel.innerHTML = prods.map(p => `<option value="${p.id}">${p.emoji} ${p.nombre} (Stock: ${p.stock || 0})</option>`).join('');
  }
  new bootstrap.Modal(document.getElementById('modalAjuste')).show();
}

function guardarAjuste() {
  const prodId = parseInt(document.getElementById('ajusteProducto').value);
  const tipo = document.getElementById('ajusteTipo').value;
  const cant = parseInt(document.getElementById('ajusteCantidad').value || 1);
  const nota = document.getElementById('ajusteNota').value.trim();

  const prods = getProducts();
  const p = prods.find(pr => pr.id === prodId);
  if (!p) return;

  const delta = tipo === 'salida' ? -cant : cant;
  p.stock = Math.max(0, (p.stock || 0) + (tipo === 'ajuste' ? cant - (p.stock || 0) : delta));
  saveProducts(prods);
  registrarMovimiento(prodId, p.nombre, tipo === 'ajuste' ? cant - (p.stock || 0) : delta, nota || tipo);

  bootstrap.Modal.getInstance(document.getElementById('modalAjuste')).hide();
  renderInventario(); renderDashboard();
  toast(`Stock ajustado: ${p.nombre} → ${p.stock} unidades`);
}

function registrarMovimiento(prodId, prodNombre, cantidad, nota) {
  const movs = getMovimientos();
  const prods = getProducts();
  const p = prods.find(pr => pr.id === prodId);
  movs.push({ id: Date.now(), fecha: new Date().toISOString().split('T')[0], productoId: prodId, productoNombre: prodNombre, cantidad, stockResultante: p?.stock || 0, nota });
  saveMovimientos(movs);
}

// ─── FOTOS ───────────────────────────────────────
function procesarFotos(files) {
  const preview = document.getElementById('fotoPreview');
  if (!preview) return;
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { toast(`${file.name} supera 5MB`, 'error'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const obj = { url: e.target.result, nombre: file.name, titulo: document.getElementById('fotoTitulo')?.value || file.name, seccion: document.getElementById('fotoSeccion')?.value || 'galeria', productoId: document.getElementById('fotoProductoRelacion')?.value || null };
      fotosPendientes.push(obj);
      const col = document.createElement('div');
      col.className = 'col-4 col-md-2';
      col.innerHTML = `<div class="foto-thumb"><img src="${obj.url}" alt="${obj.titulo}"><div class="foto-badge">${obj.titulo}</div></div>`;
      preview.appendChild(col);
    };
    reader.readAsDataURL(file);
  });
}

function guardarFotos() {
  if (fotosPendientes.length === 0) { toast('No hay fotos pendientes', 'error'); return; }
  const fotos = getFotosAdmin();
  fotosPendientes.forEach(f => { f.id = Date.now() + Math.random(); fotos.push(f); });
  saveFotosAdmin(fotos);
  fotosPendientes = [];
  document.getElementById('fotoPreview').innerHTML = '';
  renderGaleriaAdmin();
  toast(`${fotosPendientes.length || fotos.length} fotos guardadas en la tienda 🌸`);
}

function limpiarPreview() {
  fotosPendientes = [];
  const preview = document.getElementById('fotoPreview');
  if (preview) preview.innerHTML = '';
}

function renderGaleriaAdmin(filtro = 'todas') {
  const fotos = getFotosAdmin();
  const grid = document.getElementById('galeriaAdmin');
  if (!grid) return;
  const filtered = filtro === 'todas' ? fotos : fotos.filter(f => f.seccion === filtro);
  const totalEl = document.getElementById('totalFotos');
  if (totalEl) totalEl.textContent = `${fotos.length} fotos`;
  grid.innerHTML = filtered.map(f => `
    <div class="col-6 col-md-3 col-lg-2">
      <div class="foto-thumb">
        <img src="${f.url}" alt="${f.titulo}">
        <button class="del-btn" onclick="eliminarFoto('${f.id}')">✕</button>
        <div class="foto-badge">${f.titulo}</div>
      </div>
      <div style="font-size:.65rem;color:var(--muted);text-align:center;margin-top:.2rem">${f.seccion}</div>
    </div>`).join('') || '<div class="col-12"><p style="color:var(--muted);text-align:center;padding:2rem">No hay fotos en esta sección</p></div>';

  // Drag & drop
  const zone = document.getElementById('uploadZone');
  if (zone) {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); procesarFotos(e.dataTransfer.files); });
  }
}

function eliminarFoto(id) {
  const fotos = getFotosAdmin().filter(f => String(f.id) !== String(id));
  saveFotosAdmin(fotos);
  renderGaleriaAdmin();
  toast('Foto eliminada');
}

function filtrarFotos(seccion, btn) {
  document.querySelectorAll('.filtro-foto-btn').forEach(b => b.classList.remove('active', 'btn-terra'));
  btn.classList.add('active', 'btn-terra');
  btn.classList.remove('btn-outline');
  renderGaleriaAdmin(seccion);
}

// ─── EGRESOS ─────────────────────────────────────
function registrarEgreso() {
  const categoria = document.getElementById('egresoCategoria')?.value;
  const descripcion = document.getElementById('egresoDesc')?.value.trim();
  const monto = parseFloat(document.getElementById('egresoMonto')?.value || 0);
  const fecha = document.getElementById('egresoFecha')?.value;

  if (!descripcion || monto <= 0 || !fecha) { toast('Completa todos los campos', 'error'); return; }

  const egresos = getEgresos();
  const newId = egresos.length > 0 ? Math.max(...egresos.map(e => e.id)) + 1 : 1;
  egresos.push({ id: newId, fecha, categoria, descripcion, monto });
  saveEgresos(egresos);
  renderEgresos(); renderChartEgresos(); renderDashboard();
  toast(`Egreso registrado: ${descripcion} 💸`);
  document.getElementById('egresoDesc').value = '';
  document.getElementById('egresoMonto').value = '';
}

function renderEgresos() {
  const egresos = getEgresos();
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();

  const egresosMes = egresos.filter(e => { const d = new Date(e.fecha); return d.getFullYear() === y && d.getMonth() === m; });
  const egresosSemana = egresos.filter(e => (now - new Date(e.fecha)) / 86400000 <= 7);
  const totalMes = egresosMes.reduce((s, e) => s + e.monto, 0);
  const totalSemana = egresosSemana.reduce((s, e) => s + e.monto, 0);

  const ventasMes = getVentas().filter(v => { const d = new Date(v.fecha); return d.getFullYear() === y && d.getMonth() === m; });
  const ingMes = ventasMes.reduce((s, v) => s + v.precio * v.cantidad, 0);
  const balance = ingMes - totalMes;

  setText('eg-mes', `S/ ${totalMes.toFixed(0)}`);
  setText('eg-semana', `S/ ${totalSemana.toFixed(0)}`);
  const balEl = document.getElementById('eg-balance');
  if (balEl) {
    balEl.textContent = `S/ ${balance.toFixed(0)}`;
    balEl.style.color = balance >= 0 ? 'var(--verde-dk)' : 'var(--terracota)';
  }

  const catIco = { flores: '🌸', materiales: '🎀', salarios: '👥', servicios: '💡', transporte: '🚚', otros: '📦' };
  const tbody = document.getElementById('tablaEgresosBody');
  if (!tbody) return;
  tbody.innerHTML = egresos.slice().reverse().map(e => `
    <tr>
      <td>${formatDate(e.fecha)}</td>
      <td><span class="badge-flor badge-ok">${catIco[e.categoria] || '📦'} ${e.categoria}</span></td>
      <td>${e.descripcion}</td>
      <td style="font-family:'Caveat',cursive;font-size:1.1rem;color:var(--terracota);font-weight:700">S/ ${e.monto.toFixed(2)}</td>
      <td><button class="btn-flor btn-danger btn-sm-flor" onclick="eliminarEgreso(${e.id})"><i class="bi bi-trash"></i></button></td>
    </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:2rem">Sin egresos registrados</td></tr>';
}

function eliminarEgreso(id) {
  if (!confirm('¿Eliminar este egreso?')) return;
  saveEgresos(getEgresos().filter(e => e.id !== id));
  renderEgresos(); renderChartEgresos(); renderDashboard();
  toast('Egreso eliminado');
}

function exportarEgresos() {
  const csv = ['Fecha,Categoría,Descripción,Monto', ...getEgresos().map(e => `${e.fecha},${e.categoria},"${e.descripcion}",${e.monto}`)].join('\n');
  descargarCSV(csv, 'egresos_encantos_eternos.csv');
}

// ─── TRABAJADORES ────────────────────────────────
function renderTrabajadores() {
  const trabajadores = getTrabajadores();
  const grid = document.getElementById('gridTrabajadores');
  if (grid) {
    grid.innerHTML = trabajadores.map(t => {
      const initials = t.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      return `
      <div class="col-md-6 col-lg-4">
        <div class="worker-card">
          <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
            <div class="worker-avatar">${initials}</div>
            <div style="flex:1">
              <div class="worker-name">${t.nombre}</div>
              <div class="worker-role">${t.cargo}</div>
            </div>
            <span class="badge-flor ${t.estado === 'activo' ? 'badge-ok' : 'badge-out'}">${t.estado}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--line);padding-top:.6rem">
            <div style="font-size:.78rem;color:var(--muted)">📞 ${t.telefono || 'N/A'}</div>
            <div class="worker-salary">S/ ${t.sueldo}</div>
          </div>
          <div style="display:flex;gap:.5rem;margin-top:.75rem">
            <button class="btn-flor btn-mostaza btn-sm-flor flex-fill" onclick="editarTrabajador(${t.id})"><i class="bi bi-pencil"></i> Editar</button>
            <button class="btn-flor btn-danger btn-sm-flor" onclick="eliminarTrabajador(${t.id})"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>`;
    }).join('') || '<div class="col-12"><p style="color:var(--muted);text-align:center;padding:2rem">Sin trabajadores registrados</p></div>';
  }

  // Planilla
  const tbody = document.getElementById('tablaPlanillaBody');
  if (!tbody) return;
  let totalPlanilla = 0;
  tbody.innerHTML = trabajadores.map(t => {
    const total = (t.sueldo || 0) + (t.bonos || 0) - (t.descuentos || 0);
    totalPlanilla += total;
    return `
    <tr>
      <td style="font-weight:700">${t.nombre}</td>
      <td>${t.cargo}</td>
      <td>S/ ${t.sueldo || 0}</td>
      <td>
        <input type="number" class="form-flor-input" style="width:80px;padding:.3rem .5rem" id="bono_${t.id}" value="${t.bonos || 0}" onchange="actualizarPlanilla(${t.id})"/>
      </td>
      <td>
        <input type="number" class="form-flor-input" style="width:80px;padding:.3rem .5rem" id="desc_${t.id}" value="${t.descuentos || 0}" onchange="actualizarPlanilla(${t.id})"/>
      </td>
      <td style="font-family:'Caveat',cursive;font-size:1.2rem;color:var(--verde-dk);font-weight:700">S/ ${total.toFixed(0)}</td>
      <td><span class="badge-flor ${t.pagado ? 'badge-ok' : 'badge-low'}">${t.pagado ? '✅ Pagado' : '⏳ Pendiente'}</span></td>
      <td>
        <button class="btn-flor ${t.pagado ? 'btn-outline' : 'btn-verde'} btn-sm-flor" onclick="marcarPagado(${t.id})">
          ${t.pagado ? 'Desmarcar' : '✅ Pagar'}
        </button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:2rem">Sin trabajadores</td></tr>';
  setText('totalPlanilla', `S/ ${totalPlanilla.toFixed(0)}`);
}

function actualizarPlanilla(id) {
  const trabajadores = getTrabajadores();
  const t = trabajadores.find(tr => tr.id === id);
  if (!t) return;
  t.bonos = parseFloat(document.getElementById(`bono_${id}`)?.value || 0);
  t.descuentos = parseFloat(document.getElementById(`desc_${id}`)?.value || 0);
  saveTrabajadores(trabajadores);
  renderTrabajadores();
}

function marcarPagado(id) {
  const trabajadores = getTrabajadores();
  const t = trabajadores.find(tr => tr.id === id);
  if (!t) return;
  t.pagado = !t.pagado;
  saveTrabajadores(trabajadores);
  renderTrabajadores();
  toast(t.pagado ? `Pago registrado: ${t.nombre} ✅` : 'Pago desmarcado');
}

function abrirModalTrabajador() {
  document.getElementById('trabId').value = '';
  document.getElementById('trabNombre').value = '';
  document.getElementById('trabTelefono').value = '';
  document.getElementById('trabSueldo').value = '';
  document.getElementById('trabIngreso').value = new Date().toISOString().split('T')[0];
  document.getElementById('trabCargo').value = 'Florista';
  document.getElementById('trabEstado').value = 'activo';
  document.getElementById('modalTrabTitle').textContent = '👤 Nuevo Trabajador';
  new bootstrap.Modal(document.getElementById('modalTrabajador')).show();
}

function editarTrabajador(id) {
  const t = getTrabajadores().find(tr => tr.id === id);
  if (!t) return;
  document.getElementById('trabId').value = t.id;
  document.getElementById('trabNombre').value = t.nombre;
  document.getElementById('trabTelefono').value = t.telefono || '';
  document.getElementById('trabSueldo').value = t.sueldo || '';
  document.getElementById('trabIngreso').value = t.ingreso || '';
  document.getElementById('trabCargo').value = t.cargo;
  document.getElementById('trabEstado').value = t.estado;
  document.getElementById('modalTrabTitle').textContent = '✏️ Editar Trabajador';
  new bootstrap.Modal(document.getElementById('modalTrabajador')).show();
}

function guardarTrabajador() {
  const idVal = document.getElementById('trabId').value;
  const trabajador = {
    id: idVal ? parseInt(idVal) : Date.now(),
    nombre: document.getElementById('trabNombre').value.trim(),
    cargo: document.getElementById('trabCargo').value,
    telefono: document.getElementById('trabTelefono').value.trim(),
    ingreso: document.getElementById('trabIngreso').value,
    sueldo: parseFloat(document.getElementById('trabSueldo').value) || 0,
    estado: document.getElementById('trabEstado').value,
    bonos: 0, descuentos: 0, pagado: false
  };
  if (!trabajador.nombre) { toast('El nombre es obligatorio', 'error'); return; }

  const trabajadores = getTrabajadores();
  if (idVal) {
    const idx = trabajadores.findIndex(t => t.id === trabajador.id);
    if (idx >= 0) { trabajador.bonos = trabajadores[idx].bonos; trabajador.descuentos = trabajadores[idx].descuentos; trabajadores[idx] = trabajador; }
  } else {
    trabajadores.push(trabajador);
  }
  saveTrabajadores(trabajadores);
  bootstrap.Modal.getInstance(document.getElementById('modalTrabajador')).hide();
  renderTrabajadores();
  setText('stat-trabajadores', trabajadores.filter(t => t.estado === 'activo').length);
  toast(`Trabajador ${idVal ? 'actualizado' : 'registrado'}: ${trabajador.nombre} 🌸`);
}

function eliminarTrabajador(id) {
  if (!confirm('¿Eliminar este trabajador?')) return;
  saveTrabajadores(getTrabajadores().filter(t => t.id !== id));
  renderTrabajadores(); renderDashboard();
  toast('Trabajador eliminado');
}

// ─── UTILS ───────────────────────────────────────
function descargarCSV(content, filename) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast(`Archivo ${filename} descargado 📥`);
}

// Compatibilidad: hacer que app3.js use los productos de localStorage si están disponibles
window.addEventListener('load', () => {
  if (window.location.pathname.includes('index') || window.location.pathname === '/') {
    // En la tienda, usar localStorage si hay productos
    const storedProds = localStorage.getItem('encantos_products');
    if (storedProds) {
      window._customProducts = JSON.parse(storedProds);
    }
  }
});
