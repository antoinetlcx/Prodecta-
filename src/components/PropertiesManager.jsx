import { Copy, Home, Plus, Trash2 } from "lucide-react";
import { PROPERTY_PRESETS, WORKFLOW_MODULE_GROUPS } from "../data/pricingConfig.js";
import { eur } from "../lib/formatters.js";
import { Card, NumberField, TextField, Toggle } from "./ui.jsx";

const MODE_COPY = {
  shooting: {
    eyebrow: "01 / shooting",
    title: "Base de production",
    description: "Surfaces, captation intérieure et points de vue extérieurs. C’est la base du prix de shooting.",
  },
  app: {
    eyebrow: "02 / app web",
    title: "Application web / overlay",
    description: "Base app web à 600 €, puis options à cocher pour aller jusqu’au site immersif complet à 2 130 €.",
  },
  subscription: {
    eyebrow: "03 / abonnement",
    title: "Abonnement mensuel",
    description: "Hébergement, Matterport, dashboard analytics, support et mises à jour.",
  },
  all: {
    eyebrow: "Biens / espaces",
    title: "Biens du client",
    description: "Chaque bien garde sa surface, ses modules et son abonnement.",
  },
};

const MODE_MODULES = {
  shooting: [
    ["interior-capture", "Shooting intérieur"],
    ["exterior-capture", "Points extérieurs"],
  ],
  app: [
    ["web-app-immersive", "App web de base"],
    ["booking-module", "Vrai système de réservation"],
    ["seo-geo", "Référencement SEO / GEO"],
    ["custom-url", "URL personnalisée"],
    ["automation", "Automatisation"],
    ["conversion-popup", "Pop-up"],
    ["custom-map", "Carte personnalisée"],
  ],
  subscription: [
    ["hosting-maintenance", "Hébergement app web"],
    ["matterport-space", "Hébergement visite virtuelle"],
    ["analytics-dashboard", "Dashboard data"],
    ["monthly-updates-support", "Rapports + accompagnement"],
  ],
};

const SUBSCRIPTION_PLANS = [
  {
    name: "Essentiel",
    ids: ["hosting-maintenance", "matterport-space"],
    tone: "slate",
    hook: "La base pour garder l’expérience en ligne.",
    included: [
      "Hébergement de l’app web immersive",
      "Hébergement de la visite virtuelle Matterport",
      "Lien Prodecta accessible en ligne",
      "Maintenance technique essentielle",
      "Expérience consultable mobile, tablette et ordinateur",
    ],
    excluded: ["Dashboard comportemental avancé", "Domaine personnalisé", "Rapports mensuels"],
  },
  {
    name: "Croissance",
    ids: ["hosting-maintenance", "matterport-space", "analytics-dashboard"],
    tone: "emerald",
    hook: "Le meilleur plan pour piloter les performances.",
    included: [
      "Tout l’Essentiel",
      "Dashboard data comportementales complet",
      "Analyse des clics, parcours et zones d’intérêt",
      "Suivi des conversions et signaux commerciaux",
      "Photos 4K / contenus visuels inclus",
      "Mises à jour régulières incluses",
      "Re-shoot annuel du bien à -25 %",
    ],
    excluded: ["Domaine personnalisé", "Rapport mensuel business analyst"],
  },
  {
    name: "Premium",
    ids: ["hosting-maintenance", "matterport-space", "analytics-dashboard", "monthly-updates-support"],
    tone: "premium",
    hook: "Le plan conseil, data et optimisation continue.",
    included: [
      "Tout Croissance",
      "Domaine personnalisé inclus",
      "Rapport KPI mensuel ultra détaillé",
      "Analyse par business analyst professionnel",
      "Accompagnement stratégique conversion",
      "Optimisation continue de l’expérience",
      "Support prioritaire",
      "Re-shoot annuel du bien à -50 %",
      "Vidéo IA à tarif préférentiel : 100 € / vidéo",
    ],
    excluded: [],
  },
];

function idsForMode(mode) {
  if (mode === "all") {
    return [...WORKFLOW_MODULE_GROUPS.shooting, ...WORKFLOW_MODULE_GROUPS.app, ...WORKFLOW_MODULE_GROUPS.subscription];
  }

  return WORKFLOW_MODULE_GROUPS[mode] || [];
}

function findLine(propertyQuote, moduleId) {
  return propertyQuote.selectedModules.find((module) => module.moduleId === moduleId);
}

