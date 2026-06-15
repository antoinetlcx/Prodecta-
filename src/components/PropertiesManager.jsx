import { Copy, Home, Plus, Trash2 } from "lucide-react";
import { PROPERTY_PRESETS } from "../data/pricingConfig.js";
import { eur } from "../lib/formatters.js";
import { Card, NumberField, TextField, Toggle } from "./ui.jsx";

const PRIMARY_MODULES = [
  ["interior-capture", "Visite"],
  ["matterport-space", "Matterport"],
  ["web-app-immersive", "App web"],
  ["analytics-dashboard", "Tracking"],
  ["hosting-maintenance", "Hébergement"],
];

function findLine(propertyQuote, moduleId) {
  return propertyQuote.selectedModules.find((module) => module.moduleId === moduleId);
}

function moduleTotal(propertyQuote, moduleId, kind) {
  return findLine(propertyQuote, moduleId)?.[kind] || 0;
}

function ModuleToggle({ label, moduleId, property, propertyQuote, onToggle }) {
  const selected = property.selectedModuleIds.includes(moduleId);
  const setup = moduleTotal(propertyQuote, moduleId, "setupPublic");
  const monthly = moduleTotal(propertyQuote, moduleId, "monthlyPublic");

  return (
    <div className={`rounded-2xl border p-3 ${selected ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-slate-800">{label}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-500">
            {selected ? `${eur(setup)} · ${eur(monthly, " €/mois")}` : "Non inclus"}
          </p>
        </div>
        <Toggle checked={selected} onChange={() => onToggle(property.id, moduleId)} label={`${selected ? "Retirer" : "Ajouter"} ${label}`} />
      </div>
    </div>
  );
}

export function PropertiesManager({
  properties,
  propertyQuotes,
  isClientMode = false,
  onAddProperty,
  onDuplicateProperty,
  onDeleteProperty,
  onUpdateProperty,
  onTogglePropertyModule,
  onApplyPropertyPreset,
  onApplyPresetToAll,
  onCustomPriceChange,
}) {
  return (
    <Card className="overflow-hidden rounded-2xl p-0 shadow-sm">
      <div className="border-b border-slate-100 bg-white p-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Biens / espaces</p>
            <h2 className="text-xl font-black tracking-tight">Biens du client</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Chaque bien garde sa surface, ses modules et son abonnement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isClientMode &&
              PROPERTY_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => onApplyPresetToAll(preset.moduleIds)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
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
          const matterport = findLine(propertyQuote, "matterport-space");
          const app = findLine(propertyQuote, "web-app-immersive");
          const tracking = findLine(propertyQuote, "analytics-dashboard");
          const visit = findLine(propertyQuote, "interior-capture");
          const visitCustom = property.customModulePrices?.["interior-capture"] || {};

          return (
            <details key={property.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white" open={index === 0}>
              <summary className="cursor-pointer list-none border-l-4 border-emerald-600 px-4 py-3">
                <div className="grid gap-3 lg:grid-cols-[minmax(180px,1.1fr)_120px_120px_120px_120px_120px_120px_120px] lg:items-center">
                  <div className="flex items-center gap-3">
                    <span className="rounded-2xl bg-emerald-50 p-2 text-emerald-700">
                      <Home size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{property.name}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {propertyQuote.intSurface} m² intérieur · {propertyQuote.points} pts ext.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-black text-slate-500">Visite {visit ? "oui" : "non"}</p>
                  <p className="text-xs font-black text-slate-500">Matterport {matterport ? "oui" : "non"}</p>
                  <p className="text-xs font-black text-slate-500">App {app ? "oui" : "non"}</p>
                  <p className="text-xs font-black text-slate-500">Tracking {tracking ? "oui" : "non"}</p>
                  <p className="text-right text-sm font-black tabular-nums text-slate-950">{eur(propertyQuote.setupPublicSubtotal)}</p>
                  <p className="text-right text-sm font-black tabular-nums text-slate-950">{eur(propertyQuote.monthlyPublicSubtotal, " €/mois")}</p>
                  <p className="text-right text-xs font-black uppercase tracking-wide text-emerald-700">Détails</p>
                </div>
              </summary>

              <div className="space-y-4 border-t border-slate-100 bg-slate-50 p-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(120px,0.6fr))_auto] lg:items-end">
                  <TextField
                    dense
                    label="Nom du bien"
                    value={property.name}
                    onChange={(value) => onUpdateProperty(property.id, { name: value })}
                    placeholder={`Bien ${index + 1}`}
                  />
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
                  <NumberField
                    dense
                    label="Points ext."
                    unit="pts"
                    value={property.pointsExterior}
                    onChange={(value) => onUpdateProperty(property.id, { pointsExterior: value, manualPoints: true })}
                    hint={property.manualPoints ? "manuel" : `auto ${propertyQuote.estimatedPoints}`}
                  />
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
                  {PROPERTY_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => onApplyPropertyPreset(property.id, preset.moduleIds)}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                  {PRIMARY_MODULES.map(([moduleId, label]) => (
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

                {visit && (
                  <div className={`grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 ${isClientMode ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
                    <NumberField
                      dense
                      label="Prix visite"
                      unit="€"
                      step={50}
                      value={visitCustom.setupPublic ?? visit.unitSetupPublic}
                      onChange={(value) => onCustomPriceChange(property.id, "interior-capture", "setupPublic", value)}
                    />
                    {!isClientMode && (
                      <NumberField
                        dense
                        label="Prix minimum visite"
                        unit="€"
                        step={50}
                        value={visitCustom.setupMinimum ?? visit.unitSetupMinimum}
                        onChange={(value) => onCustomPriceChange(property.id, "interior-capture", "setupMinimum", value)}
                      />
                    )}
                  </div>
                )}

                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {propertyQuote.catalogModules
                    .filter((module) => !PRIMARY_MODULES.some(([moduleId]) => moduleId === module.id))
                    .map((module) => (
                      <ModuleToggle
                        key={module.id}
                        label={module.label}
                        moduleId={module.id}
                        property={property}
                        propertyQuote={propertyQuote}
                        onToggle={onTogglePropertyModule}
                      />
                    ))}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </Card>
  );
}
