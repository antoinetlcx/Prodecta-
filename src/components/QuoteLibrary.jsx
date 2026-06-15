import { useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { formatDate, eur } from "../lib/formatters.js";
import { Card } from "./ui.jsx";

const statusClasses = {
  brouillon: "bg-slate-100 text-slate-600",
  envoyé: "bg-sky-50 text-sky-700",
  accepté: "bg-emerald-50 text-emerald-700",
  refusé: "bg-red-50 text-red-700",
};

export function QuoteLibrary({ quotes, currentQuoteId, onOpen, onDelete, compact = false }) {
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  return (
    <Card className={compact ? "rounded-2xl p-4 shadow-sm" : ""}>
      <div className={`${compact ? "mb-3" : "mb-4"} flex items-center justify-between gap-3`}>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">localStorage</p>
          <h2 className={compact ? "text-base font-black" : "text-xl font-black"}>Devis sauvegardés</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{quotes.length}</span>
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
          Aucun devis enregistré pour le moment.
        </div>
      ) : (
        <div className={`${compact ? "space-y-2" : "space-y-3"} pr-1`}>
          {quotes.map((quote) => {
            const active = quote.id === currentQuoteId;
            const deleting = quote.id === pendingDeleteId;
            return (
              <div
                key={quote.id}
                className={`rounded-2xl border ${compact ? "p-2.5" : "p-3"} transition ${active ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => onOpen(quote)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className={active ? "text-emerald-700" : "text-slate-400"} />
                      <p className="truncate font-black text-slate-900">{quote.quoteName}</p>
                    </div>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                      {quote.client.establishmentName || quote.client.name || "Client non renseigné"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusClasses[quote.status] || statusClasses.brouillon}`}>
                        {quote.status}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">{formatDate(quote.updatedAt)}</span>
                      <span className="text-[11px] font-black text-emerald-700">
                        {eur(quote.pricing.startupTotalHT ?? (quote.pricing.setupFinalHT || 0) + (quote.pricing.monthlyFinalHT || 0))}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(deleting ? null : quote.id)}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Supprimer ${quote.quoteName}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {deleting && (
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(null)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-500"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(quote.id);
                        setPendingDeleteId(null);
                      }}
                      className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-black text-white"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
