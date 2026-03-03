/* ================================================
   ENCANTOS ETERNOS – app3.js  ·  Estilo Andino
================================================ */
'use strict';

const PRODUCTS_URL = 'products.json';
let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();

  const filterBtns3 = document.querySelectorAll('.btn3-filter');
  const noRes3 = document.getElementById('noResults3');
  filterBtns3.forEach(btn => {
    btn.addEventListener('click', () => filterProducts(btn.dataset.filter, filterBtns3, noRes3));
  });

  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      if (!q) { renderProducts(allProducts); return; }
      const filtered = allProducts.filter(p => p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q));
      renderProducts(filtered);
    });
  }

  const backTop3 = document.getElementById('backTop3');
  window.addEventListener('scroll', () => {
    if (backTop3) backTop3.classList.toggle('visible', window.scrollY > 350);
  }, { passive: true });
  backTop3?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navEl = document.getElementById('navAndino');
      if (navEl?.classList.contains('show')) bootstrap.Collapse.getInstance(navEl)?.hide();
      const hh = document.querySelector('.site-header3')?.offsetHeight || 70;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - hh - 10, behavior: 'smooth' });
    });
  });

  document.querySelectorAll('.btn3-evento').forEach(btn => {
    btn.addEventListener('click', function () {
      this.style.transform = 'scale(.96) translateX(4px)';
      setTimeout(() => { this.style.transform = ''; }, 200);
    });
  });

  const sections3 = document.querySelectorAll('section[id], footer[id]');
  const navLinks3 = document.querySelectorAll('.nav-link3');
  const highlightNav3 = () => {
    let current = '';
    sections3.forEach(sec => { if (window.scrollY >= sec.offsetTop - 90) current = sec.id; });
    navLinks3.forEach(link => {
      const isActive = link.getAttribute('href') === `#${current}`;
      link.style.color = isActive ? 'var(--terracota)' : '';
      link.style.background = isActive ? 'var(--hueso-3)' : '';
    });
  };
  window.addEventListener('scroll', highlightNav3, { passive: true });

  const wappBtn = document.querySelector('.btn3-wapp');
  if (wappBtn) {
    setInterval(() => {
      wappBtn.style.transform = 'translateY(-2px) scale(1.03)';
      setTimeout(() => { wappBtn.style.transform = ''; }, 400);
    }, 3000);
  }

  updateNavbarAuth();

  const cartNavBtn = document.getElementById('cartNavBtn');
  cartNavBtn?.addEventListener('click', e => { e.preventDefault(); showCartModal(); });
});

/* ─── PRODUCTOS ─────────────────────────────────── */
async function loadProducts() {
  try {
    // Primero intentar usar productos del admin (localStorage)
    const stored = localStorage.getItem('encantos_products');
    if (stored) {
      allProducts = JSON.parse(stored);
      renderProducts(allProducts);
      initProductObserver();
      return;
    }
    // Fallback a products.json
    const response = await fetch(PRODUCTS_URL);
    if (!response.ok) throw new Error('Error al cargar productos');
    allProducts = await response.json();
    renderProducts(allProducts);
    initProductObserver();
  } catch (error) {
    console.error('Error cargando productos:', error);
    const productsGrid = document.getElementById('productsGrid3');
    if (productsGrid) {
      productsGrid.innerHTML = `
        <div class="col-12 text-center py-5">
          <p style="font-size:3rem">😔</p>
          <p style="color:#6b4e31">No se pudieron cargar los productos</p>
          <button class="btn3-main" onclick="loadProducts()">Reintentar</button>
        </div>`;
    }
  }
}

