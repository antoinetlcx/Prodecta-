// CTA démo
const cta = document.getElementById('cta-btn');
if (cta) {
  cta.addEventListener('click', function () {
    alert('Simulation de devis lancée !');
  });
}

// Données des avantages
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

// Interactions “Nos avantages”
const list = document.getElementById('features-list');
const detail = document.getElementById('feature-detail');

function setActive(i) {
  // toggle visuel
  list.querySelectorAll('.feat-item').forEach(li => li.classList.remove('active'));
  const li = list.querySelector(`.feat-item[data-index="${i}"]`);
  if (li) li.classList.add('active');
  // maj contenu
  detail.querySelector('.feat-detail-title').textContent = FEATURES[i].t;
  detail.querySelector('.feat-detail-text').textContent = FEATURES[i].d;
}

if (list && detail) {
  // clic sur un item
  list.addEventListener('click', (e) => {
    const li = e.target.closest('.feat-item');
    if (!li) return;
    const i = parseInt(li.getAttribute('data-index'), 10) || 0;
    setActive(i);
  });

  // valeur par défaut
  setActive(0);
}