function findCatalog(propertyQuote, moduleId) {
  return propertyQuote.catalogModules.find((module) => module.id === moduleId);
}

function sumVisible(propertyQuote, mode, key) {
  const ids = idsForMode(mode);
  return propertyQuote.selectedModules
    .filter((module) => ids.includes(module.moduleId))
    .reduce((sum, module) => sum + (module[key] || 0), 0);
}

function visibleSelectedCount(propertyQuote, mode) {
  const ids = idsForMode(mode);
  return propertyQuote.selectedModules.filter((module) => ids.includes(module.moduleId)).length;
}

function getSubscriptionName(selectedModuleIds = []) {
  const hasHosting = selectedModuleIds.includes("hosting-maintenance");
  const hasAnalytics = selectedModuleIds.includes("analytics-dashboard");
  const hasSupport = selectedModuleIds.includes("monthly-updates-support");

  if (hasHosting && hasAnalytics && hasSupport) return "Premium";
  if (hasHosting && hasAnalytics) return "Croissance";
  if (hasHosting) return "Essentiel";
  return "Aucun abonnement";
}

function moduleDetail(moduleId, propertyQuote, selected, source) {
  if (!selected) {
    const setup = source?.setupPublic || 0;
    const monthly = source?.monthlyPublic || 0;
    const parts = [];
    if (setup > 0) parts.push(eur(setup));
    if (monthly > 0) parts.push(eur(monthly, " €/mois"));
    return parts.length ? `Option : ${parts.join(" · ")}` : "Non inclus";
  }

  const setup = source?.setupPublic || 0;
  const monthly = source?.monthlyPublic || 0;

  if (moduleId === "interior-capture") {
    return `${propertyQuote.intSurface} m² × ${propertyQuote.publicTier.coeff} €/m² = ${eur(setup)}`;
  }

  if (moduleId === "exterior-capture") {
    return `${propertyQuote.points} pts × ${eur(propertyQuote.unitPoint, " €/pt")} = ${eur(setup)}`;
  }

  if (moduleId === "web-app-immersive") {
    return `Socle obligatoire : ${eur(setup)}`;
  }

  if (moduleId === "matterport-space") {
    return "Inclus dans l’abonnement";
  }

  if (monthly > 0 && setup > 0) return `${eur(setup)} · ${eur(monthly, " €/mois")}`;
  if (monthly > 0) return eur(monthly, " €/mois");
  return eur(setup);
}

function subscriptionPlanPrice(propertyQuote, plan) {
  return plan.ids.reduce((total, moduleId) => total + (findCatalog(propertyQuote, moduleId)?.monthlyPublic || 0), 0);
}

