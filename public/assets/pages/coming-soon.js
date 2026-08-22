  const t = new URLSearchParams(location.search).get('title');
  if (t) document.getElementById('page-title').textContent = t;