function renderProducts(products) {
  const productsGrid = document.getElementById('productsGrid3');
  if (!productsGrid) return;
  if (products.length === 0) {
    productsGrid.innerHTML = `<div class="col-12 text-center py-5"><p style="font-size:3rem">🌵</p><p style="color:#6b4e31">No hay productos disponibles</p></div>`;
    return;
  }

  let html = '';
  products.forEach(product => {
    const categorias = product.categoria;
    const cardClass = product.etiqueta === 'Favorito' ? 'p3-card p3-especial' : 'p3-card';
    let ribbonHTML = '';
    if (product.etiqueta) {
      ribbonHTML = `<div class="p3-ribbon">${product.etiqueta === 'Nuevo' ? '¡' + product.etiqueta + '!' : product.etiqueta}</div>`;
    }
    let priceHTML = product.precioAnterior
      ? `<div class="p3-price-wrap"><span class="p3-old">S/ ${product.precioAnterior}</span><span class="p3-price">S/ ${product.precio}</span></div>`
      : `<span class="p3-price">S/ ${product.precio}</span>`;

    // Si tiene imagen subida desde admin, usarla
    const fotosAdmin = JSON.parse(localStorage.getItem('encantos_fotos_admin') || '[]');
    const fotoProducto = fotosAdmin.find(f => f.seccion === 'productos' && String(f.productoId) === String(product.id));

    const imgContent = fotoProducto
      ? `<img src="${fotoProducto.url}" alt="${product.nombre}" style="width:100%;height:100%;object-fit:cover;position:relative;z-index:1;">`
      : `<div class="p3-emoji">${product.emoji}</div>`;

    html += `
      <div class="col-12 col-sm-6 col-lg-3 p3-col" data-category="${categorias}">
        <div class="${cardClass}" data-product-id="${product.id}">
          <div class="p3-img">${imgContent}${ribbonHTML}</div>
          <div class="p3-body">
            <div class="p3-tag">${getCategoryLabel(categorias)}</div>
            <h4 class="p3-name">${product.nombre}</h4>
            <p class="p3-desc">${product.descripcion}</p>
            <div class="p3-footer">
              ${priceHTML}
              <button class="btn3-comprar" data-product='${JSON.stringify(product).replace(/'/g, "&#39;")}' ${(product.stock || 0) === 0 ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}>
                ${(product.stock || 0) === 0 ? 'Agotado' : 'Comprar 🛒'}
              </button>
            </div>
          </div>
        </div>
      </div>`;
  });

  productsGrid.innerHTML = html;
  initBuyButtons();
}

function getCategoryLabel(categoria) {
  const labels = { amor: 'Amor', aniversario: 'Aniversario', cumpleanos: 'Cumpleaños', condolencias: 'Condolencias' };
  if (categoria.includes(' ')) return categoria.split(' ').map(c => labels[c] || c).join(' · ');
  return labels[categoria] || categoria;
}

function initBuyButtons() {
  document.querySelectorAll('.btn3-comprar').forEach(btn => {
    if (btn.disabled) return;
    btn.addEventListener('click', function () {
      if (this.disabled) return;
      let product;
      try {
        product = JSON.parse(this.dataset.product);
      } catch (e) { return; }

      if (window.auth && !window.auth.isLoggedIn()) {
        const modalEl = document.getElementById('loginRequiredModal');
        if (modalEl) new bootstrap.Modal(modalEl).show();
        else window.location.href = 'login.html';
        return;
      }

      if (window.cart) window.cart.addToCart(product);

      const orig = this.textContent;
      this.textContent = '¡Agregado! 💛';
      this.style.background = 'var(--mostaza)';
      this.style.color = 'var(--marron)';
      this.disabled = true;
      setTimeout(() => {
        this.textContent = orig; this.style.background = ''; this.style.color = ''; this.disabled = false;
      }, 2000);
    });
  });
}

function filterProducts(filter, filterBtns, noRes) {
  filterBtns.forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
  let visible = 0;
  document.querySelectorAll('.p3-col').forEach((col, i) => {
    const cats = col.dataset.category || '';
    const show = filter === 'todos' || cats.includes(filter);
    if (show) {
      col.classList.remove('hidden');
      col.style.opacity = '0'; col.style.transform = 'translateY(18px) scale(.97)';
      requestAnimationFrame(() => setTimeout(() => { col.style.opacity = '1'; col.style.transform = 'translateY(0) scale(1)'; }, visible * 70));
      visible++;
    } else { col.classList.add('hidden'); }
  });
  if (noRes) noRes.classList.toggle('d-none', visible > 0);
  const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
  if (activeBtn) { activeBtn.style.transform = 'scale(1.08)'; setTimeout(() => { activeBtn.style.transform = ''; }, 200); }
}

