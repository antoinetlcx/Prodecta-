import type { Sector } from "./schemas";
import type {
  CommercialMeeting,
  CommercialTask,
  DailyPriorityItem,
  FollowupOpportunity,
  GmailThreadSummary,
  MeetingPreparation,
  SalesProspect,
  TaskSuggestion
} from "./types";

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

export const PRODECTA_SIGNATURE =
  "Je vous souhaite une excellente journee !\nPaul De Talancé, co-fondateur de Prodecta.";

const POSITIVE_SIGNALS = ["interesse", "interessee", "ok", "rdv", "devis", "tres interesse", "tres interessee"];
const BUDGET_SIGNALS = ["budget", "prix", "cher", "tarif", "devis"];
const DECISION_SIGNALS = ["associe", "decisionnaire", "validation", "valider"];

function normalize(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function normalizeSalesText(value = "") {
  return normalize(value);
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(value?: string, now = new Date()) {
  const date = parseDate(value);
  return Boolean(date && startOfDay(date).getTime() === startOfDay(now).getTime());
}

function isBeforeToday(value?: string, now = new Date()) {
  const date = parseDate(value);
  return Boolean(date && startOfDay(date).getTime() < startOfDay(now).getTime());
}

function isTodayOrPast(value?: string, now = new Date()) {
  const date = parseDate(value);
  return Boolean(date && startOfDay(date).getTime() <= startOfDay(now).getTime());
}

function isTomorrow(value?: string, now = new Date()) {
  const date = parseDate(value);
  return Boolean(date && startOfDay(date).getTime() === startOfDay(addDays(now, 1)).getTime());
}

function isThisWeek(value?: string, now = new Date()) {
  const date = parseDate(value);
  if (!date) return false;
  const today = startOfDay(now).getTime();
  const week = startOfDay(addDays(now, 7)).getTime();
  const target = startOfDay(date).getTime();
  return target >= today && target <= week;
}

function daysBetween(from?: string, to = new Date()) {
  const date = parseDate(from);
  if (!date) return Number.POSITIVE_INFINITY;
  return Math.floor((startOfDay(to).getTime() - startOfDay(date).getTime()) / 86_400_000);
}

function prospectLabel(prospect?: Partial<SalesProspect>) {
  return prospect?.company || prospect?.name || "ce prospect";
}

export function isPurchaseStatus(status?: string) {
  return normalize(status) === "purchase";
}

function prospectNotes(prospect?: Partial<SalesProspect>) {
  return `${prospect?.enrichedNotes ?? ""} ${prospect?.notes ?? ""} ${prospect?.need ?? ""}`;
}

function hasPositiveSignal(prospect?: Partial<SalesProspect>) {
  const text = normalize(prospectNotes(prospect));
  return POSITIVE_SIGNALS.some((signal) => text.includes(signal));
}

function sectorAdvice(sector?: Sector) {
  if (sector === "salle_sport") {
    return "Mets l'accent sur la conversion abonnement, l'essai avant visite et la differenciation locale.";
  }
  if (sector === "hotel" || sector === "gite") {
    return "Mets l'accent sur la projection client, la rassurance et la reservation directe.";
  }
  if (sector === "chateau_domaine" || sector === "salle_evenementielle") {
    return "Mets l'accent sur les mariages, les espaces evenementiels, les visites des salons et le dashboard analytics.";
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

export function scoreProspectPriority(prospect: Partial<SalesProspect>, nowValue?: string) {
  const now = new Date(nowValue ?? Date.now());
  const status = prospect.pipelineStatusRaw || prospect.pipelineStatus;
  const purchase = Boolean(prospect.isPurchase ?? isPurchaseStatus(status));
  const nextDate = prospect.nextActionDate || prospect.followupDate;
  const lastContactAge = daysBetween(prospect.lastContactAt, now);
  const reasons: string[] = [];
  let score = 15;

  if (purchase) {
    score += 35;
    reasons.push("Statut pipeline Purchase");
  }

  if (purchase && nextDate && isTodayOrPast(nextDate, now)) {
    score += 35;
    reasons.push(isBeforeToday(nextDate, now) ? "Date prochaine action en retard" : "Date prochaine action aujourd'hui");
  }

  if (purchase && !prospect.nextAction?.trim()) {
    score += 35;
    reasons.push("Purchase sans prochaine action");
  }

  if (lastContactAge > 7 && lastContactAge !== Number.POSITIVE_INFINITY) {
    score += 25;
    reasons.push(`Dernier contact il y a ${lastContactAge} jours`);
  }

  if (hasPositiveSignal(prospect)) {
    score += 20;
    reasons.push("Notes enrichies avec signal positif");
  }

  if (!reasons.length) {
    reasons.push("Informations a qualifier");
  }

  const priorityScore = Math.min(score, 100);
  const priorityLevel =
    priorityScore >= 85 ? "urgent" : priorityScore >= 65 ? "haute" : priorityScore >= 40 ? "moyenne" : "basse";

  return {
    isPurchase: purchase,
    priorityScore,
    priorityLevel,
    priorityReasons: reasons
  } satisfies Pick<SalesProspect, "isPurchase" | "priorityScore" | "priorityLevel" | "priorityReasons">;
}

export function enrichProspectPriority<T extends Partial<SalesProspect>>(prospect: T, now?: string): T & ReturnType<typeof scoreProspectPriority> {
  return {
    ...prospect,
    ...scoreProspectPriority(prospect, now)
  };
}

export function buildFollowupTemplate(
  prospect?: Partial<SalesProspect>,
  variant:
    | "douce"
    | "devis"
    | "post-rdv"
    | "absence"
    | "next-step"
    | "validation"
    | "visio"
    | "elements" = "next-step"
) {
  const target = prospectLabel(prospect);
  const firstLine = "Bonjour,";
  const context = {
    douce: `Je me permets de revenir vers vous concernant ${target}.`,
    devis: `Je reviens vers vous au sujet du devis Prodecta pour ${target}.`,
    "post-rdv": `Merci encore pour notre echange au sujet de ${target}.`,
    absence: `Je me permets une courte relance, car je n'ai pas eu votre retour concernant ${target}.`,
    "next-step": `Je reviens vers vous concernant ${target}.`,
    validation: `Je voulais vous aider a simplifier la validation interne autour de ${target}.`,
    visio: `Je vous propose de valider la suite de facon simple pour ${target}.`,
    elements: `Je peux aussi vous renvoyer les elements les plus utiles pour avancer sur ${target}.`
  }[variant];
  const ask = {
    douce: "Est-ce que le sujet est toujours d'actualite de votre cote ?",
    devis: "Est-ce que vous preferez que l'on valide ensemble le perimetre essentiel ou la version complete ?",
    "post-rdv": "Le plus utile serait de bloquer 20 minutes pour confirmer la prochaine etape.",
    absence: "Est-ce que vous preferez que je vous propose deux creneaux précis cette semaine ?",
    "next-step": "Est-ce que vous preferez que l'on se cale un court echange cette semaine pour valider la suite ?",
    validation: "Est-ce qu'un court recap avec les points de valeur aiderait a decider plus vite ?",
    visio: "Je peux vous proposer deux creneaux cette semaine pour cadrer la suite.",
    elements: "Souhaitez-vous que je vous renvoie un recap court avec les elements de decision ?"
  }[variant];

  return `${firstLine}\n\n${context}\nDe notre cote, nous pouvons avancer rapidement sur le sujet prioritaire et clarifier le bon perimetre.\n\n${ask}\n\n${PRODECTA_SIGNATURE}`;
}

function recommendedFollowupVariant(prospect?: Partial<SalesProspect>, thread?: Partial<GmailThreadSummary>) {
  const text = normalize(`${prospectNotes(prospect)} ${thread?.snippet ?? ""} ${thread?.subject ?? ""}`);
  if (text.includes("devis")) return "devis";
  if (BUDGET_SIGNALS.some((signal) => text.includes(signal))) return "devis";
  if (DECISION_SIGNALS.some((signal) => text.includes(signal))) return "validation";
  if (thread?.commercialStatus === "en_attente_reponse") return "absence";
  return "next-step";
}

export function buildSalesAdvice(input: SalesAdviceInput): SalesAdvice[] {
  const now = new Date(input.now ?? Date.now());
  const prospect = input.prospect;
  const sector = input.sector ?? prospect?.sector;
  const text = normalize(`${input.objection ?? ""} ${input.lastEmail?.snippet ?? ""} ${prospectNotes(prospect)}`);
  const advice: SalesAdvice[] = [];
  const target = prospectLabel(prospect);
  const scored = prospect ? scoreProspectPriority(prospect, input.now) : null;
  const lastContactAge = daysBetween(prospect?.lastContactAt, now);
  const purchase = Boolean(scored?.isPurchase);
  const hasNextAction = Boolean(prospect?.nextAction?.trim());

  if (purchase && scored?.priorityLevel === "urgent") {
    advice.push({
      id: "purchase-priority",
      priority: "haute",
      title: "Purchase prioritaire",
      insight: `${target} est en Purchase avec un risque d'inertie commerciale.`,
      action: "Recreer un next step clair aujourd'hui.",
      cta: "Relancer",
      template: buildFollowupTemplate(prospect, "next-step")
    });
  }

  if (lastContactAge > 7 && lastContactAge !== Number.POSITIVE_INFINITY) {
    advice.push({
      id: "old-contact",
      priority: "haute",
      title: "Dernier contact ancien",
      insight: `${target} n'a pas ete touche depuis ${lastContactAge} jours.`,
      action: "Relance courte orientee avancement, sans rouvrir toute la discussion.",
      cta: "Creer brouillon",
      template: buildFollowupTemplate(prospect, recommendedFollowupVariant(prospect))
    });
  }

  if (!hasNextAction) {
    advice.push({
      id: "missing-next-step",
      priority: "haute",
      title: "Danger : opportunite sans next step",
      insight: "Un deal sans prochaine action devient vite une relance froide.",
      action: "Creer une tache datee ou proposer deux creneaux de retour.",
      cta: "Creer tache",
      template: `Creer une tache : definir la prochaine action avec ${target}.`
    });
  }

  if (isTomorrow(input.meeting?.start, now) || isSameDay(input.meeting?.start, now)) {
    advice.push({
      id: "meeting-prep",
      priority: "moyenne",
      title: "RDV a preparer",
      insight: `Un RDV avec ${input.meeting?.prospectName || target} arrive bientot.`,
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
      template: buildFollowupTemplate(prospect, "validation")
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

function priorityWeight(priority: DailyPriorityItem["priority"]) {
  return { urgent: 4, haute: 3, moyenne: 2, basse: 1 }[priority];
}

function ctaFromPriority(source: DailyPriorityItem["source"]): DailyPriorityItem["cta"] {
  if (source === "calendar") return "Preparer";
  if (source === "tasks") return "Voir prospect";
  if (source === "gmail") return "Creer brouillon";
  return "Relancer";
}

export function buildDailyPriorityItems(input: {
  prospects: SalesProspect[];
  meetings: CommercialMeeting[];
  tasks: CommercialTask[];
  threads: GmailThreadSummary[];
  now?: string;
}): DailyPriorityItem[] {
  const now = new Date(input.now ?? Date.now());
  const items: DailyPriorityItem[] = [];

  input.prospects.forEach((prospect) => {
    const scored = scoreProspectPriority(prospect, input.now);
    const nextDate = prospect.nextActionDate || prospect.followupDate;
    if (scored.isPurchase && (isTodayOrPast(nextDate, now) || !prospect.nextAction?.trim())) {
      items.push({
        id: `airtable-${prospect.id}`,
        source: "airtable",
        priority: scored.priorityLevel ?? "haute",
        title: prospect.company,
        detail: prospect.nextAction || "Aucune prochaine action definie",
        reason: scored.priorityReasons?.join(" + ") || "Purchase a traiter",
        action: !prospect.nextAction?.trim() ? "Definir un next step clair" : "Preparer la relance du jour",
        cta: "Relancer",
        prospectId: prospect.id
      });
    }
  });

  input.threads.forEach((thread) => {
    if (thread.needsReply || thread.commercialStatus === "en_attente_reponse") {
      items.push({
        id: `gmail-${thread.id}`,
        source: "gmail",
        priority: thread.needsReply ? "urgent" : "haute",
        title: thread.subject,
        detail: thread.snippet,
        reason: thread.needsReply ? "Mail entrant sans reponse" : "Mail envoye sans reponse",
        action: thread.needsReply ? "Repondre aujourd'hui" : "Creer une relance courte",
        cta: ctaFromPriority("gmail"),
        prospectId: thread.matchedProspectId,
        threadId: thread.id
      });
    }
  });

  input.meetings.forEach((meeting) => {
    if (isSameDay(meeting.start, now) || isTomorrow(meeting.start, now)) {
      items.push({
        id: `calendar-${meeting.id}`,
        source: "calendar",
        priority: isSameDay(meeting.start, now) ? "urgent" : "haute",
        title: meeting.title,
        detail: meeting.description || "RDV a preparer",
        reason: isSameDay(meeting.start, now) ? "RDV aujourd'hui" : "RDV demain",
        action: "Preparer questions, objections et next step",
        cta: "Preparer",
        prospectId: meeting.matchedProspectId,
        meetingId: meeting.id
      });
    }
  });

  input.tasks.forEach((task) => {
    if (task.status !== "completed" && (isBeforeToday(task.due, now) || isSameDay(task.due, now))) {
      items.push({
        id: `tasks-${task.id}`,
        source: "tasks",
        priority: isBeforeToday(task.due, now) ? "urgent" : "haute",
        title: task.title,
        detail: task.notes || task.prospectName || "Action commerciale",
        reason: isBeforeToday(task.due, now) ? "Tache en retard" : "Tache du jour",
        action: "Traiter ou cloturer la tache",
        cta: "Voir prospect",
        prospectId: task.matchedProspectId,
        taskId: task.id
      });
    }
  });

  return items.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
}

export function buildFollowupOpportunities(input: {
  prospects: SalesProspect[];
  threads: GmailThreadSummary[];
  tasks: CommercialTask[];
  meetings: CommercialMeeting[];
  now?: string;
}): FollowupOpportunity[] {
  const now = new Date(input.now ?? Date.now());
  const opportunities: FollowupOpportunity[] = [];

  input.prospects.forEach((prospect) => {
    const scored = scoreProspectPriority(prospect, input.now);
    const nextDate = prospect.nextActionDate || prospect.followupDate;
    if (scored.isPurchase || isTodayOrPast(nextDate, now) || daysBetween(prospect.lastContactAt, now) > 7) {
      const variant = recommendedFollowupVariant(prospect);
      opportunities.push({
        id: `airtable-${prospect.id}`,
        source: "airtable",
        priority: scored.priorityLevel ?? "moyenne",
        company: prospect.company,
        reason: scored.priorityReasons?.join(" + ") || "Prospect a relancer",
        context: prospect.enrichedNotes || prospect.notes || prospect.need || "Contexte a qualifier",
        lastInteraction: prospect.lastContactAt,
        nextAction: prospect.nextAction,
        recommendedAngle: variant === "devis" ? "Relancer devis et valeur" : "Recreer une prochaine etape",
        message: buildFollowupTemplate(prospect, variant),
        cta: "Creer brouillon Gmail",
        prospectId: prospect.id
      });
    }
  });

  input.threads.forEach((thread) => {
    if (thread.needsReply || thread.commercialStatus === "en_attente_reponse") {
      const prospect = input.prospects.find((item) => item.id === thread.matchedProspectId);
      const variant = recommendedFollowupVariant(prospect, thread);
      opportunities.push({
        id: `gmail-${thread.id}`,
        source: "gmail",
        priority: thread.needsReply ? "urgent" : "haute",
        company: prospect?.company || thread.prospectName || thread.subject,
        reason: thread.needsReply ? "Mail entrant a traiter" : "Mail envoye sans reponse",
        context: thread.snippet,
        lastInteraction: thread.lastMessageAt || thread.updatedAt,
        nextAction: prospect?.nextAction,
        recommendedAngle: thread.needsReply ? "Repondre utilement aujourd'hui" : "Relance courte avec deux creneaux",
        message: buildFollowupTemplate(prospect, variant),
        cta: thread.needsReply ? "Copier reponse" : "Creer brouillon Gmail",
        prospectId: prospect?.id,
        threadId: thread.id
      });
    }
  });

  input.meetings.forEach((meeting) => {
    if (isBeforeToday(meeting.end, now)) {
      opportunities.push({
        id: `calendar-${meeting.id}`,
        source: "calendar",
        priority: "moyenne",
        company: meeting.prospectName || meeting.title,
        reason: "Relance post-RDV a prevoir",
        context: meeting.description || "RDV passe",
        lastInteraction: meeting.end,
        recommendedAngle: "Envoyer recap et prochaine etape datee",
        message: buildFollowupTemplate({ company: meeting.prospectName || meeting.title }, "post-rdv"),
        cta: "Creer brouillon Gmail",
        prospectId: meeting.matchedProspectId,
        meetingId: meeting.id
      });
    }
  });

  return opportunities.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
}

export function buildTaskSuggestion(input: {
  prospect?: Partial<SalesProspect>;
  meeting?: Partial<CommercialMeeting>;
  thread?: Partial<GmailThreadSummary>;
  type?: "relance" | "preparation" | "devis" | "brouillon" | "appel" | "elements" | "verification" | "airtable";
  due?: string;
}): TaskSuggestion {
  const prospect = input.prospect;
  const company = prospectLabel(prospect || { company: input.meeting?.prospectName || input.thread?.prospectName });
  const type = input.type ?? "relance";
  const titles = {
    relance: `Relancer - ${company}`,
    preparation: `Preparer RDV - ${company}`,
    devis: `Envoyer devis - ${company}`,
    brouillon: `Creer brouillon Gmail - ${company}`,
    appel: `Appeler prospect - ${company}`,
    elements: `Envoyer elements complementaires - ${company}`,
    verification: `Verifier reponse - ${company}`,
    airtable: `Mettre a jour Airtable - ${company}`
  };
  const advice = buildSalesAdvice({ prospect }).at(0);

  return {
    id: crypto.randomUUID(),
    title: titles[type],
    due: input.due,
    source: input.meeting ? "calendar" : input.thread ? "gmail" : "airtable",
    prospectId: prospect?.id,
    meetingId: input.meeting?.id,
    threadId: input.thread?.id,
    notes: [
      `Statut pipeline: ${prospect?.pipelineStatusRaw || prospect?.pipelineStatus || "non renseigne"}`,
      `Prochaine action: ${prospect?.nextAction || "a definir"}`,
      `Notes enrichies: ${prospect?.enrichedNotes || prospect?.notes || "non renseigne"}`,
      prospect?.airtableUrl ? `Airtable: ${prospect.airtableUrl}` : "",
      `Conseil: ${advice?.action || "Clarifier la prochaine etape"}`
    ]
      .filter(Boolean)
      .join("\n")
  };
}

export function buildMeetingPreparation(input: {
  meeting?: Partial<CommercialMeeting>;
  prospect?: Partial<SalesProspect>;
  threads?: Partial<GmailThreadSummary>[];
}): MeetingPreparation {
  const prospect = input.prospect;
  const company = prospectLabel(prospect || { company: input.meeting?.prospectName || input.meeting?.title });
  const notes = prospect?.enrichedNotes || prospect?.notes || prospect?.need || "Contexte a qualifier dans les premieres minutes.";
  const emailSummary = input.threads?.length
    ? input.threads.slice(0, 3).map((thread) => `${thread.subject}: ${thread.snippet}`).join("\n")
    : "Aucun email lie charge.";
  const sector = prospect?.sector;
  const sectorQuestions = {
    salle_sport: [
      "Combien de prospects visitent votre site avant de venir sur place ?",
      "Votre site donne-t-il vraiment envie de venir s'inscrire ?",
      "Quels espaces ou machines font la difference chez vous ?",
      "Comment mesurez-vous la conversion digitale aujourd'hui ?"
    ],
    hotel: [
      "Qu'est-ce qui rassure le plus vos clients avant reservation ?",
      "Quels espaces sont les plus difficiles a valoriser en photo classique ?",
      "Votre objectif est-il plutot reservation directe, image premium ou reduction des questions repetitives ?"
    ],
    gite: [
      "Qu'est-ce qui rassure le plus vos clients avant reservation ?",
      "Quels espaces sont les plus difficiles a valoriser en photo classique ?",
      "Votre objectif est-il plutot reservation directe, image premium ou reduction des questions repetitives ?"
    ],
    chateau_domaine: [
      "Les clients ont-ils besoin de se projeter avant de visiter ?",
      "Quels espaces declenchent le plus souvent la decision ?",
      "Combien de visites physiques sont necessaires avant signature ?",
      "Une experience immersive pourrait-elle filtrer ou prequalifier les demandes ?"
    ],
    salle_evenementielle: [
      "Quels espaces declenchent le plus souvent la decision ?",
      "Combien de visites physiques sont necessaires avant signature ?",
      "Une experience immersive pourrait-elle filtrer ou prequalifier les demandes ?"
    ],
    restaurant: [
      "Quels espaces ou ambiances font vraiment venir les clients ?",
      "Avez-vous des demandes de privatisation a mieux qualifier ?",
      "Qu'est-ce qui manque aujourd'hui entre la visite digitale et la reservation ?"
    ],
    autre: []
  } satisfies Record<Sector, string[]>;
  const universalQuestions = [
    "Qu'est-ce qui vous a donne envie d'echanger avec nous ?",
    "Aujourd'hui, votre principal enjeu commercial c'est plutot visibilite, conversion ou differenciation ?",
    "Comment vos prospects decouvrent-ils votre etablissement aujourd'hui ?",
    "Qu'est-ce qui bloque le plus souvent avant qu'un prospect reserve ou demande un devis ?",
    "Quel serait pour vous un bon resultat dans les 3 prochains mois ?",
    "Qui doit valider ce type de projet avec vous ?",
    "Si on avance, quelle serait la prochaine etape concrete de votre cote ?"
  ];

  return {
    context: input.meeting?.description || `RDV commercial avec ${company}.`,
    knownFromAirtable: notes,
    recentEmails: emailSummary,
    objective: prospect?.nextAction || "Obtenir un next step date et un critere de decision clair.",
    questions: [...universalQuestions, ...(sector ? sectorQuestions[sector] : [])].slice(0, 11),
    pointsToValidate: [
      "Besoin reel et impact business",
      "Decisionnaire et processus interne",
      "Timing souhaite",
      "Budget ou fourchette acceptable",
      "Prochaine etape datee"
    ],
    likelyObjections: [
      "C'est trop cher",
      "On a deja un site",
      "Pas le moment",
      "Je dois voir avec mon associe"
    ],
    prodectaPitch: `${sectorAdvice(sector)} Prodecta doit etre presente comme un outil commercial de projection, qualification et conversion, pas comme une simple creation visuelle.`,
    mandatoryNextStep: "Obtenir une date precise de retour, de demo, de validation interne ou d'envoi de devis.",
    postMeetingFollowup: buildFollowupTemplate(prospect || { company }, "post-rdv"),
    checklistBefore: [
      "Comprendre le contexte",
      "Identifier le besoin",
      "Identifier le decideur",
      "Identifier l'urgence",
      "Identifier le budget",
      "Preparer preuve sociale",
      "Preparer prochaine etape"
    ],
    checklistDuring: [
      "Cadrer le temps",
      "Rappeler le contexte",
      "Poser questions de decouverte",
      "Reformuler le besoin",
      "Presenter solution adaptee",
      "Traiter objections",
      "Valider next step",
      "Obtenir date precise de suite"
    ],
    checklistAfter: [
      "Envoyer mail recap",
      "Creer tache de relance",
      "Mettre a jour Airtable",
      "Programmer prochaine action"
    ]
  };
}

export const salesDateUtils = {
  daysBetween,
  isSameDay,
  isBeforeToday,
  isTodayOrPast,
  isTomorrow,
  isThisWeek
};
