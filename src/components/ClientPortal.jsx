import { useMemo, useState } from "react";
import { Check, ChevronDown, Download, Euro, Home, MapPinned, Sparkles, Video } from "lucide-react";
import { SECTORS } from "../data/pricingConfig.js";
import { eur } from "../lib/formatters.js";
import { calculateQuote, createDefaultProperty } from "../lib/pricing.js";
import { exportQuotePdf } from "../lib/exportQuote.js";
import { NumberField, TextField } from "./ui.jsx";

const APP_PRESETS = {
  base: {
    label: "App web immersive",
    detail: "L’overlay clair et moderne au-dessus de votre visite virtuelle.",
    price: "À partir de 600 €",
    ids: ["web-app-immersive"],
    includes: [
      "Interface immersive responsive mobile / ordinateur",
      "Menu, sections, points d’intérêt et navigation simplifiée",
      "Mise en avant des avis Google et éléments de réassurance",
      "Lien partageable pour site, QR code, emailing ou réseaux sociaux",
    ],
  },
  full: {
    label: "Site immersif complet",
    detail: "Une expérience immersive pensée comme site principal ou landing page premium.",
    price: "2 130 €",
    ids: ["web-app-immersive", "booking-module", "seo-geo", "custom-url", "automation", "conversion-popup", "custom-map"],
    includes: [
      "Tout ce qui est compris dans l’app web immersive",
      "Intégration du vrai système de réservation ou de contact",
      "Référencement SEO / GEO et URL personnalisée",
      "Pop-up de conversion, automatisation et carte personnalisée",
      "Parcours pensé pour transformer la visite en demande ou réservation",
    ],
  },
};

const SUBSCRIPTION_PRESETS = {
  essential: {
    label: "Essentiel",
    ids: ["hosting-maintenance", "matterport-space"],
    detail: "Hébergement de l’app et de la visite virtuelle.",
    includes: [
      "Hébergement de l’app web immersive",
      "Hébergement de la visite virtuelle Matterport",
      "Maintenance technique essentielle",
      "Expérience accessible mobile, tablette et ordinateur",
    ],
  },
  growth: {
    label: "Croissance",
    ids: ["hosting-maintenance", "matterport-space", "analytics-dashboard"],
    detail: "Dashboard data, suivi des performances et re-shoot à -25 %.",
    includes: [
      "Tout l’abonnement Essentiel",
      "Dashboard de données comportementales",
      "Analyse des clics, parcours, zones vues et conversions",
      "Aide à l’identification des espaces qui déclenchent l’intérêt",
      "Re-shoot annuel du bien avec -25 %",
    ],
  },
  premium: {
    label: "Premium",
    ids: ["hosting-maintenance", "matterport-space", "analytics-dashboard", "monthly-updates-support"],
    detail: "Rapports KPI, accompagnement stratégique et re-shoot à -50 %.",
    includes: [
      "Tout l’abonnement Croissance",
      "Domaine personnalisé inclus",
      "Rapport KPI mensuel ultra détaillé",
      "Analyse par business analyst professionnel",
      "Accompagnement stratégique pour améliorer la conversion",
      "Support prioritaire et re-shoot annuel à -50 %",
      "Vidéo IA 30 secondes à 100 € au lieu de 250 €",
    ],
  },
};

const SHOOTING_DETAILS = [
  "Captation intérieure 360°/3D selon la surface du lieu",
  "Points de vue extérieurs calculés selon les espaces à valoriser",
  "Production d’une visite exploitable pour site, Google, QR code ou présentation commerciale",
  "Prix ajusté automatiquement selon la surface renseignée",
];

const VIDEO_DETAILS = [
  "Vidéo courte de 30 secondes pour teaser l’expérience immersive",
  "Format utile pour réseaux sociaux, publicité, site ou relance commerciale",
  "Prix standard : 250 € par vidéo",
  "Prix Premium : 100 € par vidéo",
];

function pillClass(active) {
  return active
    ? "border-emerald-600 bg-emerald-700 text-white shadow-lg shadow-emerald-950/10"
    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50";
}

