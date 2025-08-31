function sendHeight() {
  try {
    window._prodectaSendHeight && window._prodectaSendHeight();
  } catch (e) {}
}

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
    sendHeight();
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
    sendHeight();
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

const bar = document.querySelector('.slide-bar');
if (bar) {
  const btns = bar.querySelectorAll('.slide-btn');
  const slides = document.querySelectorAll('.slide');
  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.slide;
      btns.forEach((b) => b.classList.toggle('active', b === btn));
      slides.forEach((s) => s.classList.toggle('active', s.id === target));
      sendHeight();
    });
  });
}
