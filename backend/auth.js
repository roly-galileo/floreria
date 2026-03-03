/* ================================================
   ENCANTOS ETERNOS – auth.js
   Sistema de autenticación simple con localStorage
================================================ */

'use strict';

(function () {

  // Credenciales por defecto (en producción real usar backend)
  const DEFAULT_ADMIN = {
    usuario: 'admin',
    password: 'admin123',
    nombre: 'Administrador',
    rol: 'admin'
  };

  const DEFAULT_USER = {
    usuario: 'cliente',
    password: 'cliente123',
    nombre: 'Cliente Demo',
    rol: 'cliente'
  };

  // Inicializar usuarios si no existen
  function initUsers() {
    if (!localStorage.getItem('encantos_users')) {
      localStorage.setItem('encantos_users', JSON.stringify([DEFAULT_ADMIN, DEFAULT_USER]));
    }
  }

  // Verificar login
  function login(usuario, password) {
    initUsers();
    const users = JSON.parse(localStorage.getItem('encantos_users') || '[]');
    const user = users.find(u => u.usuario === usuario && u.password === password);
    if (user) {
      const session = {
        usuario: user.usuario,
        nombre: user.nombre,
        rol: user.rol,
        timestamp: Date.now()
      };
      localStorage.setItem('encantos_session', JSON.stringify(session));
      return { success: true, user: session };
    }
    return { success: false, error: 'Usuario o contraseña incorrectos' };
  }

  // Verificar si hay sesión activa
  function isLoggedIn() {
    const session = localStorage.getItem('encantos_session');
    if (!session) return false;
    const parsed = JSON.parse(session);
    // Sesión expira en 8 horas
    const eightHours = 8 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > eightHours) {
      logout();
      return false;
    }
    return true;
  }

  // Obtener sesión actual
  function getSession() {
    if (!isLoggedIn()) return null;
    return JSON.parse(localStorage.getItem('encantos_session'));
  }

  // Verificar si es admin
  function isAdmin() {
    const session = getSession();
    return session && session.rol === 'admin';
  }

  // Cerrar sesión
  function logout() {
    localStorage.removeItem('encantos_session');
  }

  // Registro de nuevo usuario (solo admin)
  function register(datos) {
    if (!isAdmin()) return { success: false, error: 'Sin permisos' };
    initUsers();
    const users = JSON.parse(localStorage.getItem('encantos_users') || '[]');
    if (users.find(u => u.usuario === datos.usuario)) {
      return { success: false, error: 'El usuario ya existe' };
    }
    users.push(datos);
    localStorage.setItem('encantos_users', JSON.stringify(users));
    return { success: true };
  }

  // Proteger página (redirigir si no hay sesión)
  function protectPage(requireAdmin = false) {
    if (!isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    if (requireAdmin && !isAdmin()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  // Exponer API global
  window.auth = {
    login,
    logout,
    isLoggedIn,
    isAdmin,
    getSession,
    register,
    protectPage
  };

})();
