import { Info } from "lucide-react";
import { eur, pct } from "../lib/formatters.js";
import { Card } from "./ui.jsx";

const SEGMENTS = [
  {
    key: "shooting",
    label: "01. Shooting",
    detail: "Captation intérieure, points de vue extérieurs et production de la visite.",
    tone: {
      section: "border-emerald-800",
      header: "bg-emerald-900 text-white",
      pill: "bg-white text-emerald-950",
      tableHead: "bg-emerald-50 text-emerald-900",
      accent: "text-emerald-700",
    },
  },
  {
    key: "app",
    label: "02. App web / overlay",
    detail: "Création de l’interface immersive et modules de conversion.",
    tone: {
      section: "border-slate-950",
      header: "bg-slate-950 text-white",
      pill: "bg-white text-slate-950",
      tableHead: "bg-slate-100 text-slate-800",
      accent: "text-slate-900",
    },
  },
  {
    key: "subscription",
    label: "03. Abonnement",
    detail: "Hébergement, dashboard, support et accompagnement mensuel.",
    tone: {
      section: "border-amber-400",
      header: "bg-amber-500 text-amber-950",
      pill: "bg-amber-950 text-white",
      tableHead: "bg-amber-50 text-amber-900",
      accent: "text-amber-800",
    },
  },
];

function SegmentTable({ pricing, segment }) {
  const data = pricing.segments?.[segment.key] || { lineItems: [], setupPublic: 0, monthlyPublic: 0 };
  const { tone } = segment;

  return (
    <section className={`overflow-hidden rounded-[24px] border-2 bg-white shadow-sm ${tone.section}`}>
      <div className={`flex flex-col justify-between gap-3 px-5 py-4 md:flex-row md:items-center ${tone.header}`}>
        <div>
          <h3 className="text-base font-black tracking-tight">{segment.label}</h3>
          <p className="mt-1 text-xs font-semibold opacity-80">{segment.detail}</p>
        </div>
        <div className="flex gap-2 text-right">
          <div className={`rounded-2xl px-4 py-2 shadow-sm ${tone.pill}`}>
            <p className="text-[10px] font-black uppercase tracking-wide opacity-60">Création</p>
            <p className="text-lg font-black tabular-nums">{eur(data.setupPublic)}</p>
          </div>
          <div className={`rounded-2xl px-4 py-2 shadow-sm ${tone.pill}`}>
            <p className="text-[10px] font-black uppercase tracking-wide opacity-60">Mensuel</p>
            <p className="text-lg font-black tabular-nums">{eur(data.monthlyPublic, " €/mois")}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className={`text-xs uppercase tracking-wide ${tone.tableHead}`}>
            <tr>
              <th className="px-5 py-3">Service</th>
              <th className="px-4 py-3">Bien</th>
              <th className="px-4 py-3 text-right">Qté</th>
              <th className="px-4 py-3 text-right">Création</th>
              <th className="px-4 py-3 text-right">Mensuel</th>
              <th className="px-5 py-3 text-right">Plancher</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.lineItems.length === 0 ? (
              <tr>
                <td className="px-5 py-5 text-sm font-bold text-slate-400" colSpan={6}>
                  Aucun module sélectionné dans cette section.
                </td>
              </tr>
            ) : (
              data.lineItems.map((module) => (
                <tr key={module.id} className="odd:bg-white even:bg-slate-50/70">
                  <td className="px-5 py-3 font-black text-slate-800">{module.label}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-500">{module.propertyName || "Client"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-700">{module.quantity || 1}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-black tabular-nums ${tone.accent}`}>{eur(module.setupPublic)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-black tabular-nums text-slate-800">{eur(module.monthlyPublic, " €/mois")}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-bold tabular-nums text-slate-500">{eur(module.setupMinimum)}</td>
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
    <div className={`grid gap-4 ${compact ? "2xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]" : "2xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]"}`}>
      <Card className={compact ? "rounded-2xl border-slate-300 p-4 shadow-sm" : "border-slate-300"}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className={compact ? "text-lg font-black" : "text-xl font-black"}>Décomposition par blocs</h2>
            <p className="mt-1 text-xs font-bold text-slate-500">Chaque bloc est isolé pour comprendre immédiatement ce qui coûte quoi.</p>
          </div>
          <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{pricing.propertyCount} biens</span>
        </div>
        <div className="space-y-4">
          {SEGMENTS.map((segment) => (
            <SegmentTable key={segment.key} pricing={pricing} segment={segment} />
          ))}
        </div>
      </Card>

      <Card className={compact ? "rounded-2xl border-slate-300 p-4 shadow-sm" : "border-slate-300"}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className={compact ? "text-lg font-black" : "text-xl font-black"}>Hypothèses</h2>
          <span className="rounded-full bg-emerald-900 px-3 py-1 text-xs font-black text-white">{pricing.publicTier.category}</span>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Biens</p>
              <p className="mt-1 text-lg font-black">{pricing.propertyCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-700 bg-emerald-900 p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-200">Apps web</p>
              <p className="mt-1 text-lg font-black">{pricing.webAppCount}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-300 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Visites</p>
              <p className="mt-1 text-lg font-black">{pricing.virtualVisitCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Mensuel</p>
              <p className="mt-1 text-lg font-black text-amber-950">{eur(pricing.monthlyFinalHT, " €/mois")}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-700 bg-emerald-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Remise maximale création</p>
            <p className="mt-1 text-lg font-black text-emerald-950">{pct(pricing.discount.maxDiscountPct)} · {eur(pricing.discount.maxDiscountEuro)}</p>
          </div>
          <div className={`${compact ? "hidden" : "block"} rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm font-medium leading-relaxed text-slate-600`}>
            <div className="flex gap-2">
              <Info className="mt-0.5 shrink-0 text-emerald-700" size={18} />
              <p>La synthèse distingue la création, les options d’app web et l’abonnement mensuel pour faciliter la lecture en rendez-vous.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
