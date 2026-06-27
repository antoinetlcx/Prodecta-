import {
  Castle,
  ChartNoAxesCombined,
  Dumbbell,
  FileText,
  Headphones,
  Home,
  Hotel,
  MapPinned,
  Megaphone,
  MousePointerClick,
  Settings2,
  ShieldCheck,
  Sparkles,
  Utensils,
  Video,
  WandSparkles,
} from "lucide-react";

const TIER_TEMPLATE = [
  { min: 0, max: 50, band: "small", base: 50 },
  { min: 51, max: 100, band: "small", base: 100 },
  { min: 101, max: 150, band: "small", base: 150 },
  { min: 151, max: 200, band: "small", base: 200 },
  { min: 201, max: 250, band: "small", base: 250 },
  { min: 251, max: 350, band: "medium", base: 350 },
  { min: 351, max: 500, band: "medium", base: 500 },
  { min: 501, max: 750, band: "large", base: 750 },
  { min: 751, max: 1000, band: "large", base: 1000 },
  { min: 1001, max: 1500, band: "xlarge", base: 1500 },
  { min: 1501, max: 2000, band: "xlarge", base: 2000 },
];

function buildTiers(coefficients, grandSpacesFrom = 351) {
  return TIER_TEMPLATE.map((tier) => ({
    category: tier.min >= grandSpacesFrom ? "Grands espaces" : "Standard",
    min: tier.min,
    max: tier.max,
    coeff: coefficients[tier.band],
    base: tier.base,
  }));
}

const APP_WEB_BASE_PRICE = 600;

export const SECTORS = {
  chateau: {
    label: "Château / Domaine",
    icon: Castle,
    color: "from-emerald-500 to-teal-700",
    accent: "#0f766e",
    minimumFixed: APP_WEB_BASE_PRICE,
    publicFixed: APP_WEB_BASE_PRICE,
    note: "Lieux de réception, domaines, châteaux, grands espaces premium.",
    minimumPlans: [18, 65, 115],
    publicPlans: [18, 65, 115],
    minimumTiers: buildTiers({ small: 2.4, medium: 2.25, large: 2.1, xlarge: 1.95 }),
    publicTiers: buildTiers({ small: 2.4, medium: 2.25, large: 2.1, xlarge: 1.95 }),
  },
  hotel: {
    label: "Hôtel",
    icon: Hotel,
    color: "from-cyan-500 to-emerald-700",
    accent: "#0e7490",
    minimumFixed: APP_WEB_BASE_PRICE,
    publicFixed: APP_WEB_BASE_PRICE,
    note: "Hôtels, établissements avec chambres, espaces communs et réservation.",
    minimumPlans: [30, 65, 115],
    publicPlans: [30, 65, 115],
    minimumTiers: buildTiers({ small: 2.5, medium: 2.35, large: 2.2, xlarge: 2.05 }),
    publicTiers: buildTiers({ small: 2.5, medium: 2.35, large: 2.2, xlarge: 2 }),
  },
  sport: {
    label: "Salle de sport",
    icon: Dumbbell,
    color: "from-lime-500 to-emerald-700",
    accent: "#15803d",
    minimumFixed: APP_WEB_BASE_PRICE,
    publicFixed: APP_WEB_BASE_PRICE,
    note: "Clubs fitness, franchises, espaces sport, studios et centres premium.",
    minimumPlans: [30, 70, 120],
    publicPlans: [30, 70, 120],
    minimumTiers: buildTiers({ small: 2.3, medium: 2.15, large: 2, xlarge: 1.85 }),
    publicTiers: buildTiers({ small: 2.3, medium: 2.15, large: 2, xlarge: 1.85 }),
  },
  airbnb: {
    label: "Gîte / Airbnb",
    icon: Home,
    color: "from-rose-400 to-emerald-700",
    accent: "#be123c",
    minimumFixed: APP_WEB_BASE_PRICE,
    publicFixed: APP_WEB_BASE_PRICE,
    note: "Gîtes, villas, locations courte durée, maisons d’hôtes.",
    minimumPlans: [15, 65, 115],
    publicPlans: [15, 65, 115],
    minimumTiers: buildTiers({ small: 2.5, medium: 2.35, large: 2.2, xlarge: 2 }, 251),
    publicTiers: buildTiers({ small: 2.5, medium: 2.35, large: 2.2, xlarge: 2 }, 251),
  },
  restaurant: {
    label: "Restaurant",
    icon: Utensils,
    color: "from-sky-400 to-teal-700",
    accent: "#0e7490",
    minimumFixed: APP_WEB_BASE_PRICE,
    publicFixed: APP_WEB_BASE_PRICE,
    note: "Restaurants, brasseries, lieux de bouche, concepts food.",
    minimumPlans: [15, 65, 115],
    publicPlans: [15, 65, 115],
    minimumTiers: buildTiers({ small: 2.7, medium: 2.5, large: 2.3, xlarge: 2.1 }),
    publicTiers: buildTiers({ small: 2.7, medium: 2.5, large: 2.3, xlarge: 2.1 }),
  },
};

