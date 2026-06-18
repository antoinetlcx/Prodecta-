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
    description: "App web immersive seule ou ajoutée au-dessus d’une visite Matterport existante.",
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
    ["web-app-immersive", "App web / overlay"],
    ["quote-contact-module", "Formulaire / devis"],
    ["conversion-popup", "Pop-up conversion"],
    ["site-integration", "Intégration site"],
    ["booking-module", "Réservation"],
    ["automation", "Automatisation"],
  ],
  subscription: [
    ["hosting-maintenance", "Hébergement"],
    ["matterport-space", "Espace Matterport"],
    ["analytics-dashboard", "Dashboard analytics"],
    ["monthly-updates-support", "Support + MAJ"],
  ],
};

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
    return parts.length ? `Tarif si ajouté : ${parts.join(" · ")}` : "Non inclus";
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
    return `Forfait app web : ${eur(setup)}`;
  }

  if (monthly > 0 && setup > 0) return `${eur(setup)} · ${eur(monthly, " €/mois")}`;
  if (monthly > 0) return eur(monthly, " €/mois");
  return eur(setup);
}

function ModuleToggle({ label, moduleId, property, propertyQuote, onToggle }) {
  const selected = property.selectedModuleIds.includes(moduleId);
  const line = findLine(propertyQuote, moduleId);
  const catalog = findCatalog(propertyQuote, moduleId);
  const source = selected ? line : catalog;
  const Icon = source?.icon || Home;

  return (
    <div className={`rounded-2xl border p-3 ${selected ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className={`mt-0.5 rounded-xl p-2 ${selected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>
            <Icon size={15} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-slate-800">{label}</p>
            <p className="mt-1 text-[11px] font-bold leading-relaxed text-slate-500">
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
    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-2">
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
    <Card className="overflow-hidden rounded-2xl p-0 shadow-sm">
      <div className="border-b border-slate-100 bg-white p-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{copy.eyebrow}</p>
            <h2 className="text-xl font-black tracking-tight">{copy.title}</h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-500">{copy.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isClientMode &&
              presets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => onApplyPresetToAll(preset.moduleIds, preset.scope)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  title={preset.description}
                >
                  {preset.name} à tous
                </button>
              ))}
            <button
              type="button"
              onClick={onAddProperty}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800"
            >
              <Plus size={15} /> Ajouter un bien
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {propertyQuotes.map((propertyQuote, index) => {
          const property = properties.find((item) => item.id === propertyQuote.property.id) || propertyQuote.property;
          const visibleSetup = sumVisible(propertyQuote, mode, "setupPublic");
          const visibleMonthly = sumVisible(propertyQuote, mode, "monthlyPublic");
          const activeCount = visibleSelectedCount(propertyQuote, mode);
          const displayPoints = property.manualPoints ? property.pointsExterior : propertyQuote.estimatedPoints;

          return (
            <details key={property.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white" open={index === 0}>
              <summary className="cursor-pointer list-none border-l-4 border-emerald-600 px-4 py-3">
                <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_140px_140px_140px_110px] lg:items-center">
                  <div className="flex items-center gap-3">
                    <span className="rounded-2xl bg-emerald-50 p-2 text-emerald-700">
                      <Home size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{property.name}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {mode === "subscription"
                          ? getSubscriptionName(property.selectedModuleIds)
                          : `${propertyQuote.intSurface} m² intérieur · ${propertyQuote.points} pts ext.`}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-black text-slate-500">{activeCount} modules actifs</p>
                  <p className="text-right text-sm font-black tabular-nums text-slate-950">{eur(visibleSetup)}</p>
                  <p className="text-right text-sm font-black tabular-nums text-slate-950">{eur(visibleMonthly, " €/mois")}</p>
                  <p className="text-right text-xs font-black uppercase tracking-wide text-emerald-700">Détails</p>
                </div>
              </summary>

              <div className="space-y-4 border-t border-slate-100 bg-slate-50 p-4">
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
                            className="w-full rounded-xl border border-emerald-200 bg-white px-2 py-1 text-[11px] font-black text-emerald-700 transition hover:bg-emerald-50"
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
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                      aria-label={`Dupliquer ${property.name}`}
                    >
                      <Copy size={16} />
                    </button>
                    {properties.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteProperty(property.id)}
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
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
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                {mode === "shooting" && (
                  <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 md:grid-cols-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Shooting intérieur</p>
                      <p className="mt-1 text-sm font-black text-emerald-950">
                        {propertyQuote.intSurface} m² × {propertyQuote.publicTier.coeff} €/m²
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Points extérieurs</p>
                      <p className="mt-1 text-sm font-black text-emerald-950">
                        {propertyQuote.points} points × {eur(propertyQuote.unitPoint, " €/pt")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Total shooting</p>
                      <p className="mt-1 text-sm font-black text-emerald-950">{eur(visibleSetup)}</p>
                    </div>
                  </div>
                )}

                {mode === "subscription" && (
                  <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Plan actif</p>
                      <p className="mt-1 text-sm font-black text-slate-950">{getSubscriptionName(property.selectedModuleIds)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Matterport</p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {property.selectedModuleIds.includes("matterport-space") ? "Hébergé Prodecta" : "Non inclus / client externe"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Mensuel du bien</p>
                      <p className="mt-1 text-sm font-black text-slate-950">{eur(visibleMonthly, " €/mois")}</p>
                    </div>
                  </div>
                )}

                <div className={`grid gap-2 ${mode === "subscription" ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3"}`}>
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
