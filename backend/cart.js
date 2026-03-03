/* ================================================
   ENCANTOS ETERNOS – cart.js
   Sistema de carrito de compras
================================================ */

'use strict';

(function () {

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('encantos_cart') || '[]');
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem('encantos_cart', JSON.stringify(cart));
    updateCartCount();
  }

  function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.cantidad = (existing.cantidad || 1) + 1;
    } else {
      cart.push({ ...product, cantidad: 1 });
    }
    saveCart(cart);
    showToast(`¡${product.nombre} agregado al carrito! 🛒`);
  }

  function removeFromCart(productId) {
    const cart = getCart().filter(item => item.id !== productId);
    saveCart(cart);
  }

  function updateQuantity(productId, cantidad) {
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (item) {
      item.cantidad = Math.max(1, cantidad);
      saveCart(cart);
    }
  }

  function clearCart() {
    localStorage.removeItem('encantos_cart');
    updateCartCount();
  }

  function getTotal() {
    return getCart().reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);
  }

  function getCount() {
    return getCart().reduce((sum, item) => sum + (item.cantidad || 1), 0);
  }

  function updateCartCount() {
    const count = getCount();
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  }

  function updateCartModalContent() {
    const body = document.getElementById('cartModalBody');
    const totalEl = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const cart = getCart();

    if (!body) return;

    if (cart.length === 0) {
      body.innerHTML = `
        <div class="text-center py-5">
          <p style="font-size:4rem;margin-bottom:15px">🛒</p>
          <p style="color:#6b4e31;font-size:1.1rem">Tu carrito está vacío</p>
        </div>`;
      if (totalEl) totalEl.textContent = 'S/ 0';
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }

    let html = '<div style="padding:1rem">';
    cart.forEach(item => {
      html += `
        <div style="display:flex;align-items:center;gap:1rem;padding:.75rem 0;border-bottom:1px dashed #e8d5c4">
          <span style="font-size:2.5rem">${item.emoji}</span>
          <div style="flex:1">
            <div style="font-weight:700;color:#3d2810;font-size:.95rem">${item.nombre}</div>
            <div style="color:#8a6e52;font-size:.82rem">S/ ${item.precio} c/u</div>
          </div>
          <div style="display:flex;align-items:center;gap:.5rem">
            <button onclick="cart.updateQuantity(${item.id}, ${(item.cantidad||1)-1}); cart.updateCartModalContent();" 
              style="width:28px;height:28px;border-radius:50%;border:1.5px solid #e8d5c4;background:#fdf8f0;cursor:pointer;font-size:.9rem">−</button>
            <span style="font-weight:700;color:#3d2810;min-width:20px;text-align:center">${item.cantidad || 1}</span>
            <button onclick="cart.updateQuantity(${item.id}, ${(item.cantidad||1)+1}); cart.updateCartModalContent();"
              style="width:28px;height:28px;border-radius:50%;border:1.5px solid #e8d5c4;background:#fdf8f0;cursor:pointer;font-size:.9rem">+</button>
          </div>
          <div style="font-family:'Caveat',cursive;font-size:1.2rem;font-weight:700;color:#c4622d;min-width:60px;text-align:right">
            S/ ${(item.precio * (item.cantidad||1)).toFixed(0)}
          </div>
          <button onclick="cart.removeFromCart(${item.id}); cart.updateCartModalContent();"
            style="background:none;border:none;color:#c4622d;cursor:pointer;font-size:1.1rem;padding:.2rem">✕</button>
        </div>`;
    });
    html += '</div>';

    body.innerHTML = html;
    if (totalEl) totalEl.textContent = `S/ ${getTotal().toFixed(0)}`;
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.onclick = () => sendWhatsAppOrder(cart);
    }
  }

  function sendWhatsAppOrder(cart) {
    const items = cart.map(i => `• ${i.nombre} x${i.cantidad||1} = S/ ${(i.precio*(i.cantidad||1)).toFixed(0)}`).join('%0A');
    const total = getTotal();
    const msg = `🌸 *Hola Encantos Eternos!*%0A%0AQuisiera hacer el siguiente pedido:%0A%0A${items}%0A%0A💛 *Total: S/ ${total.toFixed(0)}*%0A%0AEstoy esperando su confirmación. ¡Gracias!`;
    window.open(`https://wa.me/51987654321?text=${msg}`, '_blank');
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
      position:fixed;bottom:5rem;left:50%;transform:translateX(-50%) translateY(20px);
      background:#4a7c59;color:white;padding:.7rem 1.5rem;border-radius:99px;
      font-size:.875rem;font-weight:600;z-index:9999;opacity:0;
      transition:all .3s ease;pointer-events:none;white-space:nowrap;
      font-family:'Nunito',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.2)
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  window.cart = {
    addToCart, removeFromCart, updateQuantity,
    clearCart, getCart, getTotal, getCount,
    updateCartCount, updateCartModalContent
  };

  // Inicializar contador al cargar
  document.addEventListener('DOMContentLoaded', updateCartCount);

})();