export const EXTERIOR_BRACKETS = [
  { min: 1, max: 20, price: 32 },
  { min: 21, max: 50, price: 30.5 },
  { min: 51, max: 100, price: 29 },
  { min: 101, max: 200, price: 27.5 },
  { min: 201, max: 400, price: 26 },
  { min: 401, max: Infinity, price: 20 },
];

export const PLAN_NAMES = ["Essentiel", "Croissance", "Premium"];

export const MODULE_CATEGORIES = [
  "Shooting & Matterport",
  "Application web / overlay",
  "Abonnement récurrent",
  "Premium & accompagnement",
];

export const WORKFLOW_MODULE_GROUPS = {
  shooting: ["interior-capture", "exterior-capture"],
  app: [
    "web-app-immersive",
    "booking-module",
    "seo-geo",
    "custom-url",
    "automation",
    "conversion-popup",
    "custom-map",
    "ai-video",
  ],
  subscription: ["matterport-space", "hosting-maintenance", "analytics-dashboard", "monthly-updates-support"],
  premium: ["strategic-support", "full-website"],
};

export const SUBSCRIPTION_MODULE_IDS = WORKFLOW_MODULE_GROUPS.subscription;

export const PLAN_PRESETS = [
  {
    name: "Essentiel",
    description: "Hébergement de la visite virtuelle et de l’app web immersive.",
    moduleIds: ["hosting-maintenance", "matterport-space"],
  },
  {
    name: "Croissance",
    description: "Essentiel + dashboard comportemental, mises à jour et re-shoot à -25%.",
    moduleIds: ["hosting-maintenance", "matterport-space", "analytics-dashboard"],
  },
  {
    name: "Premium",
    description: "Croissance + rapports, stratégie, domaine et re-shoot à -50%.",
    moduleIds: ["hosting-maintenance", "matterport-space", "analytics-dashboard", "monthly-updates-support"],
  },
];

