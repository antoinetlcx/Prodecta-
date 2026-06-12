import { Percent } from "lucide-react";
import { eur, pct, clampNumber } from "../lib/formatters.js";
import { Card, InlineWarning, NumberField, SelectField } from "./ui.jsx";

export function CommercialTerms({ terms, pricing, onChange, compact = false }) {
  const update = (key, value) => onChange({ ...terms, [key]: value });
  const requestedDiscount =
    terms.discountType === "fixed" ? eur(clampNumber(terms.discountFixed)) : pct(clampNumber(terms.discountPercent));

  if (compact) {
    return (
      <Card className="rounded-2xl p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Percent size={17} className="text-emerald-700" />
          <h2 className="text-base font-black">Conditions</h2>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <SelectField dense label="Remise" value={terms.discountType} onChange={(value) => update("discountType", value)}>
              <option value="percent">Pourcentage</option>
              <option value="fixed">Montant fixe</option>
            </SelectField>
            <SelectField dense label="Marge" value={terms.marginMode} onChange={(value) => update("marginMode", value)}>
              <option value="safe">Sécurisé</option>
              <option value="force">Forcé</option>
            </SelectField>
          </div>

          {terms.discountType === "percent" ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-black text-slate-700">Remise demandée</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-950 shadow-sm">{requestedDiscount}</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={terms.discountPercent}
                onChange={(event) => update("discountPercent", event.target.value)}
                className="w-full accent-emerald-600"
              />
              <div className="mt-1 flex justify-between gap-2 text-[11px] font-bold text-slate-400">
                <span>0%</span>
                <span>Max {pct(pricing.discount.maxDiscountPct)}</span>
                <span>60%</span>
              </div>
            </div>
          ) : (
            <NumberField dense label="Remise fixe" unit="€" step={50} value={terms.discountFixed} onChange={(value) => update("discountFixed", value)} />
          )}

          {(pricing.discount.isCapped || (pricing.isBelowFloor && terms.marginMode === "force")) && (
            <InlineWarning tone={pricing.isBelowFloor && terms.marginMode === "force" ? "red" : "amber"}>
              {pricing.isBelowFloor && terms.marginMode === "force"
                ? `Sous le plancher de ${eur(Math.abs(pricing.floorDelta))}.`
                : `Remise plafonnée à ${pct(pricing.discount.appliedDiscountPct)}.`}
            </InlineWarning>
          )}

        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Percent size={20} className="text-emerald-700" />
        <h2 className="text-xl font-black">Conditions commerciales</h2>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Type de remise" value={terms.discountType} onChange={(value) => update("discountType", value)}>
            <option value="percent">Pourcentage</option>
            <option value="fixed">Montant fixe</option>
          </SelectField>
          <SelectField label="Marge" value={terms.marginMode} onChange={(value) => update("marginMode", value)}>
            <option value="safe">Mode sécurisé</option>
            <option value="force">Mode forcé</option>
          </SelectField>
        </div>

        {terms.discountType === "percent" ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black text-slate-700">Remise demandée</span>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-950 shadow-sm">{requestedDiscount}</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={terms.discountPercent}
              onChange={(event) => update("discountPercent", event.target.value)}
              className="w-full accent-emerald-600"
            />
            <div className="mt-3 flex justify-between gap-3 text-xs font-bold text-slate-400">
              <span>0%</span>
              <span>Max conseillé : {pct(pricing.discount.maxDiscountPct)}</span>
              <span>60%</span>
            </div>
          </div>
        ) : (
          <NumberField label="Remise fixe" unit="€" step={50} value={terms.discountFixed} onChange={(value) => update("discountFixed", value)} />
        )}

        {pricing.discount.isCapped && (
          <InlineWarning>
            La remise demandée dépasse le plancher. Le simulateur applique automatiquement {pct(pricing.discount.appliedDiscountPct)}.
          </InlineWarning>
        )}
        {pricing.isBelowFloor && terms.marginMode === "force" && (
          <InlineWarning tone="red">
            Cette proposition passe sous le prix plancher de {eur(Math.abs(pricing.floorDelta))}.
          </InlineWarning>
        )}

      </div>
    </Card>
  );
}
