async function findRegistry() {
  const term = document.getElementById('searchTerm').value.trim();
  const results = document.getElementById('results');
  if (!term) { showToast('Type a name or link to search'); return; }
  results.innerHTML = '<p style="font-size:0.9rem;">Searching…</p>';
  try {
    const res = await fetch('/api/registries?search=' + encodeURIComponent(term));
    if (!res.ok) throw new Error('request failed');
    const data = await res.json();
    if (!data.length) {
      results.innerHTML = '<p style="font-size:0.9rem;">No registry found for "' + escapeHtml(term) + '".</p>';
      return;
    }
    results.innerHTML = data.map(r => `
      <a class="card card-hover" style="display:block;margin-bottom:10px;" href="/gift/${encodeURIComponent(r.slug)}">
        <strong>${escapeHtml(r.baby_name || r.parent_name)}'s registry</strong>
        <p style="font-size:0.85rem;margin:4px 0 0;">theperfectparenting.in/gift/${escapeHtml(r.slug)}</p>
      </a>
    `).join('');
  } catch (e) {
    results.innerHTML = '<p style="font-size:0.9rem;">Search isn\'t connected in this preview — hook this page up to /api/registries once the backend is live.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('searchBtn');
  if (btn) btn.addEventListener('click', findRegistry);
  const input = document.getElementById('searchTerm');
  if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') findRegistry(); });
});
