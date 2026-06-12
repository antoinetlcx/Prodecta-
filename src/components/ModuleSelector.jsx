import { CheckCircle2 } from "lucide-react";
import { MODULE_CATEGORIES, PLAN_PRESETS, SUBSCRIPTION_MODULE_IDS } from "../data/pricingConfig.js";
import { eur } from "../lib/formatters.js";
import { Card, NumberField, Toggle } from "./ui.jsx";

function priceLabel(module) {
  const setup = module.setupPublic > 0 ? eur(module.setupPublic) : "0 €";
  const monthly = module.monthlyPublic > 0 ? eur(module.monthlyPublic, " €/mois") : "0 €/mois";
  return { setup, monthly };
}

function sameIds(a, b) {
  if (a.length !== b.length) return false;
  return a.every((id) => b.includes(id));
}

export function getActivePresetIndex(selectedModuleIds) {
  const selectedSubscriptionIds = selectedModuleIds.filter((id) => SUBSCRIPTION_MODULE_IDS.includes(id)).sort();
  return PLAN_PRESETS.findIndex((preset) => sameIds([...preset.moduleIds].sort(), selectedSubscriptionIds));
}

export function ModuleSelector({
  catalogModules,
  selectedModuleIds,
  customModulePrices,
  onToggleModule,
  onCustomPriceChange,
  onApplyPreset,
  isClientMode = false,
}) {
  const activePresetIndex = getActivePresetIndex(selectedModuleIds);

  return (
    <Card className="overflow-hidden rounded-2xl p-0 shadow-sm">
      <div className="border-b border-slate-100 bg-white/90 p-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Composition</p>
            <h2 className="text-xl font-black tracking-tight">Modules de l’offre</h2>
          </div>
          <div className="grid min-w-[260px] grid-cols-3 gap-2">
            {PLAN_PRESETS.map((preset, index) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => onApplyPreset(index)}
                className={`rounded-2xl border px-3 py-2 text-center text-xs font-black transition ${
                  activePresetIndex === index
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {MODULE_CATEGORIES.map((category) => {
          const modules = catalogModules.filter((module) => module.category === category);
          if (modules.length === 0) return null;

          return (
            <section key={category} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
                <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{category}</h3>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500 shadow-sm">
                  {modules.filter((module) => module.selected).length}/{modules.length}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {modules.map((module) => {
                  const Icon = module.icon;
                  const prices = priceLabel(module);
                  const custom = customModulePrices[module.id] || {};

                  return (
                    <div
                      key={module.id}
                      className={`transition ${module.selected ? "bg-emerald-50/55" : "bg-white hover:bg-slate-50/80"}`}
                    >
                      <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_112px_112px_54px] lg:items-center">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className={`rounded-2xl p-2 ${module.selected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                            <Icon size={16} />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-black leading-tight text-slate-950">{module.label}</p>
                              {module.recommended && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 shadow-sm">
                                  <CheckCircle2 size={11} /> reco
                                </span>
                              )}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500">{module.description}</p>
                            {module.futureReady && (
                              <p className="mt-2 text-[11px] font-semibold text-slate-400">{module.futureReady}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 lg:block">
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Création</p>
                            <p className="mt-0.5 text-sm font-black text-slate-950">{prices.setup}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2 lg:mt-0 lg:hidden">
                            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Mensuel</p>
                            <p className="mt-0.5 text-sm font-black text-slate-950">{prices.monthly}</p>
                          </div>
                        </div>

                        <div className="hidden rounded-2xl bg-white px-3 py-2 lg:block">
                          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Mensuel</p>
                          <p className="mt-0.5 text-sm font-black text-slate-950">{prices.monthly}</p>
                        </div>

                        <div className="flex items-center justify-end">
                          <Toggle
                            checked={module.selected}
                            onChange={() => onToggleModule(module.id)}
                            label={`${module.selected ? "Retirer" : "Ajouter"} ${module.label}`}
                          />
                        </div>
                      </div>

                      {module.customPricing && module.selected && (
                        <div className={`grid gap-2 border-t border-emerald-100 bg-white/70 p-3 ${isClientMode ? "md:grid-cols-2" : "md:grid-cols-4"}`}>
                          <NumberField
                            dense
                            label="Setup public"
                            unit="€"
                            step={50}
                            value={custom.setupPublic ?? module.setupPublic}
                            onChange={(value) => onCustomPriceChange(module.id, "setupPublic", value)}
                          />
                          <NumberField
                            dense
                            label="Mensuel public"
                            unit="€"
                            step={5}
                            value={custom.monthlyPublic ?? module.monthlyPublic}
                            onChange={(value) => onCustomPriceChange(module.id, "monthlyPublic", value)}
                          />
                          {!isClientMode && (
                            <>
                              <NumberField
                                dense
                                label="Setup plancher"
                                unit="€"
                                step={50}
                                value={custom.setupMinimum ?? module.setupMinimum}
                                onChange={(value) => onCustomPriceChange(module.id, "setupMinimum", value)}
                              />
                              <NumberField
                                dense
                                label="Mensuel plancher"
                                unit="€"
                                step={5}
                                value={custom.monthlyMinimum ?? module.monthlyMinimum}
                                onChange={(value) => onCustomPriceChange(module.id, "monthlyMinimum", value)}
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </Card>
  );
}