function initProductObserver() {
  const io3 = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0) scale(1)'; }, (i % 4) * 80);
        io3.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.p3-col').forEach(col => {
    col.style.opacity = '0'; col.style.transform = 'translateY(24px) scale(.97)';
    col.style.transition = 'opacity .5s ease, transform .5s ease'; io3.observe(col);
  });
  document.querySelectorAll('.ev3-card, .regalo3-feature, .regalo3-box, .svc3-card').forEach(el => {
    el.style.opacity = '0'; el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .55s ease, transform .55s ease'; io3.observe(el);
  });
}

function updateNavbarAuth() {
  const authNavItem = document.getElementById('authNavItem');
  const cartNavItem = document.querySelector('.cart-nav-item');
  if (!authNavItem) return;
  const isLoggedIn = window.auth ? window.auth.isLoggedIn() : false;
  const session = window.auth?.getSession();

  if (isLoggedIn) {
    const isAdmin = session?.rol === 'admin';
    authNavItem.innerHTML = `
      <div class="d-flex gap-1">
        ${isAdmin ? `<a class="nav-link3" href="dashboard.html"><i class="bi bi-speedometer2 me-1"></i>Admin</a>` : ''}
        <a class="nav-link3" href="#" id="logoutBtn"><i class="bi bi-box-arrow-left me-1"></i>Salir</a>
      </div>`;
    document.getElementById('logoutBtn')?.addEventListener('click', e => {
      e.preventDefault(); localStorage.removeItem('encantos_session'); window.location.href = 'login.html';
    });
    if (cartNavItem) cartNavItem.style.display = 'block';
  } else {
    authNavItem.innerHTML = `<a class="nav-link3" href="login.html"><i class="bi bi-box-arrow-in-right me-1"></i>Iniciar sesión</a>`;
  }
  if (window.cart) window.cart.updateCartCount();
}

function showCartModal() {
  const modalEl = document.getElementById('cartModal');
  if (!modalEl) return;
  if (window.cart) window.cart.updateCartModalContent();
  new bootstrap.Modal(modalEl).show();
}

// Flores confetti
function spawnFlowers() {
  const flowers = ['🌸', '🌺', '🌷', '🌹', '🌻', '💐', '🌼'];
  for (let i = 0; i < 14; i++) {
    const el = document.createElement('div');
    el.textContent = flowers[Math.floor(Math.random() * flowers.length)];
    el.style.cssText = `position:fixed;left:${Math.random()*100}vw;top:-40px;font-size:${16+Math.random()*20}px;pointer-events:none;z-index:9000;animation:flowerFall ${1.5+Math.random()*2}s ease-in forwards;animation-delay:${Math.random()*.8}s;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

if (!document.querySelector('#flowerFallStyle')) {
  const style = document.createElement('style');
  style.id = 'flowerFallStyle';
  style.textContent = `@keyframes flowerFall { to { transform: translateY(110vh) rotate(360deg); opacity: 0; } }`;
  document.head.appendChild(style);
}

window.loadProducts = loadProducts;




/* ===================================================
   5. BOTONES FLOTANTES (Mapa)
=================================================== */
(function initFloatingWindows() {
    const pairs = [
        { btnId: 'mapa-boton',        winId: 'mapa-ventana',        closeId: 'closeMapa'   },
    ];

    pairs.forEach(({ btnId, winId, closeId }) => {
        const btn    = document.getElementById(btnId);
        const win    = document.getElementById(winId);
        const closeB = document.getElementById(closeId);
        if (!btn || !win) return;

        const toggle = () => win.classList.toggle('oculto');
        const hide   = () => win.classList.add('oculto');

        btn.addEventListener('click', toggle);
        btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') toggle(); });
        closeB?.addEventListener('click', hide);
    });

    // Cerrar ventanas al hacer clic fuera
    document.addEventListener('click', e => {
        pairs.forEach(({ btnId, winId }) => {
            const btn = document.getElementById(btnId);
            const win = document.getElementById(winId);
            if (!win || win.classList.contains('oculto')) return;
            if (!win.contains(e.target) && !btn.contains(e.target)) {
                win.classList.add('oculto');
            }
        });
    });
})();