export const MODULE_CATALOG = [
  { id: "interior-capture", label: "Shooting intérieur", category: "Shooting & Matterport", description: "Captation intérieure, traitement et préparation de la visite virtuelle.", icon: Sparkles, defaultSelected: true, recommended: true, setupMode: "interior-surface", monthlyMode: "none" },
  { id: "matterport-space", label: "Hébergement visite virtuelle", category: "Abonnement récurrent", description: "Hébergement de la visite virtuelle Matterport inclus dans l’abonnement.", icon: MapPinned, defaultSelected: false, recommended: true, setupPublic: 0, setupMinimum: 0, monthlyPublic: 0, monthlyMinimum: 0 },
  { id: "web-app-immersive", label: "App web immersive / overlay de base", category: "Application web / overlay", description: "Socle app web : avis Google, sections, points d’intérêt, menu et interface globale.", icon: WandSparkles, defaultSelected: true, recommended: true, setupMode: "sector-fixed", monthlyMode: "none" },
  { id: "exterior-capture", label: "Points de vue extérieurs", category: "Shooting & Matterport", description: "Points de vue extérieurs calculés automatiquement selon la surface, avec correction manuelle possible.", icon: MapPinned, defaultSelected: true, setupMode: "exterior-points", monthlyMode: "none" },
  { id: "booking-module", label: "Intégration vrai système de réservation", category: "Application web / overlay", description: "Connexion ou intégration du vrai parcours de réservation du client.", icon: FileText, defaultSelected: false, setupPublic: 500, setupMinimum: 250, monthlyPublic: 0, monthlyMinimum: 0 },
  { id: "seo-geo", label: "Référencement SEO / GEO", category: "Application web / overlay", description: "Optimisation SEO/GEO du site immersif ou de la page principale.", icon: MousePointerClick, defaultSelected: false, setupPublic: 400, setupMinimum: 180, monthlyPublic: 0, monthlyMinimum: 0 },
  { id: "custom-url", label: "URL personnalisée", category: "Application web / overlay", description: "Paramétrage d’une URL personnalisée pour présenter l’expérience comme un vrai site.", icon: MousePointerClick, defaultSelected: false, setupPublic: 100, setupMinimum: 50, monthlyPublic: 0, monthlyMinimum: 0 },
  { id: "automation", label: "Système d’automatisation", category: "Application web / overlay", description: "Automatisation mail, CRM, Airtable, notification ou suivi des leads.", icon: Settings2, defaultSelected: false, setupPublic: 200, setupMinimum: 100, monthlyPublic: 0, monthlyMinimum: 0 },
  { id: "conversion-popup", label: "Pop-up", category: "Application web / overlay", description: "Pop-up de conversion pour offre, réservation, abonnement ou demande de contact.", icon: Megaphone, defaultSelected: false, setupPublic: 80, setupMinimum: 40, monthlyPublic: 0, monthlyMinimum: 0 },
  { id: "custom-map", label: "Carte personnalisée", category: "Application web / overlay", description: "Carte personnalisée pour gîtes, domaines, complexes, espaces ou parcours multi-zones.", icon: MapPinned, defaultSelected: false, setupPublic: 250, setupMinimum: 120, monthlyPublic: 0, monthlyMinimum: 0 },
  { id: "ai-video", label: "Vidéo IA / teaser 30 secondes", category: "Application web / overlay", description: "Vidéo IA courte de 30 secondes : 250 € par vidéo, ou 100 € par vidéo avec l’abonnement Premium.", icon: Video, defaultSelected: false, setupMode: "ai-video-quantity", monthlyMode: "none" },
  { id: "hosting-maintenance", label: "Hébergement app web immersive", category: "Abonnement récurrent", description: "Mise en ligne, disponibilité, maintenance technique et hébergement de l’overlay.", icon: ShieldCheck, defaultSelected: true, recommended: true, setupPublic: 0, setupMinimum: 0, monthlyMode: "subscription-base" },
  { id: "analytics-dashboard", label: "Dashboard data comportementales", category: "Abonnement récurrent", description: "Dashboard complet : parcours, clics, zones fortes, conversions et signaux commerciaux.", icon: ChartNoAxesCombined, defaultSelected: true, setupPublic: 0, setupMinimum: 0, monthlyMode: "subscription-growth-delta" },
  { id: "monthly-updates-support", label: "Rapports mensuels + accompagnement", category: "Abonnement récurrent", description: "Rapport KPI mensuel détaillé, analyse, stratégie et support prioritaire.", icon: Headphones, defaultSelected: false, setupPublic: 0, setupMinimum: 0, monthlyMode: "subscription-premium-delta" },
  { id: "strategic-support", label: "Accompagnement stratégique", category: "Premium & accompagnement", description: "Cadrage de l’offre, angles de conversion et recommandations commerciales.", icon: Sparkles, defaultSelected: false, setupPublic: 350, setupMinimum: 180, monthlyPublic: 0, monthlyMinimum: 0 },
  { id: "full-website", label: "Site web complet sur mesure", category: "Premium & accompagnement", description: "Structure SEO/GEO avancée, parcours complet, PMS ou paiement : à chiffrer au cas par cas.", icon: WandSparkles, defaultSelected: false, setupPublic: 2500, setupMinimum: 1200, monthlyPublic: 0, monthlyMinimum: 0, customPricing: true },
];

