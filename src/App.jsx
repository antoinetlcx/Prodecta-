import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  ClipboardList,
  Eye,
  EyeOff,
  Euro,
  Layers3,
  MapPinned,
  Percent,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { CommercialTerms } from "./components/CommercialTerms.jsx";
import { ModuleSelector } from "./components/ModuleSelector.jsx";
import { PricingBreakdown } from "./components/PricingBreakdown.jsx";
import { PropertiesManager } from "./components/PropertiesManager.jsx";
import { QuoteForm } from "./components/QuoteForm.jsx";
import { QuoteLibrary } from "./components/QuoteLibrary.jsx";
import { QuoteSummary } from "./components/QuoteSummary.jsx";
import { Card, StatCard } from "./components/ui.jsx";
import {
  DEFAULT_COMMERCIAL_TERMS,
  DEFAULT_CUSTOM_MODULE_PRICES,
  DEFAULT_SELECTED_MODULE_IDS,
  PLAN_PRESETS,
  SECTORS,
  SUBSCRIPTION_MODULE_IDS,
  WORKFLOW_MODULE_GROUPS,
} from "./data/pricingConfig.js";
import {
  createPlainTextSummary,
  exportQuoteCsv,
  exportQuoteJson,
  exportQuotePdf,
} from "./lib/exportQuote.js";
import { eur, pct } from "./lib/formatters.js";
import { calculateQuote, createDefaultProperty, normalizeProperties } from "./lib/pricing.js";
import { createQuoteId, loadQuotes, persistQuotes, removeQuote, upsertQuote } from "./lib/quoteStorage.js";

const DEFAULT_QUOTE_META = {
  quoteName: "",
  clientName: "",
  establishmentName: "",
  clientEmail: "",
  clientPhone: "",
  status: "brouillon",
  clientComments: "",
  internalNotes: "",
};

const DEFAULT_INPUTS = {
  sectorKey: "hotel",
  surfaceInterior: 420,
  surfaceExterior: 1200,
  manualPoints: false,
  pointsExterior: 12,
};

const WORKFLOW_STEPS = [
  {
    id: "shooting",
    eyebrow: "01",
    label: "Shooting",
    title: "Prix du shooting",
    description: "On isole la captation : surface intérieure, points extérieurs, prix public et prix minimum.",
    icon: MapPinned,
  },
  {
    id: "app",
    eyebrow: "02",
    label: "App web",
    title: "App web / overlay",
    description: "On chiffre l’interface immersive seule ou au-dessus d’une visite Matterport déjà existante.",
    icon: Sparkles,
  },
  {
    id: "subscription",
    eyebrow: "03",
    label: "Abonnement",
    title: "Abonnement mensuel",
    description: "On présente clairement l’hébergement, Matterport, les statistiques, le support et les mises à jour.",
    icon: Euro,
  },
  {
    id: "quote",
    eyebrow: "04",
    label: "Devis final",
    title: "Synthèse du devis",
    description: "On retrouve le total de démarrage, le mensuel, la marge interne et les exports.",
    icon: ClipboardList,
  },
];

const EDITOR_STEPS = ["shooting", "app", "subscription"];
const FULL_SITE_MODULE_IDS = [
  "web-app-immersive",
  "booking-module",
  "seo-geo",
  "custom-url",
  "automation",
  "conversion-popup",
  "custom-map",
];