function DetailList({ items, active }) {
  return (
    <details className={`mt-4 rounded-2xl border ${active ? "border-white/20 bg-black/10" : "border-slate-200 bg-slate-50"}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black">
        Voir le détail inclus
        <ChevronDown size={16} />
      </summary>
      <ul className="space-y-2 px-4 pb-4">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm font-semibold leading-snug">
            <span className={active ? "text-emerald-200" : "text-emerald-700"}>✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function OptionCard({ active, icon: Icon, label, detail, price, includes = [], onClick }) {
  return (
    <div className={`rounded-[24px] border-2 p-5 text-left transition ${pillClass(active)}`}>
      <button type="button" onClick={onClick} className="block w-full text-left">
        <div className="flex items-start justify-between gap-4">
          <span className={`rounded-2xl p-3 ${active ? "bg-white text-emerald-900" : "bg-slate-100 text-slate-500"}`}>
            <Icon size={21} />
          </span>
          {active && <Check size={20} />}
        </div>
        <h3 className="mt-4 text-xl font-black">{label}</h3>
        <p className={`mt-2 text-sm font-semibold leading-relaxed ${active ? "text-emerald-50" : "text-slate-500"}`}>{detail}</p>
        {price && <p className="mt-5 text-2xl font-black tabular-nums">{price}</p>}
      </button>
      {includes.length > 0 && <DetailList items={includes} active={active} />}
    </div>
  );
}

function buildQuoteSnapshot({ meta, sector, pricing, inputs, property, appPreset, subscriptionPreset, wantsShooting, wantsVideo, videoQuantity }) {
  const now = new Date().toISOString();
  const cleanPricing = {
    ...pricing,
    selectedModules: pricing.selectedModules.map(({ icon, ...module }) => module),
    setupModules: pricing.setupModules.map(({ icon, ...module }) => module),
    recurringModules: pricing.recurringModules.map(({ icon, ...module }) => module),
    lineItems: pricing.lineItems.map(({ icon, ...module }) => module),
    segments: {
      shooting: { ...pricing.segments.shooting, lineItems: pricing.segments.shooting.lineItems.map(({ icon, ...module }) => module) },
      app: { ...pricing.segments.app, lineItems: pricing.segments.app.lineItems.map(({ icon, ...module }) => module) },
      subscription: { ...pricing.segments.subscription, lineItems: pricing.segments.subscription.lineItems.map(({ icon, ...module }) => module) },
    },
    propertyQuotes: pricing.propertyQuotes.map((propertyQuote) => ({
      ...propertyQuote,
      catalogModules: propertyQuote.catalogModules.map(({ icon, ...module }) => module),
      selectedModules: propertyQuote.selectedModules.map(({ icon, ...module }) => module),
    })),
  };

  return {
    id: "client-preview",
    quoteName: `Estimation Prodecta - ${meta.establishmentName || sector.label}`,
    client: { name: meta.clientName, establishmentName: meta.establishmentName, email: meta.clientEmail, phone: meta.clientPhone },
    sectorLabel: sector.label,
    status: "simulation client",
    createdAt: now,
    updatedAt: now,
    inputs: { ...inputs, properties: [property], appPreset, subscriptionPreset, wantsShooting, wantsVideo, videoQuantity },
    pricing: cleanPricing,
    notes: {
      clientComments: "Estimation indicative réalisée depuis le simulateur client Prodecta.",
      internalNotes: "Mode client verrouillé : aucune remise ni donnée interne affichée.",
    },
  };
}

export function ClientPortal() {
  const [meta, setMeta] = useState({ establishmentName: "", clientName: "", clientEmail: "", clientPhone: "" });
  const [inputs, setInputs] = useState({ sectorKey: "hotel", surfaceInterior: 250, surfaceExterior: 600 });
  const [wantsShooting, setWantsShooting] = useState(true);
  const [appPreset, setAppPreset] = useState("base");
  const [subscriptionPreset, setSubscriptionPreset] = useState("growth");
  const [wantsVideo, setWantsVideo] = useState(false);
  const [videoQuantity, setVideoQuantity] = useState(1);

  const sector = SECTORS[inputs.sectorKey] || SECTORS.hotel;

  const selectedModuleIds = useMemo(() => {
    const ids = [
      ...(wantsShooting ? ["interior-capture", "exterior-capture"] : []),
      ...APP_PRESETS[appPreset].ids,
      ...SUBSCRIPTION_PRESETS[subscriptionPreset].ids,
      ...(wantsVideo ? ["ai-video"] : []),
    ];
    return [...new Set(ids)];
  }, [wantsShooting, appPreset, subscriptionPreset, wantsVideo]);

  const property = useMemo(
    () =>
      createDefaultProperty(1, {
        id: "client-property",
        name: meta.establishmentName || "Votre établissement",
        surfaceInterior: inputs.surfaceInterior,
        surfaceExterior: inputs.surfaceExterior,
        manualPoints: false,
        videoQuantity,
        selectedModuleIds,
      }),
    [meta.establishmentName, inputs.surfaceInterior, inputs.surfaceExterior, selectedModuleIds, videoQuantity],
  );

  const pricing = useMemo(
    () => calculateQuote({ sectorKey: inputs.sectorKey, properties: [property], discountType: "percent", discountPercent: 0, discountFixed: 0, marginMode: "safe" }),
    [inputs.sectorKey, property],
  );

  const quote = useMemo(
    () => buildQuoteSnapshot({ meta, sector, pricing, inputs, property, appPreset, subscriptionPreset, wantsShooting, wantsVideo, videoQuantity }),
    [meta, sector, pricing, inputs, property, appPreset, subscriptionPreset, wantsShooting, wantsVideo, videoQuantity],
  );

  const updateMeta = (key, value) => setMeta((previous) => ({ ...previous, [key]: value }));
  const updateInput = (key, value) => setInputs((previous) => ({ ...previous, [key]: Number(value) || 0 }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6">
        <header className="overflow-hidden rounded-[30px] border border-slate-900 bg-slate-950 text-white shadow-2xl">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 lg:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">Prodecta</p>
            <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-tight lg:text-5xl">Estimez votre expérience immersive</h1>
            <p className="mt-3 max-w-3xl text-base font-semibold leading-relaxed text-slate-300">Quelques informations suffisent pour obtenir une estimation simple : shooting, app web immersive et abonnement.</p>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">1. Votre établissement</p>
              <h2 className="mt-1 text-2xl font-black">Informations de base</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <TextField label="Nom de l’établissement" value={meta.establishmentName} onChange={(value) => updateMeta("establishmentName", value)} placeholder="Ex : Hôtel des Jardins" />
              <TextField label="Votre nom" value={meta.clientName} onChange={(value) => updateMeta("clientName", value)} placeholder="Nom / prénom" />
              <TextField label="Email" type="email" value={meta.clientEmail} onChange={(value) => updateMeta("clientEmail", value)} placeholder="contact@exemple.fr" />
              <TextField label="Téléphone" value={meta.clientPhone} onChange={(value) => updateMeta("clientPhone", value)} placeholder="06 ..." />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(SECTORS).map(([key, item]) => {
                const Icon = item.icon;
                const active = inputs.sectorKey === key;
                return (
                  <button key={key} type="button" onClick={() => setInputs((previous) => ({ ...previous, sectorKey: key }))} className={`rounded-2xl border p-3 text-left transition ${active ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"}`}>
                    <Icon size={18} />
                    <span className="mt-2 block text-xs font-black">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="rounded-[28px] border border-emerald-800 bg-emerald-900 p-5 text-white shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Estimation</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-4"><span className="font-bold text-emerald-100">Création</span><span className="text-2xl font-black">{eur(pricing.setupFinalHT)}</span></div>
              <div className="flex items-center justify-between gap-4"><span className="font-bold text-emerald-100">Mensuel</span><span className="text-2xl font-black">{eur(pricing.monthlyFinalHT, " €/mois")}</span></div>
              <div className="border-t border-white/15 pt-3"><div className="flex items-center justify-between gap-4"><span className="font-black">Total de démarrage</span><span className="text-3xl font-black">{eur(pricing.startupTotalHT)}</span></div></div>
            </div>
            <button type="button" onClick={() => exportQuotePdf(quote, { clientMode: true })} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50">
              <Download size={18} /> Télécharger l’estimation PDF
            </button>
          </aside>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">2. Surfaces</p>
          <h2 className="mt-1 text-2xl font-black">À dimensionner simplement</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <NumberField label="Surface intérieure approximative" unit="m²" value={inputs.surfaceInterior} onChange={(value) => updateInput("surfaceInterior", value)} />
            <NumberField label="Surface extérieure approximative" unit="m²" value={inputs.surfaceExterior} onChange={(value) => updateInput("surfaceExterior", value)} />
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">3. Shooting</p>
          <h2 className="mt-1 text-2xl font-black">Souhaitez-vous que Prodecta réalise la captation ?</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <OptionCard active={wantsShooting} icon={MapPinned} label="Shooting 360° / 3D" detail="Captation intérieure et points extérieurs par Prodecta." price={eur(pricing.segments.shooting.setupPublic)} includes={SHOOTING_DETAILS} onClick={() => setWantsShooting((value) => !value)} />
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-xl font-black">Déjà une visite Matterport ?</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">Vous pouvez désactiver le shooting et choisir uniquement l’app web immersive. C’est le cas typique pour un photographe Matterport ou un établissement qui possède déjà sa visite.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">4. App web immersive</p>
          <h2 className="mt-1 text-2xl font-black">Choisissez le niveau d’expérience</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <OptionCard active={appPreset === "base"} icon={Sparkles} label={APP_PRESETS.base.label} detail={APP_PRESETS.base.detail} price={APP_PRESETS.base.price} includes={APP_PRESETS.base.includes} onClick={() => setAppPreset("base")} />
            <OptionCard active={appPreset === "full"} icon={Home} label={APP_PRESETS.full.label} detail={APP_PRESETS.full.detail} price={APP_PRESETS.full.price} includes={APP_PRESETS.full.includes} onClick={() => setAppPreset("full")} />
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">5. Abonnement</p>
          <h2 className="mt-1 text-2xl font-black">Sélectionnez l’accompagnement mensuel</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {Object.entries(SUBSCRIPTION_PRESETS).map(([key, plan]) => {
              const active = subscriptionPreset === key;
              const prices = pricing.sector.publicPlans;
              const price = key === "essential" ? prices[0] : key === "growth" ? prices[1] : prices[2];
              return <OptionCard key={key} active={active} icon={Euro} label={plan.label} detail={plan.detail} price={eur(price, " €/mois")} includes={plan.includes} onClick={() => setSubscriptionPreset(key)} />;
            })}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">6. Option vidéo</p>
          <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_260px] lg:items-start">
            <OptionCard active={wantsVideo} icon={Video} label="Vidéo IA / teaser 30 secondes" detail="Une vidéo courte pour promouvoir l’expérience immersive." price={wantsVideo ? eur((subscriptionPreset === "premium" ? 100 : 250) * videoQuantity) : "Option"} includes={VIDEO_DETAILS} onClick={() => setWantsVideo((value) => !value)} />
            {wantsVideo && <NumberField label="Nombre de vidéos" unit="vidéos" min={1} value={videoQuantity} onChange={(value) => setVideoQuantity(Math.max(1, Number(value) || 1))} />}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Récapitulatif</p>
              <h2 className="mt-1 text-2xl font-black">Votre estimation</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Cette estimation reste indicative et sera confirmée après échange avec l’équipe Prodecta.</p>
            </div>
            <div className="grid gap-2 text-right sm:grid-cols-3 lg:min-w-[520px]">
              <div className="rounded-2xl bg-slate-100 p-3"><p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Shooting</p><p className="text-xl font-black">{eur(pricing.segments.shooting.setupPublic)}</p></div>
              <div className="rounded-2xl bg-slate-100 p-3"><p className="text-[11px] font-black uppercase tracking-wide text-slate-500">App web</p><p className="text-xl font-black">{eur(pricing.segments.app.setupPublic)}</p></div>
              <div className="rounded-2xl bg-slate-100 p-3"><p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Mensuel</p><p className="text-xl font-black">{eur(pricing.monthlyFinalHT, " €/mois")}</p></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
