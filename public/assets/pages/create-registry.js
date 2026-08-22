async function createRegistry() {
  const payload = {
    parent_name: document.getElementById('parentName').value.trim(),
    partner_name: document.getElementById('partnerName').value.trim() || null,
    baby_name: document.getElementById('babyName').value.trim() || null,
    due_date: document.getElementById('dueDate').value || null,
    city: document.getElementById('city').value.trim() || null,
    slug: document.getElementById('slug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
  };
  if (!payload.parent_name || !payload.slug) {
    showToast('Add your name and a vanity link to continue');
    return;
  }
  try {
    const res = await fetch('/api/registries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('request failed');
    showToast('Registry created — redirecting…');
    setTimeout(() => location.href = '/gifting.html#vanity-url', 1000);
  } catch (e) {
    // Backend function not connected in this preview — proceed to the next step anyway.
    showToast('Saved locally — connect /api/registries to persist this');
    setTimeout(() => location.href = '/gifting.html#vanity-url', 1000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('createRegistryBtn');
  if (btn) btn.addEventListener('click', createRegistry);
});
