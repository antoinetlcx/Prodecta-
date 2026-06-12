import { ClipboardList, Download, FileJson, FileSpreadsheet, FileText, Save } from "lucide-react";
import { eur } from "../lib/formatters.js";
import { Card } from "./ui.jsx";

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`text-sm ${strong ? "font-black text-slate-900" : "font-semibold text-slate-500"}`}>{label}</span>
      <span className={`whitespace-nowrap text-right tabular-nums ${strong ? "text-xl font-black text-slate-950" : "font-black text-slate-900"}`}>
        {value}
      </span>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, primary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 ${
        primary ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}

export function QuoteSummary({
  quote,
  pricing,
  currentQuoteId,
  onSave,
  onCopy,
  onExportPdf,
  onExportJson,
  onExportCsv,
  compact = false,
  isClientMode = false,
}) {
  return (
    <Card className={`${compact ? "rounded-2xl p-4 shadow-sm" : "2xl:sticky 2xl:top-6"}`}>
      <div className={`${compact ? "-m-4 mb-4 rounded-t-2xl p-4" : "-m-5 mb-5 rounded-t-2xl p-5"} border-b border-slate-200 bg-slate-950 text-white`}>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">Résumé devis</p>
        <h2 className={`${compact ? "mt-1 text-lg" : "mt-1 text-2xl"} break-words font-black`}>{quote.quoteName}</h2>
        <p className="mt-2 text-sm font-semibold text-white/80">
          {quote.client.establishmentName || pricing.sector.label} · {quote.status}
        </p>
      </div>

      <div className={compact ? "space-y-3" : "space-y-4"}>
        <div className={`${compact ? "rounded-2xl p-3" : "rounded-2xl p-4"} bg-slate-50`}>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Total de démarrage HT</p>
          <p className={`${compact ? "text-3xl" : "text-4xl"} mt-1 font-black tracking-tight text-slate-950`}>{eur(pricing.startupTotalHT)}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">Création + premier mois</p>
        </div>

        <div className={compact ? "space-y-2" : "space-y-3"}>
          <SummaryRow label="Frais de création" value={eur(pricing.setupPublicSubtotal)} />
          {!isClientMode && <SummaryRow label="Remise" value={`-${eur(pricing.discount.appliedDiscountEuro)}`} />}
          <SummaryRow label="Création finale HT" value={eur(pricing.setupFinalHT)} strong />
          <SummaryRow label="Abonnement mensuel HT" value={eur(pricing.monthlyFinalHT, " €/mois")} strong />
          <SummaryRow label="Total de démarrage HT" value={eur(pricing.startupTotalHT)} strong />
        </div>

        <div className={`${compact ? "rounded-2xl p-3" : "rounded-2xl p-4"} border border-slate-200 bg-white`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black text-slate-800">Modules sélectionnés</p>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
              {pricing.selectedModules.length}
            </span>
          </div>
          <div className="space-y-2 pr-1">
            {pricing.selectedModules.map((module) => (
              <div key={module.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold text-slate-600">{module.label}</span>
                <span className="whitespace-nowrap font-black text-slate-900">
                  {module.monthlyPublic > 0 ? eur(module.monthlyPublic, " €/mois") : eur(module.setupPublic)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <ActionButton icon={Save} label={currentQuoteId ? "Mettre à jour" : "Enregistrer"} onClick={onSave} primary />
          <div className="grid grid-cols-2 gap-2">
            <ActionButton icon={ClipboardList} label="Copier" onClick={onCopy} />
            <ActionButton icon={FileText} label="PDF" onClick={onExportPdf} />
            {!isClientMode && <ActionButton icon={FileJson} label="JSON" onClick={onExportJson} />}
            {!isClientMode && <ActionButton icon={FileSpreadsheet} label="CSV" onClick={onExportCsv} />}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-relaxed text-slate-500">
          <Download className="mr-1 inline text-emerald-700" size={14} />
          {isClientMode
            ? "Le PDF et le récapitulatif sont prêts pour une présentation client."
            : "Les exports JSON/CSV sont structurés pour une ressaisie propre ou une future connexion Qonto."}
        </div>
      </div>
    </Card>
  );
}
