import { ClipboardList } from "lucide-react";
import { Card, SelectField, TextArea, TextField } from "./ui.jsx";

export function QuoteForm({ quoteMeta, onChange, compact = false, isClientMode = false }) {
  const update = (key, value) => onChange({ ...quoteMeta, [key]: value });

  if (compact) {
    return (
      <Card className="rounded-2xl p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList size={17} className="text-emerald-700" />
          <h2 className="text-base font-black">Fiche devis</h2>
        </div>
        <div className="space-y-3">
          <TextField dense label="Nom du devis" value={quoteMeta.quoteName} onChange={(value) => update("quoteName", value)} placeholder="Offre client" />
          <div className="grid grid-cols-2 gap-2">
            <TextField dense label="Client" value={quoteMeta.clientName} onChange={(value) => update("clientName", value)} placeholder="Contact" />
            <TextField dense label="Établissement" value={quoteMeta.establishmentName} onChange={(value) => update("establishmentName", value)} placeholder="Lieu" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextField dense label="Email" type="email" value={quoteMeta.clientEmail} onChange={(value) => update("clientEmail", value)} placeholder="email" />
            <TextField dense label="Téléphone" type="tel" value={quoteMeta.clientPhone} onChange={(value) => update("clientPhone", value)} placeholder="tel" />
          </div>
          <SelectField dense label="Statut" value={quoteMeta.status} onChange={(value) => update("status", value)}>
            <option value="brouillon">Brouillon</option>
            <option value="envoyé">Envoyé</option>
            <option value="accepté">Accepté</option>
            <option value="refusé">Refusé</option>
          </SelectField>
          <details className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-slate-500">Commentaires</summary>
            <div className="mt-3 space-y-2">
              <TextArea dense label="Commentaires devis" value={quoteMeta.clientComments} onChange={(value) => update("clientComments", value)} placeholder="Visible dans l’export." rows={2} />
              {!isClientMode && (
                <TextArea dense label="Notes internes" value={quoteMeta.internalNotes} onChange={(value) => update("internalNotes", value)} placeholder="Contexte commercial." rows={2} />
              )}
            </div>
          </details>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList size={20} className="text-emerald-700" />
        <h2 className="text-xl font-black">Fiche devis</h2>
      </div>
      <div className="space-y-4">
        <TextField label="Nom du devis" value={quoteMeta.quoteName} onChange={(value) => update("quoteName", value)} placeholder="Ex. Hôtel Boréal - offre Croissance" />
        <TextField label="Client / prospect" value={quoteMeta.clientName} onChange={(value) => update("clientName", value)} placeholder="Nom du contact" />
        <TextField label="Établissement" value={quoteMeta.establishmentName} onChange={(value) => update("establishmentName", value)} placeholder="Nom du lieu" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
          <TextField label="Email" type="email" value={quoteMeta.clientEmail} onChange={(value) => update("clientEmail", value)} placeholder="client@email.fr" />
          <TextField label="Téléphone" type="tel" value={quoteMeta.clientPhone} onChange={(value) => update("clientPhone", value)} placeholder="06..." />
        </div>
        <SelectField label="Statut" value={quoteMeta.status} onChange={(value) => update("status", value)}>
          <option value="brouillon">Brouillon</option>
          <option value="envoyé">Envoyé</option>
          <option value="accepté">Accepté</option>
          <option value="refusé">Refusé</option>
        </SelectField>
        <TextArea label="Commentaires devis" value={quoteMeta.clientComments} onChange={(value) => update("clientComments", value)} placeholder="Conditions, périmètre ou message visible dans l’export." rows={3} />
        {!isClientMode && (
          <TextArea label="Notes internes" value={quoteMeta.internalNotes} onChange={(value) => update("internalNotes", value)} placeholder="Contexte commercial, prochaine action..." rows={3} />
        )}
      </div>
    </Card>
  );
}
