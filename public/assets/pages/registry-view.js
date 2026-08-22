const params = new URLSearchParams(location.search);
const slug = params.get('slug');
let activeItemId = null;

async function loadRegistry() {
  if (!slug) {
    document.getElementById('reg-title').textContent = 'No wishlist specified';
    return;
  }
  const res = await fetch(`/api/registries?slug=${slug}`);
  if (!res.ok) {
    document.getElementById('reg-title').textContent = "We couldn't find that wishlist";
    return;
  }
  const r = await res.json();
  document.getElementById('reg-title').textContent = `${r.parent_name}${r.partner_name ? ' & ' + r.partner_name : ''}'s Wishlist`;
  document.getElementById('reg-note').textContent = r.cover_note || 'Compare prices across stores, then buy directly from whoever you like. Reserve what you pick so no one else buys the same thing.';
  loadItems();
}

async function loadItems() {
  const res = await fetch(`/api/items?slug=${slug}`);
  const items = await res.json();
  const el = document.getElementById('items');
  if (!items.length) {
    el.innerHTML = '<p>No items on this wishlist yet.</p>';
    return;
  }
  // Only allow http(s) product links — blocks a javascript: or data: URL being stored as "url"
  const safeUrl = (u) => (u && /^https?:\/\//i.test(u)) ? u : null;

  el.innerHTML = items.map(i => `
    <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:12px;padding:20px 22px;">
      <div>
        <div style="font-weight:600;font-size:1.05rem;">${escapeHtml(i.title)}</div>
        <div style="font-size:0.85rem;color:var(--ink-soft);margin-top:4px;">
          ${escapeHtml(i.store) || ''}${i.price ? ' · ₹' + Number(i.price).toLocaleString('en-IN') : ''}
          ${safeUrl(i.url) ? ` · <a href="${escapeHtml(i.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--sage-dark);text-decoration:underline;">View product</a>` : ''}
        </div>
      </div>
      ${i.reservation_id
        ? `<span class="pill reserved">✓ Reserved by ${escapeHtml(i.guest_name)}</span>`
        : `<button class="btn btn-marigold" data-reserve-id="${i.id}" data-reserve-title="${escapeHtml(i.title)}">Reserve</button>`
      }
    </div>
  `).join('');

  el.querySelectorAll('[data-reserve-id]').forEach((btn) => {
    btn.addEventListener('click', () => openReserve(Number(btn.dataset.reserveId), btn.dataset.reserveTitle));
  });
}

function openReserve(itemId, title) {
  activeItemId = itemId;
  // textContent, not innerHTML — title is already-safe text at this point regardless
  document.getElementById('reserve-item-title').textContent = title;
  document.getElementById('reserve-modal').style.display = 'flex';
}
document.getElementById('cancel-reserve').addEventListener('click', () => {
  document.getElementById('reserve-modal').style.display = 'none';
});
document.getElementById('confirm-reserve').addEventListener('click', async () => {
  const guest_name = document.getElementById('guest_name').value.trim();
  if (!guest_name) { toast('Please add your name'); return; }
  const payload = {
    item_id: activeItemId,
    guest_name,
    guest_email: document.getElementById('guest_email').value.trim(),
    message: document.getElementById('guest_message').value.trim(),
  };
  const res = await fetch('/api/reserve', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) {
    toast((await res.json()).error || 'Could not reserve this gift');
    return;
  }
  document.getElementById('reserve-modal').style.display = 'none';
  toast('Reserved — thank you!');
  loadItems();
});

loadRegistry();