function cloneCustomPrices(value = DEFAULT_CUSTOM_MODULE_PRICES) {
  return JSON.parse(JSON.stringify(value));
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function createPropertyId() {
  return `property-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createNewProperty(index) {
  return createDefaultProperty(index, {
    id: createPropertyId(),
    name: `Bien ${index}`,
    surfaceInterior: 50,
    surfaceExterior: 0,
    manualPoints: false,
    pointsExterior: 0,
    selectedModuleIds: ["interior-capture", "matterport-space"],
  });
}

function buildDefaultQuoteName(meta, pricing) {
  const target = meta.establishmentName || meta.clientName || pricing.sector.label;
  return `Devis Prodecta - ${target}`;
}

function mergeScopedModules(currentIds = [], moduleIds = [], scope = "full") {
  if (scope === "full" || !WORKFLOW_MODULE_GROUPS[scope]) {
    return [...new Set(moduleIds)];
  }

  const scopedIds = WORKFLOW_MODULE_GROUPS[scope];
  return [...new Set([...currentIds.filter((id) => !scopedIds.includes(id)), ...moduleIds])];
}

function serializePricing(pricing) {
  return {
    sectorKey: pricing.sectorKey,
    intSurface: pricing.intSurface,
    extSurface: pricing.extSurface,
    estimatedPoints: pricing.estimatedPoints,
    points: pricing.points,
    unitPoint: pricing.unitPoint,
    publicTier: pricing.publicTier,
    minTier: pricing.minTier,
    selectedModules: pricing.selectedModules.map(({ icon, ...module }) => module),
    setupModules: pricing.setupModules.map(({ icon, ...module }) => module),
    recurringModules: pricing.recurringModules.map(({ icon, ...module }) => module),
    lineItems: pricing.lineItems.map(({ icon, ...module }) => module),
    segments: {
      shooting: {
        ...pricing.segments.shooting,
        lineItems: pricing.segments.shooting.lineItems.map(({ icon, ...module }) => module),
      },
      app: {
        ...pricing.segments.app,
        lineItems: pricing.segments.app.lineItems.map(({ icon, ...module }) => module),
      },
      subscription: {
        ...pricing.segments.subscription,
        lineItems: pricing.segments.subscription.lineItems.map(({ icon, ...module }) => module),
      },
    },
    properties: pricing.properties,
    propertyQuotes: pricing.propertyQuotes.map((propertyQuote) => ({
      ...propertyQuote,
      catalogModules: propertyQuote.catalogModules.map(({ icon, ...module }) => module),
      selectedModules: propertyQuote.selectedModules.map(({ icon, ...module }) => module),
    })),
    propertyCount: pricing.propertyCount,
    virtualVisitCount: pricing.virtualVisitCount,
    matterportSpaces: pricing.matterportSpaces,
    webAppCount: pricing.webAppCount,
    trackingCount: pricing.trackingCount,
    setupPublicSubtotal: pricing.setupPublicSubtotal,
    setupMinimumSubtotal: pricing.setupMinimumSubtotal,
    monthlyPublicSubtotal: pricing.monthlyPublicSubtotal,
    monthlyMinimumSubtotal: pricing.monthlyMinimumSubtotal,
    discount: pricing.discount,
    setupFinalHT: pricing.setupFinalHT,
    monthlyFinalHT: pricing.monthlyFinalHT,
    startupTotalHT: pricing.startupTotalHT,
    floorDelta: pricing.floorDelta,
    isBelowFloor: pricing.isBelowFloor,
  };
}

function SegmentTile({ label, value, detail, tone = "slate" }) {
  const toneClass = tone === "emerald" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-900";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-bold opacity-70">{detail}</p>
    </div>
  );
}

function SubscriptionPlanCards({ sector }) {
  const plans = [
    { name: "Essentiel", detail: "Hébergement + maintenance", price: sector.publicPlans[0] },
    { name: "Croissance", detail: "Essentiel + dashboard analytics", price: sector.publicPlans[1] },
    { name: "Premium", detail: "Analytics + support + mises à jour", price: sector.publicPlans[2] },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.name} className="rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Abonnement</p>
          <h3 className="mt-1 text-lg font-black">{plan.name}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{plan.detail}</p>
          <p className="mt-4 text-2xl font-black tabular-nums text-slate-950">{eur(plan.price, " €/mois")}</p>
        </Card>
      ))}
    </div>
  );
}

function App() {
  const [quoteMeta, setQuoteMeta] = useState(DEFAULT_QUOTE_META);
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [properties, setProperties] = useState(() => normalizeProperties(DEFAULT_INPUTS));
  const [commercialTerms, setCommercialTerms] = useState(DEFAULT_COMMERCIAL_TERMS);
  const [selectedModuleIds, setSelectedModuleIds] = useState(DEFAULT_SELECTED_MODULE_IDS);
  const [customModulePrices, setCustomModulePrices] = useState(() => cloneCustomPrices());
  const [quotes, setQuotes] = useState([]);
  const [currentQuoteId, setCurrentQuoteId] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [presentationMode, setPresentationMode] = useState("internal");
  const [activeStep, setActiveStep] = useState("shooting");

  useEffect(() => {
    setQuotes(loadQuotes());
  }, []);

  const pricing = useMemo(
    () =>
      calculateQuote({
        ...inputs,
        ...commercialTerms,
        properties,
        selectedModuleIds,
        customModulePrices,
      }),
    [inputs, commercialTerms, properties, selectedModuleIds, customModulePrices],
  );

  const sector = pricing.sector;
  const SectorIcon = sector.icon;
  const isClientMode = presentationMode === "client";
  const fullSiteCount = properties.filter((property) =>
    FULL_SITE_MODULE_IDS.every((moduleId) => property.selectedModuleIds.includes(moduleId)),
  ).length;
  const allPropertiesUseFullSite = pricing.propertyCount > 0 && fullSiteCount === pricing.propertyCount;
  const hasFullSite = fullSiteCount > 0;
  const appOfferLabel = allPropertiesUseFullSite ? "Site immersif" : hasFullSite ? "App / site" : "App web";
  const appOfferDetail = allPropertiesUseFullSite
    ? `${fullSiteCount} site${fullSiteCount > 1 ? "s" : ""} complet${fullSiteCount > 1 ? "s" : ""}`
    : hasFullSite
      ? `${fullSiteCount} site complet · ${pricing.webAppCount - fullSiteCount} app`
      : `${pricing.webAppCount} overlay${pricing.webAppCount > 1 ? "s" : ""}`;
  const activeStepMeta = WORKFLOW_STEPS.find((step) => step.id === activeStep) || WORKFLOW_STEPS[0];
  const isEditorStep = EDITOR_STEPS.includes(activeStep);

  const quoteSnapshot = useMemo(() => {
    const existing = currentQuoteId ? quotes.find((quote) => quote.id === currentQuoteId) : null;
    const now = new Date().toISOString();
    const quoteName = quoteMeta.quoteName.trim() || buildDefaultQuoteName(quoteMeta, pricing);

    return {
      id: currentQuoteId || "preview",
      quoteName,
      client: {
        name: quoteMeta.clientName.trim(),
        establishmentName: quoteMeta.establishmentName.trim(),
        email: quoteMeta.clientEmail.trim(),
        phone: quoteMeta.clientPhone.trim(),
      },
      sectorLabel: sector.label,
      status: quoteMeta.status,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      inputs: {
        ...inputs,
        ...commercialTerms,
        properties,
        selectedModuleIds,
        customModulePrices,
      },
      pricing: serializePricing(pricing),
      notes: {
        clientComments: quoteMeta.clientComments,
        internalNotes: quoteMeta.internalNotes,
      },
    };
  }, [currentQuoteId, quotes, quoteMeta, sector.label, inputs, commercialTerms, properties, selectedModuleIds, customModulePrices, pricing]);

  const updateInput = (key, value) => {
    setInputs((previous) => ({ ...previous, [key]: value }));
    setSavedAt(null);
  };

  const updateTerms = (nextTerms) => {
    setCommercialTerms(nextTerms);
    setSavedAt(null);
  };

  const updateProperty = (propertyId, patch) => {
    setProperties((previous) =>
      previous.map((property) => (property.id === propertyId ? { ...property, ...patch } : property)),
    );
    setSavedAt(null);
  };

  const addProperty = () => {
    setProperties((previous) => [...previous, createNewProperty(previous.length + 1)]);
    setSavedAt(null);
  };

  const duplicateProperty = (propertyId) => {
    setProperties((previous) => {
      const source = previous.find((property) => property.id === propertyId);
      if (!source) return previous;
      return [
        ...previous,
        {
          ...cloneValue(source),
          id: createPropertyId(),
          name: `${source.name} copie`,
        },
      ];
    });
    setSavedAt(null);
  };

  const deleteProperty = (propertyId) => {
    setProperties((previous) => (previous.length <= 1 ? previous : previous.filter((property) => property.id !== propertyId)));
    setSavedAt(null);
  };

  const togglePropertyModule = (propertyId, moduleId) => {
    setProperties((previous) =>
      previous.map((property) => {
        if (property.id !== propertyId) return property;
        const selectedModuleIds = property.selectedModuleIds.includes(moduleId)
          ? property.selectedModuleIds.filter((id) => id !== moduleId)
          : [...property.selectedModuleIds, moduleId];
        return { ...property, selectedModuleIds };
      }),
    );
    setSavedAt(null);
  };

  const applyPropertyPreset = (propertyId, moduleIds, scope = "full") => {
    setProperties((previous) =>
      previous.map((property) =>
        property.id === propertyId
          ? { ...property, selectedModuleIds: mergeScopedModules(property.selectedModuleIds, moduleIds, scope) }
          : property,
      ),
    );
    setSavedAt(null);
  };

  const applyPresetToAllProperties = (moduleIds, scope = "full") => {
    setProperties((previous) =>
      previous.map((property) => ({
        ...property,
        selectedModuleIds: mergeScopedModules(property.selectedModuleIds, moduleIds, scope),
      })),
    );
    setSavedAt(null);
  };

  const updatePropertyCustomPrice = (propertyId, moduleId, key, value) => {
    setProperties((previous) =>
      previous.map((property) => {
        if (property.id !== propertyId) return property;
        return {
          ...property,
          customModulePrices: {
            ...(property.customModulePrices || {}),
            [moduleId]: {
              ...(property.customModulePrices?.[moduleId] || {}),
              [key]: value,
            },
          },
        };
      }),
    );
    setSavedAt(null);
  };

  const toggleModule = (moduleId) => {
    setSelectedModuleIds((previous) => {
      if (previous.includes(moduleId)) return previous.filter((id) => id !== moduleId);
      return [...previous, moduleId];
    });
    setSavedAt(null);
  };

  const applyPreset = (presetIndex) => {
    const preset = PLAN_PRESETS[presetIndex];
    setSelectedModuleIds((previous) => {
      const withoutSubscription = previous.filter((id) => !SUBSCRIPTION_MODULE_IDS.includes(id));
      return [...new Set([...withoutSubscription, ...preset.moduleIds])];
    });
    setSavedAt(null);
  };

  const updateCustomPrice = (moduleId, key, value) => {
    setCustomModulePrices((previous) => ({
      ...previous,
      [moduleId]: {
        ...(previous[moduleId] || {}),
        [key]: value,
      },
    }));
    setSavedAt(null);
  };

  const reset = () => {
    setQuoteMeta(DEFAULT_QUOTE_META);
    setInputs(DEFAULT_INPUTS);
    setProperties(normalizeProperties(DEFAULT_INPUTS));
    setCommercialTerms(DEFAULT_COMMERCIAL_TERMS);
    setSelectedModuleIds(DEFAULT_SELECTED_MODULE_IDS);
    setCustomModulePrices(cloneCustomPrices());
    setCurrentQuoteId(null);
    setActiveStep("shooting");
    setSavedAt(null);
  };

  const saveQuote = () => {
    const id = currentQuoteId || createQuoteId();
    const now = new Date().toISOString();
    const existing = currentQuoteId ? quotes.find((quote) => quote.id === currentQuoteId) : null;
    const quote = {
      ...quoteSnapshot,
      id,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    const nextQuotes = upsertQuote(quotes, quote);
    setQuotes(nextQuotes);
    persistQuotes(nextQuotes);
    setCurrentQuoteId(id);
    setSavedAt(now);
    if (!quoteMeta.quoteName.trim()) {
      setQuoteMeta((previous) => ({ ...previous, quoteName: quote.quoteName }));
    }
  };

  const openQuote = (quote) => {
    setCurrentQuoteId(quote.id);
    setQuoteMeta({
      quoteName: quote.quoteName || "",
      clientName: quote.client?.name || "",
      establishmentName: quote.client?.establishmentName || "",
      clientEmail: quote.client?.email || "",
      clientPhone: quote.client?.phone || "",
      status: quote.status || "brouillon",
      clientComments: quote.notes?.clientComments || "",
      internalNotes: quote.notes?.internalNotes || "",
    });
    setInputs({
      sectorKey: quote.inputs?.sectorKey || DEFAULT_INPUTS.sectorKey,
      surfaceInterior: quote.inputs?.surfaceInterior ?? DEFAULT_INPUTS.surfaceInterior,
      surfaceExterior: quote.inputs?.surfaceExterior ?? DEFAULT_INPUTS.surfaceExterior,
      manualPoints: quote.inputs?.manualPoints ?? DEFAULT_INPUTS.manualPoints,
      pointsExterior: quote.inputs?.pointsExterior ?? DEFAULT_INPUTS.pointsExterior,
    });
    setProperties(normalizeProperties(quote.inputs || DEFAULT_INPUTS));
    setCommercialTerms({
      discountType: quote.inputs?.discountType || DEFAULT_COMMERCIAL_TERMS.discountType,
      discountPercent: quote.inputs?.discountPercent ?? DEFAULT_COMMERCIAL_TERMS.discountPercent,
      discountFixed: quote.inputs?.discountFixed ?? DEFAULT_COMMERCIAL_TERMS.discountFixed,
      marginMode: quote.inputs?.marginMode || DEFAULT_COMMERCIAL_TERMS.marginMode,
    });
    setSelectedModuleIds(Array.isArray(quote.inputs?.selectedModuleIds) ? quote.inputs.selectedModuleIds : DEFAULT_SELECTED_MODULE_IDS);
    setCustomModulePrices(cloneCustomPrices(quote.inputs?.customModulePrices || DEFAULT_CUSTOM_MODULE_PRICES));
    setSavedAt(quote.updatedAt);
  };

  const deleteQuote = (quoteId) => {
    const quote = quotes.find((item) => item.id === quoteId);
    if (!quote) return;
    const nextQuotes = removeQuote(quotes, quoteId);
    setQuotes(nextQuotes);
    persistQuotes(nextQuotes);
    if (currentQuoteId === quoteId) reset();
  };

  const copySummary = async () => {
    const summary = createPlainTextSummary(quoteSnapshot);
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      console.log(summary);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1720px] space-y-5 p-3 lg:p-5">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-2xl bg-emerald-700 p-3 text-white shadow-sm">
                <Calculator size={26} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">Prodecta simulateur</p>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">Simulateur de devis</h1>
                <p className="mt-1 max-w-3xl text-sm font-medium text-slate-500">
                  Une lecture en 3 blocs : shooting, app web, abonnement. Pensé pour présenter proprement l’offre en rendez-vous.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setPresentationMode("internal")}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition ${
                    !isClientMode ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <EyeOff size={15} /> Interne
                </button>
                <button
                  type="button"
                  onClick={() => setPresentationMode("client")}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition ${
                    isClientMode ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Eye size={15} /> RDV client
                </button>
              </div>
              <button
                type="button"
                onClick={copySummary}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5"
              >
                <ClipboardList size={16} /> Copier récap
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <RotateCcw size={16} /> Nouveau devis
              </button>
            </div>
          </div>
        </motion.header>

        <nav className="sticky top-2 z-20 rounded-[22px] border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur">
          <div className="grid gap-2 md:grid-cols-4">
            {WORKFLOW_STEPS.map((step) => {
              const Icon = step.icon;
              const active = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm"
                      : "border-transparent bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className={`rounded-xl p-2 ${active ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-400"}`}>
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-[0.18em] opacity-60">{step.eyebrow}</span>
                    <span className="block truncate text-sm font-black">{step.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard compact icon={Layers3} label="Biens" value={String(pricing.propertyCount)} detail={`${pricing.virtualVisitCount} visites`} />
          <StatCard compact icon={MapPinned} label="Shooting" value={eur(pricing.segments.shooting.setupPublic)} detail={`${pricing.points} pts ext. affichés`} />
          <StatCard compact icon={Sparkles} label={appOfferLabel} value={eur(pricing.segments.app.setupPublic)} detail={appOfferDetail} tone="slate" />
          <StatCard compact icon={Euro} label="Abonnement" value={eur(pricing.segments.subscription.monthlyPublic, " €/mois")} detail={`${pricing.trackingCount} dashboard`} />
          {isClientMode ? (
            <StatCard compact icon={Calculator} label="Démarrage" value={eur(pricing.startupTotalHT)} detail={eur(pricing.monthlyFinalHT, " €/mois")} tone="emerald" />
          ) : (
            <StatCard compact icon={Percent} label="Remise" value={pct(pricing.discount.appliedDiscountPct)} detail={eur(pricing.discount.appliedDiscountEuro)} tone="amber" />
          )}
        </section>

        <section aria-labelledby="overview-title">
          <Card className="overflow-hidden rounded-[22px] border-slate-200 bg-white p-0 shadow-sm">
            <div className="border-t-4 border-emerald-700 p-5 lg:p-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">{activeStepMeta.eyebrow} / {activeStepMeta.label}</p>
                  <h2 id="overview-title" className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                    {activeStepMeta.title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-slate-500">
                    {activeStepMeta.description}
                  </p>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <SegmentTile label="Shooting" value={eur(pricing.segments.shooting.setupPublic)} detail="Captation + extérieurs" />
                    <SegmentTile label={appOfferLabel} value={eur(pricing.segments.app.setupPublic)} detail={allPropertiesUseFullSite ? "Site principal immersif complet" : "Overlay + modules sélectionnés"} />
                    <SegmentTile label="Mensuel" value={eur(pricing.segments.subscription.monthlyPublic, " €/mois")} detail="Hébergement, stats, support" />
                  </div>
                </div>

                <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-bold text-slate-500">Création</span>
                      <span className="text-xl font-black tabular-nums text-slate-950">{eur(pricing.setupFinalHT)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-bold text-slate-500">Mensuel</span>
                      <span className="text-xl font-black tabular-nums text-slate-950">{eur(pricing.monthlyFinalHT, " €/mois")}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-black text-emerald-800">Total de démarrage</span>
                        <span className="text-2xl font-black tabular-nums text-emerald-800">{eur(pricing.startupTotalHT)}</span>
                      </div>
                    </div>
                    {!isClientMode && (
                      <div className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-500">
                        Marge création : <span className="font-black text-slate-950">{eur(pricing.floorDelta)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {activeStep === "shooting" && (
          <section className="space-y-3" aria-labelledby="settings-title">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Paramètres du projet</p>
              <h2 id="settings-title" className="text-2xl font-black">Réglages de base</h2>
            </div>
            <div className="grid gap-3 xl:grid-cols-[minmax(320px,0.9fr)_minmax(320px,1fr)]">
              <QuoteForm
                compact
                isClientMode={isClientMode}
                quoteMeta={quoteMeta}
                onChange={(nextMeta) => {
                  setQuoteMeta(nextMeta);
                  setSavedAt(null);
                }}
              />

              <Card className="rounded-2xl p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Secteur</p>
                    <h2 className="text-base font-black">Établissement</h2>
                  </div>
                  <div className="rounded-2xl bg-emerald-700 p-2.5 text-white">
                    <SectorIcon size={18} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-2">
                  {Object.entries(SECTORS).map(([key, item]) => {
                    const Icon = item.icon;
                    const active = key === inputs.sectorKey;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updateInput("sectorKey", key)}
                        className={`flex min-h-[44px] items-center gap-2 rounded-2xl border px-3 py-2 text-left transition ${
                          active
                            ? "border-emerald-500 bg-emerald-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
                        }`}
                      >
                        <span className={active ? "text-emerald-700" : "text-slate-400"}>
                          <Icon size={15} />
                        </span>
                        <span className="min-w-0 truncate text-xs font-black">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 rounded-2xl bg-slate-50 p-2.5 text-xs font-semibold leading-relaxed text-slate-500">{sector.note}</p>
              </Card>
            </div>
          </section>
        )}

        {isEditorStep && (
          <section className="space-y-3" aria-labelledby="properties-title">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Configuration détaillée</p>
              <h2 id="properties-title" className="text-2xl font-black">{activeStepMeta.title}</h2>
            </div>
            <PropertiesManager
              isClientMode={isClientMode}
              mode={activeStep}
              properties={properties}
              propertyQuotes={pricing.propertyQuotes}
              onAddProperty={addProperty}
              onDuplicateProperty={duplicateProperty}
              onDeleteProperty={deleteProperty}
              onUpdateProperty={updateProperty}
              onTogglePropertyModule={togglePropertyModule}
              onApplyPropertyPreset={applyPropertyPreset}
              onApplyPresetToAll={applyPresetToAllProperties}
              onCustomPriceChange={updatePropertyCustomPrice}
            />
          </section>
        )}

        {activeStep === "subscription" && <SubscriptionPlanCards sector={sector} />}

        {activeStep === "app" && (
          <section className="space-y-3" aria-labelledby="modules-title">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Options complémentaires</p>
              <h2 id="modules-title" className="text-2xl font-black">Premium & cas particuliers</h2>
            </div>
            <ModuleSelector
              isClientMode={isClientMode}
              showPresets={false}
              title="Modules hors bien"
              eyebrow="Compléments"
              catalogModules={pricing.globalCatalogModules}
              selectedModuleIds={selectedModuleIds}
              customModulePrices={customModulePrices}
              onToggleModule={toggleModule}
              onCustomPriceChange={updateCustomPrice}
              onApplyPreset={applyPreset}
            />
          </section>
        )}

        {activeStep === "quote" && !isClientMode && (
          <section className="space-y-3" aria-labelledby="control-title">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Détail & contrôle interne</p>
              <h2 id="control-title" className="text-2xl font-black">Pilotage commercial</h2>
            </div>
            <div className="grid gap-3 xl:grid-cols-[360px_minmax(0,1fr)]">
              <CommercialTerms compact terms={commercialTerms} pricing={pricing} onChange={updateTerms} />
              <PricingBreakdown compact pricing={pricing} />
            </div>
          </section>
        )}

        {activeStep === "quote" && (
          <section className="space-y-3 pb-8" aria-labelledby="quote-title">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Devis & exports</p>
              <h2 id="quote-title" className="text-2xl font-black">Sauvegarder et présenter</h2>
            </div>
            <div className="grid gap-3 xl:grid-cols-[minmax(360px,0.75fr)_minmax(0,1.25fr)]">
              <div className="space-y-3">
                <QuoteSummary
                  compact
                  isClientMode={isClientMode}
                  quote={quoteSnapshot}
                  pricing={pricing}
                  currentQuoteId={currentQuoteId}
                  onSave={saveQuote}
                  onCopy={copySummary}
                  onExportPdf={() => exportQuotePdf(quoteSnapshot, { clientMode: isClientMode })}
                  onExportJson={() => exportQuoteJson(quoteSnapshot)}
                  onExportCsv={() => exportQuoteCsv(quoteSnapshot)}
                />
                {savedAt && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                    Devis sauvegardé.
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <QuoteLibrary compact quotes={quotes} currentQuoteId={currentQuoteId} onOpen={openQuote} onDelete={deleteQuote} />
                {!isClientMode && (
                  <Card className="rounded-2xl p-4 shadow-sm">
                    <div className="flex gap-3">
                      <MapPinned className="mt-1 shrink-0 text-emerald-700" size={18} />
                      <p className="text-xs font-semibold leading-relaxed text-slate-500">
                        Export JSON/CSV prêt pour une ressaisie Qonto ou une future API, sans intégration automatique.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
