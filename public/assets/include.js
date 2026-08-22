// Escapes user-supplied text before it's inserted via innerHTML. Registry names, item
// titles, and guest names all come from public forms anyone can submit, so every one
// of those values must be escaped at render time or a malicious script tag in a title
// would execute in every visitor's browser.
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function includePartials() {
  const targets = document.querySelectorAll('[data-include]');
  await Promise.all(
    Array.from(targets).map(async (el) => {
      const src = el.getAttribute('data-include');
      try {
        const res = await fetch(src);
        el.innerHTML = await res.text();
      } catch (e) {
        console.error('include failed', src, e);
      }
    })
  );
  document.querySelectorAll('.nav-item > .nav-top').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = btn.closest('.nav-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.nav-item.open').forEach((n) => n.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
  const headerSearch = document.getElementById('headerSearch');
  if (headerSearch) headerSearch.addEventListener('click', () => { location.href = '/find-registry.html'; });
  const navToggleBtn = document.getElementById('navToggleBtn');
  if (navToggleBtn) navToggleBtn.addEventListener('click', () => { document.body.classList.toggle('nav-open'); });
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-item.open').forEach((n) => n.classList.remove('open'));
  });
}

function toast(message) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}
// Alias — some pages call showToast() instead of toast(); keep both working.
function showToast(message) { toast(message); }

document.addEventListener('DOMContentLoaded', includePartials);
