/* ================================================
   ENCANTOS ETERNOS – newsletter.js
================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('newsletterForm3');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('email3');
    const error = document.getElementById('error3');
    const success = document.getElementById('success3');
    const emailVal = input?.value.trim();
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRx.test(emailVal)) {
      error?.classList.remove('d-none');
      success?.classList.add('d-none');
      return;
    }

    error?.classList.add('d-none');
    success?.classList.remove('d-none');
    if (input) input.value = '';

    // Guardar suscriptor
    const subs = JSON.parse(localStorage.getItem('encantos_subs') || '[]');
    if (!subs.includes(emailVal)) {
      subs.push(emailVal);
      localStorage.setItem('encantos_subs', JSON.stringify(subs));
    }

    setTimeout(() => success?.classList.add('d-none'), 4000);
  });
});
