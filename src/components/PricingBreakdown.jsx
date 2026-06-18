import { Info } from "lucide-react";
import { eur, pct } from "../lib/formatters.js";
import { Card } from "./ui.jsx";

const SEGMENTS = [
  {
    key: "shooting",
    label: "01. Shooting",
    detail: "Captation intérieure, points de vue extérieurs et production de la visite.",
  },
  {
    key: "app",
    label: "02. App web / overlay",
    detail: "Création de l’interface immersive et modules de conversion.",
  },
  {
    key: "subscription",
    label: "03. Abonnement",
    detail: "Hébergement, Matterport, analytics, support et mises à jour.",
  },
];

function SegmentTable({ pricing, segment }) {
  const data = pricing.segments?.[segment.key] || { lineItems: [], setupPublic: 0, monthlyPublic: 0 };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 md:flex-row md:items-center">
        <div>
          <h3 className="text-sm font-black text-slate-950">{segment.label}</h3>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">{segment.detail}</p>
        </div>
        <div className="flex gap-2 text-right">
          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Création</p>
            <p className="text-sm font-black tabular-nums text-slate-950">{eur(data.setupPublic)}</p>
          </div>
          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Mensuel</p>
            <p className="text-sm font-black tabular-nums text-slate-950">{eur(data.monthlyPublic, " €/mois")}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Bien</th>
              <th className="px-4 py-3 text-right">Qté</th>
              <th className="px-4 py-3 text-right">Création</th>
              <th className="px-4 py-3 text-right">Mensuel</th>
              <th className="px-4 py-3 text-right">Plancher</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.lineItems.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-sm font-bold text-slate-400" colSpan={6}>
                  Aucun module sélectionné dans cette section.
                </td>
              </tr>
            ) : (
              data.lineItems.map((module) => (
                <tr key={module.id}>
                  <td className="px-4 py-3 font-bold text-slate-700">{module.label}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-400">{module.propertyName || "Client"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-700">{module.quantity || 1}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-black tabular-nums">{eur(module.setupPublic)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-700">{eur(module.monthlyPublic, " €/mois")}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-500">{eur(module.setupMinimum)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function PricingBreakdown({ pricing, compact = false }) {
  return (
    <div className={`grid gap-4 ${compact ? "2xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]" : "2xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]"}`}>
      <Card className={compact ? "rounded-2xl p-4 shadow-sm" : ""}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className={compact ? "text-lg font-black" : "text-xl font-black"}>Décomposition par blocs</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{pricing.propertyCount} biens</span>
        </div>
        <div className="space-y-3">
          {SEGMENTS.map((segment) => (
            <SegmentTable key={segment.key} pricing={pricing} segment={segment} />
          ))}
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
                Le devis est maintenant séparé en trois lectures : shooting, app web / overlay et abonnement. Cela permet de présenter un prix de création clair, puis un mensuel lisible sans mélanger les postes.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