function SubscriptionComparison({ propertyQuote, onApplyPlan }) {
  if (!propertyQuote) return null;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const price = subscriptionPlanPrice(propertyQuote, plan);
          const premium = plan.tone === "premium";
          const growth = plan.tone === "emerald";
          const cardClass = premium
            ? "border-amber-300 bg-slate-950 text-white shadow-lg shadow-slate-950/15"
            : growth
              ? "border-emerald-500 bg-emerald-700 text-white shadow-lg shadow-emerald-950/10"
              : "border-slate-700 bg-slate-900 text-white shadow-lg shadow-slate-950/10";
          const priceClass = premium ? "bg-amber-400 text-slate-950" : growth ? "bg-white text-emerald-900" : "bg-white text-slate-950";

          return (
            <div key={plan.name} className={`overflow-hidden rounded-[24px] border ${cardClass}`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">Abonnement</p>
                    <h3 className="mt-1 text-2xl font-black tracking-tight">{plan.name}</h3>
                    <p className="mt-2 min-h-[40px] text-sm font-semibold opacity-80">{plan.hook}</p>
                  </div>
                  {premium && (
                    <span className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-950">
                      conseil
                    </span>
                  )}
                </div>
                <div className={`mt-5 inline-flex rounded-2xl px-4 py-2 text-2xl font-black tabular-nums ${priceClass}`}>
                  {eur(price, " €/mois")}
                </div>
                <button
                  type="button"
                  onClick={() => onApplyPlan(plan.ids)}
                  className={`mt-4 w-full rounded-2xl px-4 py-2 text-sm font-black transition ${
                    premium ? "bg-amber-400 text-slate-950 hover:bg-amber-300" : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  Appliquer {plan.name}
                </button>
              </div>
              <div className="border-t border-white/15 bg-black/15 p-5">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] opacity-70">Inclus</p>
                <ul className="space-y-2">
                  {plan.included.map((item) => (
                    <li key={item} className="flex gap-2 text-sm font-semibold leading-snug">
                      <span className={premium ? "text-amber-300" : "text-emerald-200"}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {plan.excluded.length > 0 && (
                  <div className="mt-4 rounded-2xl bg-white/10 p-3">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-wide opacity-60">Non inclus</p>
                    <ul className="space-y-1">
                      {plan.excluded.map((item) => (
                        <li key={item} className="text-xs font-semibold opacity-70">– {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModuleToggle({ label, moduleId, property, propertyQuote, onToggle }) {
  const selected = property.selectedModuleIds.includes(moduleId);
  const line = findLine(propertyQuote, moduleId);
  const catalog = findCatalog(propertyQuote, moduleId);
  const source = selected ? line : catalog;
  const Icon = source?.icon || Home;
  const cardClass = selected
    ? "border-emerald-700 bg-emerald-900 text-white shadow-md shadow-emerald-950/10"
    : "border-slate-300 bg-slate-100 text-slate-900 hover:border-slate-400 hover:bg-white";
  const iconClass = selected ? "bg-white text-emerald-900" : "bg-white text-slate-600";
  const titleClass = selected ? "text-white" : "text-slate-900";
  const detailClass = selected ? "text-emerald-100" : "text-slate-600";

  return (
    <div className={`rounded-2xl border p-3 transition ${cardClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className={`mt-0.5 rounded-xl p-2 ${iconClass}`}>
            <Icon size={15} />
          </span>
          <div className="min-w-0">
            <p className={`truncate text-xs font-black ${titleClass}`}>{label}</p>
            <p className={`mt-1 text-[11px] font-bold leading-relaxed ${detailClass}`}>
              {moduleDetail(moduleId, propertyQuote, selected, source)}
            </p>
          </div>
        </div>
        <Toggle checked={selected} onChange={() => onToggle(property.id, moduleId)} label={`${selected ? "Retirer" : "Ajouter"} ${label}`} />
      </div>
    </div>
  );
}

function PriceOverrideField({ label, moduleId, property, propertyQuote, isClientMode, onCustomPriceChange }) {
  const line = findLine(propertyQuote, moduleId);
  if (!line || isClientMode) return null;

  const custom = property.customModulePrices?.[moduleId] || {};

  return (
    <div className="grid gap-2 rounded-2xl border border-slate-300 bg-white p-3 md:grid-cols-2">
      <NumberField
        dense
        label={`${label} public`}
        unit="€"
        step={50}
        value={custom.setupPublic ?? line.unitSetupPublic}
        onChange={(value) => onCustomPriceChange(property.id, moduleId, "setupPublic", value)}
      />
      <NumberField
        dense
        label={`${label} minimum`}
        unit="€"
        step={50}
        value={custom.setupMinimum ?? line.unitSetupMinimum}
        onChange={(value) => onCustomPriceChange(property.id, moduleId, "setupMinimum", value)}
      />
    </div>
  );
}

function AppPricingGuide({ propertyQuote, visibleSetup }) {
  const baseLine = findLine(propertyQuote, "web-app-immersive") || findCatalog(propertyQuote, "web-app-immersive");
  const basePrice = baseLine?.setupPublic || 600;
  const optionTotal = Math.max(0, visibleSetup - basePrice);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-wide text-emerald-300">Base obligatoire</p>
        <p className="mt-1 text-2xl font-black tabular-nums">{eur(basePrice)}</p>
        <p className="mt-1 text-xs font-bold text-slate-300">Avis Google, sections, points d’intérêt, menu, interface.</p>
      </div>
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-wide text-amber-700">Options cochées</p>
        <p className="mt-1 text-2xl font-black tabular-nums">{eur(optionTotal)}</p>
        <p className="mt-1 text-xs font-bold text-amber-800">Chaque option peut être activée ou retirée.</p>
      </div>
      <div className="rounded-2xl border border-emerald-700 bg-emerald-800 p-4 text-white shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-wide text-emerald-100">Site immersif complet</p>
        <p className="mt-1 text-2xl font-black tabular-nums">2 130 €</p>
        <p className="mt-1 text-xs font-bold text-emerald-100">Base 600 € + toutes options 1 530 €.</p>
      </div>
    </div>
  );
}

export function PropertiesManager({
  properties,
  propertyQuotes,
  isClientMode = false,
  mode = "all",
  onAddProperty,
  onDuplicateProperty,
  onDeleteProperty,
  onUpdateProperty,
  onTogglePropertyModule,
  onApplyPropertyPreset,
  onApplyPresetToAll,
  onCustomPriceChange,
}) {
  const copy = MODE_COPY[mode] || MODE_COPY.all;
  const moduleRows =
    mode === "all"
      ? [...MODE_MODULES.shooting, ...MODE_MODULES.app, ...MODE_MODULES.subscription]
      : MODE_MODULES[mode] || MODE_MODULES.shooting;
  const presets = PROPERTY_PRESETS.filter((preset) => preset.scope === mode || (mode === "all" && preset.scope === "full"));
  const showSurfaceFields = mode === "shooting" || mode === "all";

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-300 bg-white p-0 shadow-sm">
      <div className="border-b border-slate-800 bg-slate-950 p-4 text-white">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{copy.eyebrow}</p>
            <h2 className="text-xl font-black tracking-tight">{copy.title}</h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-300">{copy.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isClientMode &&
              presets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => onApplyPresetToAll(preset.moduleIds, preset.scope)}
                  className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:border-emerald-300 hover:bg-emerald-500/20"
                  title={preset.description}
                >
                  {preset.name} à tous
                </button>
              ))}
            <button
              type="button"
              onClick={onAddProperty}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-black text-emerald-950 transition hover:bg-emerald-400"
            >
              <Plus size={15} /> Ajouter un bien
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-slate-100 p-4">
        {mode === "subscription" && (
          <SubscriptionComparison
            propertyQuote={propertyQuotes[0]}
            onApplyPlan={(moduleIds) => onApplyPresetToAll(moduleIds, "subscription")}
          />
        )}

        {propertyQuotes.map((propertyQuote, index) => {
          const property = properties.find((item) => item.id === propertyQuote.property.id) || propertyQuote.property;
          const visibleSetup = sumVisible(propertyQuote, mode, "setupPublic");
          const visibleMonthly = sumVisible(propertyQuote, mode, "monthlyPublic");
          const activeCount = visibleSelectedCount(propertyQuote, mode);
          const displayPoints = property.manualPoints ? property.pointsExterior : propertyQuote.estimatedPoints;

          return (
            <details key={property.id} className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm" open={index === 0}>
              <summary className="cursor-pointer list-none border-l-4 border-emerald-700 bg-white px-4 py-3">
                <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_140px_140px_140px_110px] lg:items-center">
                  <div className="flex items-center gap-3">
                    <span className="rounded-2xl bg-emerald-700 p-2 text-white">
                      <Home size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{property.name}</p>
                      <p className="text-xs font-bold text-slate-600">
                        {mode === "subscription"
                          ? getSubscriptionName(property.selectedModuleIds)
                          : `${propertyQuote.intSurface} m² intérieur · ${propertyQuote.points} pts ext.`}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-black text-slate-700">{activeCount} modules actifs</p>
                  <p className="text-right text-sm font-black tabular-nums text-slate-950">{eur(visibleSetup)}</p>
                  <p className="text-right text-sm font-black tabular-nums text-slate-950">{eur(visibleMonthly, " €/mois")}</p>
                  <p className="text-right text-xs font-black uppercase tracking-wide text-emerald-700">Détails</p>
                </div>
              </summary>

              <div className="space-y-4 border-t border-slate-200 bg-slate-100 p-4">
                <div className={`grid gap-3 ${showSurfaceFields ? "lg:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(120px,0.6fr))_auto]" : "lg:grid-cols-[minmax(220px,1fr)_auto]"} lg:items-end`}>
                  <TextField
                    dense
                    label="Nom du bien"
                    value={property.name}
                    onChange={(value) => onUpdateProperty(property.id, { name: value })}
                    placeholder={`Bien ${index + 1}`}
                  />
                  {showSurfaceFields && (
                    <>
                      <NumberField
                        dense
                        label="Surface intérieure"
                        unit="m²"
                        value={property.surfaceInterior}
                        onChange={(value) => onUpdateProperty(property.id, { surfaceInterior: value })}
                      />
                      <NumberField
                        dense
                        label="Surface extérieure"
                        unit="m²"
                        value={property.surfaceExterior}
                        onChange={(value) => onUpdateProperty(property.id, { surfaceExterior: value })}
                      />
                      <div className="space-y-2">
                        <NumberField
                          dense
                          label="Points ext."
                          unit="pts"
                          value={displayPoints}
                          onChange={(value) => onUpdateProperty(property.id, { pointsExterior: value, manualPoints: true })}
                          hint={property.manualPoints ? "manuel" : `auto ${propertyQuote.estimatedPoints}`}
                        />
                        {property.manualPoints && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateProperty(property.id, {
                                manualPoints: false,
                                pointsExterior: propertyQuote.estimatedPoints,
                              })
                            }
                            className="w-full rounded-xl border border-emerald-700 bg-white px-2 py-1 text-[11px] font-black text-emerald-800 transition hover:bg-emerald-50"
                          >
                            Repasser en auto
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onDuplicateProperty(property.id)}
                      className="rounded-xl border border-slate-300 bg-white p-2 text-slate-600 transition hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                      aria-label={`Dupliquer ${property.name}`}
                    >
                      <Copy size={16} />
                    </button>
                    {properties.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteProperty(property.id)}
                        className="rounded-xl border border-slate-300 bg-white p-2 text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Supprimer ${property.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => onApplyPropertyPreset(property.id, preset.moduleIds, preset.scope)}
                      className="rounded-2xl border border-slate-400 bg-white px-3 py-2 text-xs font-black text-slate-800 transition hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                {mode === "app" && <AppPricingGuide propertyQuote={propertyQuote} visibleSetup={visibleSetup} />}

                {mode === "shooting" && (
                  <div className="grid gap-3 rounded-2xl border border-emerald-700 bg-emerald-900 p-3 text-white md:grid-cols-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-emerald-200">Shooting intérieur</p>
                      <p className="mt-1 text-sm font-black">
                        {propertyQuote.intSurface} m² × {propertyQuote.publicTier.coeff} €/m²
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-emerald-200">Points extérieurs</p>
                      <p className="mt-1 text-sm font-black">
                        {propertyQuote.points} points × {eur(propertyQuote.unitPoint, " €/pt")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-emerald-200">Total shooting</p>
                      <p className="mt-1 text-sm font-black">{eur(visibleSetup)}</p>
                    </div>
                  </div>
                )}

                {mode === "subscription" && (
                  <div className="grid gap-3 rounded-2xl border border-slate-300 bg-white p-3 md:grid-cols-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Plan actif</p>
                      <p className="mt-1 text-sm font-black text-slate-950">{getSubscriptionName(property.selectedModuleIds)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Visite virtuelle</p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {property.selectedModuleIds.includes("matterport-space") ? "Hébergement inclus" : "Non inclus"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Mensuel du bien</p>
                      <p className="mt-1 text-sm font-black text-slate-950">{eur(visibleMonthly, " €/mois")}</p>
                    </div>
                  </div>
                )}

                <div className={`grid gap-3 ${mode === "subscription" ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3"}`}>
                  {moduleRows.map(([moduleId, label]) => (
                    <ModuleToggle
                      key={moduleId}
                      label={label}
                      moduleId={moduleId}
                      property={property}
                      propertyQuote={propertyQuote}
                      onToggle={onTogglePropertyModule}
                    />
                  ))}
                </div>

                {(mode === "shooting" || mode === "app") && (
                  <div className="grid gap-2 xl:grid-cols-2">
                    {mode === "shooting" && (
                      <>
                        <PriceOverrideField
                          label="Shooting intérieur"
                          moduleId="interior-capture"
                          property={property}
                          propertyQuote={propertyQuote}
                          isClientMode={isClientMode}
                          onCustomPriceChange={onCustomPriceChange}
                        />
                        <PriceOverrideField
                          label="Points extérieurs"
                          moduleId="exterior-capture"
                          property={property}
                          propertyQuote={propertyQuote}
                          isClientMode={isClientMode}
                          onCustomPriceChange={onCustomPriceChange}
                        />
                      </>
                    )}
                    {mode === "app" && (
                      <PriceOverrideField
                        label="App web"
                        moduleId="web-app-immersive"
                        property={property}
                        propertyQuote={propertyQuote}
                        isClientMode={isClientMode}
                        onCustomPriceChange={onCustomPriceChange}
                      />
                    )}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </Card>
  );
}
