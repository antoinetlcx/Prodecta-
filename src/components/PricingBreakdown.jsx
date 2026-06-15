import { Info } from "lucide-react";
import { eur, pct } from "../lib/formatters.js";
import { Card } from "./ui.jsx";

export function PricingBreakdown({ pricing, compact = false }) {
  return (
    <div className={`grid gap-4 ${compact ? "2xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]" : "2xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]"}`}>
      <Card className={compact ? "rounded-2xl p-4 shadow-sm" : ""}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className={compact ? "text-lg font-black" : "text-xl font-black"}>Décomposition des services</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{pricing.propertyCount} biens</span>
        </div>
        <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-slate-200">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Bien</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3 text-right">Qté</th>
                <th className="px-4 py-3 text-right">Création</th>
                <th className="px-4 py-3 text-right">Mensuel</th>
                <th className="px-4 py-3 text-right">Plancher création</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pricing.lineItems.map((module) => (
                <tr key={module.id}>
                  <td className="px-4 py-3 font-bold text-slate-700">{module.label}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-400">{module.propertyName || "Client"}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-400">{module.category}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-700">{module.quantity || 1}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-black tabular-nums">{eur(module.setupPublic)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-700">{eur(module.monthlyPublic, " €/mois")}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-500">{eur(module.setupMinimum)}</td>
                </tr>
              ))}
              <tr className="bg-slate-950 text-white">
                <td className="px-4 py-4 font-black">Total avant remise</td>
                <td className="px-4 py-4 text-xs font-bold text-slate-300">Client</td>
                <td className="px-4 py-4 text-xs font-bold text-slate-300">{pricing.lineItems.length} lignes</td>
                <td className="px-4 py-4 text-right text-xs font-bold text-slate-300">{pricing.selectedModules.reduce((sum, module) => sum + (module.quantity || 1), 0)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-right font-black tabular-nums">{eur(pricing.setupPublicSubtotal)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-right font-black tabular-nums">{eur(pricing.monthlyPublicSubtotal, " €/mois")}</td>
                <td className="whitespace-nowrap px-4 py-4 text-right font-black tabular-nums">{eur(pricing.setupMinimumSubtotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className={compact ? "rounded-2xl p-4 shadow-sm" : ""}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className={compact ? "text-lg font-black" : "text-xl font-black"}>Hypothèses</h2>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
            {pricing.publicTier.category}
          </span>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Biens</p>
              <p className="mt-1 text-lg font-black">{pricing.propertyCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Apps web</p>
              <p className="mt-1 text-lg font-black">{pricing.webAppCount}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Visites</p>
              <p className="mt-1 text-lg font-black">{pricing.virtualVisitCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Matterport</p>
              <p className="mt-1 text-lg font-black">{eur(pricing.matterportSpaces * 10, " €/mois")}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Remise maximale création</p>
            <p className="mt-1 text-lg font-black text-emerald-950">
              {pct(pricing.discount.maxDiscountPct)} · {eur(pricing.discount.maxDiscountEuro)}
            </p>
          </div>
          <div className={`${compact ? "hidden" : "block"} rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm font-medium leading-relaxed text-slate-600`}>
            <div className="flex gap-2">
              <Info className="mt-0.5 shrink-0 text-emerald-700" size={18} />
              <p>
                Les modules dynamiques reprennent la logique historique : surface intérieure, forfait secteur et points de vue extérieurs. Les modules fixes et récurrents sont isolés pour préparer remises, packs, variations par surface et future API.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