export const PROPERTY_MODULE_IDS = [
  "interior-capture", "matterport-space", "web-app-immersive", "exterior-capture", "hosting-maintenance", "analytics-dashboard", "monthly-updates-support", "booking-module", "seo-geo", "custom-url", "automation", "conversion-popup", "custom-map", "ai-video",
];

export const GLOBAL_MODULE_IDS = MODULE_CATALOG.filter((module) => !PROPERTY_MODULE_IDS.includes(module.id)).map(
  (module) => module.id,
);

export const DEFAULT_PROPERTY_MODULE_IDS = MODULE_CATALOG.filter(
  (module) => module.defaultSelected && PROPERTY_MODULE_IDS.includes(module.id),
).map((module) => module.id);

export const DEFAULT_SELECTED_MODULE_IDS = MODULE_CATALOG.filter(
  (module) => module.defaultSelected && GLOBAL_MODULE_IDS.includes(module.id),
).map((module) => module.id);

export const PROPERTY_PRESETS = [
  { name: "Shooting seul", scope: "shooting", description: "Captation intérieure + points extérieurs, sans app web obligatoire.", moduleIds: ["interior-capture", "exterior-capture"] },
  { name: "Overlay seul", scope: "app", description: "App web immersive de base au-dessus d’une visite Matterport déjà existante.", moduleIds: ["web-app-immersive"] },
  { name: "App + réservation", scope: "app", description: "App web de base avec intégration du vrai système de réservation.", moduleIds: ["web-app-immersive", "booking-module"] },
  { name: "Site immersif complet", scope: "app", description: "App web convertie en site principal : toutes les options incluses, total 2 130 €.", moduleIds: ["web-app-immersive", "booking-module", "seo-geo", "custom-url", "automation", "conversion-popup", "custom-map"] },
  { name: "Essentiel", scope: "subscription", description: "Hébergement visite virtuelle + app web immersive.", moduleIds: ["hosting-maintenance", "matterport-space"] },
  { name: "Croissance", scope: "subscription", description: "Essentiel + dashboard data comportementales + re-shoot -25%.", moduleIds: ["hosting-maintenance", "matterport-space", "analytics-dashboard"] },
  { name: "Premium", scope: "subscription", description: "Croissance + rapports, stratégie, domaine et re-shoot -50%.", moduleIds: ["hosting-maintenance", "matterport-space", "analytics-dashboard", "monthly-updates-support"] },
  { name: "Pack complet", scope: "full", description: "Shooting + site immersif complet + abonnement performance.", moduleIds: ["interior-capture", "exterior-capture", "web-app-immersive", "booking-module", "seo-geo", "custom-url", "automation", "conversion-popup", "custom-map", "hosting-maintenance", "matterport-space", "analytics-dashboard"] },
];

export const DEFAULT_CUSTOM_MODULE_PRICES = {
  "full-website": { setupPublic: 2500, setupMinimum: 1200, monthlyPublic: 0, monthlyMinimum: 0 },
};

export const DEFAULT_COMMERCIAL_TERMS = {
  discountType: "percent",
  discountPercent: 0,
  discountFixed: 0,
  marginMode: "safe",
};
