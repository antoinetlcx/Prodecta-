const FEATURES = [
  {
    t: 'Disponible dans toutes les langues',
    d: "Détection automatique de la langue du navigateur et bascule manuelle. Les contenus (textes, hotspots, call-to-actions) sont synchronisés multi-langues pour un SEO international propre."
  },
  {
    t: 'Intégrable sur votre site et Google Maps',
    d: "Intégration en iframe sur votre site en quelques lignes, ouverture plein écran, et ajout sur votre fiche Google Business. Compatible CMS (WordPress, Webflow, Shopify)."
  },
  {
    t: 'Liens partageables et statistiques',
    d: "Générez des liens trackés (UTM), suivez vues, temps moyen, clics sur hotspots et formulaires. Export CSV pour vos rapports ou votre CRM."
  },
  {
    t: 'Vue 2D/3D + mesures précises',
    d: "Plan 2D, vue ‘maison de poupée’ 3D et outil de mesure intégré (précision élevée). Idéal pour préparer événements, aménagements et devis techniques."
  }
];

const container = document.getElementById('features');
if (container) {
  function renderList() {
    container.innerHTML = '';
    FEATURES.forEach((f, i) => {
      const item = document.createElement('div');
      item.className = 'item';
      const btn = document.createElement('button');
      btn.className = 'item-btn';
      btn.setAttribute('data-index', i);
      btn.innerHTML = `<span class="badge">+</span><span class="item-text">${f.t}</span>`;
      item.appendChild(btn);
      container.appendChild(item);
    });
    try { window._prodectaSendHeight && window._prodectaSendHeight(); } catch (e) {}
  }

  function renderDetail(i) {
    container.innerHTML = '';
    const item = document.createElement('div');
    item.className = 'item';
    const btn = document.createElement('button');
    btn.className = 'item-btn active';
    btn.setAttribute('data-index', i);
    btn.innerHTML = `<span class="badge">−</span><span class="item-text">${FEATURES[i].t}</span>`;
    item.appendChild(btn);
    container.appendChild(item);
    const detail = document.createElement('div');
    detail.className = 'item-detail';
    detail.textContent = FEATURES[i].d;
    container.appendChild(detail);
    try { window._prodectaSendHeight && window._prodectaSendHeight(); } catch (e) {}
  }

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.item-btn');
    if (!btn) return;
    const i = parseInt(btn.dataset.index, 10);
    if (btn.classList.contains('active')) {
      renderList();
    } else {
      renderDetail(i);
    }
  });

  renderList();
}
