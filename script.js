const container = document.getElementById('features');
if (container) {
  const items = Array.from(container.querySelectorAll('.item'));

  function resetList() {
    items.forEach((item) => {
      item.style.display = '';
      const btn = item.querySelector('.item-btn');
      btn.classList.remove('active');
      const badge = btn.querySelector('.badge');
      if (badge) badge.textContent = '+';
    });
    const detail = container.querySelector('.item-detail');
    if (detail) detail.remove();
    try { window._prodectaSendHeight && window._prodectaSendHeight(); } catch (e) {}
  }

  function showDetail(item) {
    items.forEach((it) => {
      if (it !== item) it.style.display = 'none';
    });
    const btn = item.querySelector('.item-btn');
    btn.classList.add('active');
    const badge = btn.querySelector('.badge');
    if (badge) badge.textContent = '−';
    const detail = document.createElement('div');
    detail.className = 'item-detail';
    detail.textContent = item.dataset.detail;
    container.appendChild(detail);
    try { window._prodectaSendHeight && window._prodectaSendHeight(); } catch (e) {}
  }

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.item-btn');
    if (!btn) return;
    const item = btn.closest('.item');
    if (btn.classList.contains('active')) {
      resetList();
    } else {
      resetList();
      showDetail(item);
    }
  });

  resetList();
}
