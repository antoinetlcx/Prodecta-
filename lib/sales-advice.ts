import type { Sector } from "./schemas";
import type { CommercialMeeting, GmailThreadSummary, SalesProspect } from "./types";

export type SalesAdviceInput = {
  prospect?: Partial<SalesProspect>;
  sector?: Sector;
  objection?: string;
  meeting?: Partial<CommercialMeeting>;
  lastEmail?: Partial<GmailThreadSummary>;
  now?: string;
};

export type SalesAdvice = {
  id: string;
  priority: "haute" | "moyenne" | "basse";
  title: string;
  insight: string;
  action: string;
  cta: "Preparer" | "Relancer" | "Creer tache" | "Creer brouillon" | "Voir prospect";
  template: string;
};

function daysBetween(from?: string, to = new Date()) {
  if (!from) return Number.POSITIVE_INFINITY;
  const date = new Date(from);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  return Math.floor((to.getTime() - date.getTime()) / 86_400_000);
}

function isTomorrow(value?: string, now = new Date()) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}

function normalize(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function sectorAdvice(sector?: Sector) {
  if (sector === "salle_sport") {
    return "Mets l'accent sur la conversion abonnement, l'essai avant visite et la differenciation locale.";
  }
  if (sector === "hotel" || sector === "gite") {
    return "Mets l'accent sur la projection client, la rassurance et la reservation directe.";
  }
  if (sector === "chateau_domaine" || sector === "salle_evenementielle") {
    return "Mets l'accent sur les mariages, espaces evenementiels, visites des salons et dashboard analytics.";
  }
  if (sector === "restaurant") {
    return "Mets l'accent sur l'ambiance, les espaces privatisables et le passage a la reservation.";
  }
  return "Relie toujours Prodecta a un enjeu commercial concret : projection, qualification, conversion.";
}

function sectorTitle(sector?: Sector) {
  if (sector === "salle_sport") return "Angle salle de sport";
  if (sector === "hotel" || sector === "gite") return "Angle hotel / gite";
  if (sector === "chateau_domaine" || sector === "salle_evenementielle") return "Angle chateau / evenementiel";
  if (sector === "restaurant") return "Angle restaurant";
  return "Angle sectoriel Prodecta";
}

function prospectLabel(prospect?: Partial<SalesProspect>) {
  return prospect?.company || prospect?.name || "ce prospect";
}

export function buildFollowupTemplate(prospect?: Partial<SalesProspect>) {
  const target = prospectLabel(prospect);
  return `Bonjour,\n\nJe reviens vers vous au sujet de ${target}. Pour avancer simplement, je vous propose de choisir entre deux options : une version essentielle centree sur l'impact commercial, et une version plus complete.\n\nLe plus utile serait de se bloquer 20 minutes pour valider le bon perimetre et la prochaine etape.\n\nBien a vous`;
}

export function buildSalesAdvice(input: SalesAdviceInput): SalesAdvice[] {
  const now = new Date(input.now ?? Date.now());
  const prospect = input.prospect;
  const sector = input.sector ?? prospect?.sector;
  const text = normalize(`${input.objection ?? ""} ${input.lastEmail?.snippet ?? ""}`);
  const advice: SalesAdvice[] = [];
  const target = prospectLabel(prospect);
  const lastContactAge = daysBetween(prospect?.lastContactAt, now);
  const hot = ["chaud", "proposition"].includes(String(prospect?.pipelineStatus ?? ""));
  const hasNextAction = Boolean(prospect?.nextAction?.trim());

  if (hot && lastContactAge > 3) {
    advice.push({
      id: "hot-followup",
      priority: "haute",
      title: "Prospect chaud a relancer",
      insight: `${target} est chaud et le dernier contact date de plus de 3 jours.`,
      action: "Relancer avec une prochaine etape claire et deux options de perimetre.",
      cta: "Creer brouillon",
      template: buildFollowupTemplate(prospect)
    });
  }

  if (!hasNextAction) {
    advice.push({
      id: "missing-next-step",
      priority: "haute",
      title: "Danger : opportunite sans next step",
      insight: "Un deal sans next step devient vite une relance froide.",
      action: "Creer une tache datee ou proposer deux creneaux de retour.",
      cta: "Creer tache",
      template: `Creer une tache : definir la prochaine action avec ${target}.`
    });
  }

  if (isTomorrow(input.meeting?.start, now)) {
    advice.push({
      id: "meeting-prep",
      priority: "moyenne",
      title: "RDV a preparer",
      insight: `Un RDV avec ${input.meeting?.prospectName || target} arrive demain.`,
      action: "Preparer 5 questions d'impact, le contexte et le closing attendu.",
      cta: "Preparer",
      template: "Avant le RDV : besoin, impact business, decideur, budget, prochaine etape."
    });
  }

  if (/prix|cher|budget|tarif|devis|pas d argent/.test(text)) {
    advice.push({
      id: "price-objection",
      priority: "haute",
      title: "Objection prix detectee",
      insight: "Le sujet prix cache souvent un manque de valeur percue, de ROI ou de priorite.",
      action: "Comparer le cout du projet au cout d'opportunite, puis proposer deux perimetres.",
      cta: "Relancer",
      template:
        "Je comprends. Pour etre juste, comparons le cout du projet avec ce que le manque de projection vous coute aujourd'hui. On peut ensuite choisir entre une version essentielle et une version complete."
    });
  }

  if (/reflechis|reflechir|je reviens|on verra|plus tard/.test(text)) {
    advice.push({
      id: "thinking-objection",
      priority: "moyenne",
      title: "Relance douce a cadrer",
      insight: "Le prospect repousse sans critere clair.",
      action: "Demander ce qui doit etre clarifie : budget, rendu, timing ou decision interne.",
      cta: "Creer brouillon",
      template:
        "Bien sur. Pour que votre reflexion soit simple, qu'est-ce qui doit etre clarifie en priorite : budget, rendu, timing ou decision interne ?"
    });
  }

  advice.push({
      id: "sector-angle",
      priority: advice.length ? "basse" : "moyenne",
      title: sectorTitle(sector),
    insight: sectorAdvice(sector),
    action: "Adapter la preparation, le brouillon et la prochaine action a ce levier.",
    cta: "Voir prospect",
    template: sectorAdvice(sector)
  });

  return advice;
}

export function summarizeDashboardAdvice(items: SalesAdvice[]) {
  const high = items.filter((item) => item.priority === "haute");
  if (high.length) return high[0];
  return items[0];
}
