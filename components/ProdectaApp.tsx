"use client";

import { useEffect, useMemo, useSyncExternalStore, useState } from "react";
import clsx from "clsx";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Brain,
  Calendar,
  Check,
  ChevronRight,
  ClipboardCopy,
  Download,
  FileText,
  Folder,
  Home,
  Lightbulb,
  Mail,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserRound
} from "lucide-react";
import type {
  CommercialMeeting,
  CommercialTask,
  DailyPriorityItem,
  DealMaturity,
  FollowupStrategy,
  FollowupOpportunity,
  GmailThreadSummary,
  IntegrationStatus,
  MeetingContext,
  MeetingPreparation,
  MeetingType,
  SalesProspect,
  Sector,
  StoredFollowup,
  TaskSuggestion,
  TrainingCategory
} from "@/lib/types";
import {
  buildDailyPriorityItems,
  buildFollowupTemplate,
  buildFollowupOpportunities,
  buildMeetingPreparation,
  buildSalesAdvice,
  buildTaskSuggestion,
  enrichProspectPriority,
  salesDateUtils,
  summarizeDashboardAdvice,
  type SalesAdvice
} from "@/lib/sales-advice";
import {
  buildFollowupFallback,
  defaultMeetingContext,
  objectionPlaybook,
  prodectaScripts,
  salesCheatSheets,
  sectorLabels,
  sectorQuestions,
  trainingCategories,
  trainingDrills,
  trainingModules
} from "@/lib/sales-knowledge";
import {
  clearProdectaData,
  exportProdectaData,
  safeJsonParse,
  saveLocalValue,
  STORAGE_KEYS
} from "@/lib/local-store";

type ViewId =
  | "dashboard"
  | "meetings"
  | "followups"
  | "prospects"
  | "gmail"
  | "tasks"
  | "library"
  | "integrations";

type LibraryTab = "resume" | "methode" | "scripts" | "drills" | "eviter";

type ApiEnvelope<T> = {
  demoMode: boolean;
  model?: string;
  data: T;
};

const navItems: Array<{ id: ViewId; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "meetings", label: "RDV", icon: Calendar },
  { id: "followups", label: "Relances", icon: Send },
  { id: "prospects", label: "Prospects", icon: UserRound },
  { id: "gmail", label: "Gmail", icon: Mail },
  { id: "tasks", label: "Taches", icon: Check },
  { id: "library", label: "Bibliotheque", icon: BookOpen },
  { id: "integrations", label: "Connexions", icon: Folder }
];

const libraryTabs: Array<{ id: LibraryTab; label: string }> = [
  { id: "resume", label: "Resume" },
  { id: "methode", label: "Methode" },
  { id: "scripts", label: "Scripts" },
  { id: "drills", label: "Drills" },
  { id: "eviter", label: "A eviter" }
];

const meetingTypeOptions: Array<{ value: MeetingType; label: string }> = [
  { value: "decouverte", label: "Decouverte" },
  { value: "demo", label: "Demo" },
  { value: "negociation", label: "Negociation" },
  { value: "closing", label: "Closing" },
  { value: "suivi", label: "Suivi" }
];

const maturityOptions: Array<{ value: DealMaturity; label: string }> = [
  { value: "froid", label: "Froid" },
  { value: "tiede", label: "Tiede" },
  { value: "chaud", label: "Chaud" },
  { value: "client", label: "Client" },
  { value: "inconnu", label: "Inconnu" }
];

const localStoreListeners = new Map<string, Set<() => void>>();
const DEMO_NOW = "2026-06-06T09:00:00+02:00";
const DEMO_TODAY = "2026-06-06T00:00:00+02:00";
const DEMO_TOMORROW = "2026-06-07T10:00:00+02:00";
const DEMO_LAST_CONTACT_4D = "2026-06-02T16:00:00+02:00";
const DEMO_LAST_CONTACT_2D = "2026-06-04T14:00:00+02:00";

const fallbackMeetings: CommercialMeeting[] = [
  {
    id: "demo-meeting-1",
    title: "RDV Prodecta - Chateau de la Cour Senlisse",
    start: "2026-06-06T11:00:00+02:00",
    end: "2026-06-06T12:00:00+02:00",
    description: "Qualifier le besoin et cadrer deux options commerciales.",
    attendees: ["sophie@example.com"],
    prospectName: "Chateau de la Cour Senlisse",
    source: "demo"
  }
];

const fallbackProspects: SalesProspect[] = [
  {
    id: "demo-prospect-1",
    name: "Sophie Martin",
    company: "Chateau de la Cour Senlisse",
    email: "sophie@example.com",
    sector: "chateau_domaine",
    pipelineStatus: "Purchase",
    pipelineStatusRaw: "Purchase",
    isPurchase: true,
    source: "Airtable demo",
    need: "Mieux projeter les visiteurs avant visite",
    potentialAmount: 24000,
    lastContactAt: DEMO_LAST_CONTACT_4D,
    nextAction: "",
    nextActionDate: DEMO_TODAY,
    followupDate: DEMO_TODAY,
    notes: "Tres interessee par deux scenarios. Devis a cadrer avec associe.",
    enrichedNotes: "Tres interessee par deux scenarios. Devis a cadrer avec associe.",
    priorityLevel: "urgent",
    priorityScore: 100,
    priorityReasons: ["Statut pipeline Purchase", "Purchase sans prochaine action"],
    website: "https://example.com"
  },
  {
    id: "demo-prospect-2",
    name: "Marc Petit",
    company: "Domaine Bellevue",
    email: "marc@example.com",
    sector: "hotel",
    pipelineStatus: "Purchase",
    pipelineStatusRaw: "Purchase",
    isPurchase: true,
    source: "Airtable demo",
    need: "Augmenter les reservations directes",
    potentialAmount: 18000,
    lastContactAt: DEMO_LAST_CONTACT_2D,
    nextAction: "Choisir le perimetre",
    nextActionDate: DEMO_TOMORROW,
    followupDate: DEMO_TOMORROW,
    notes: "Ok pour avancer, attend une proposition claire.",
    enrichedNotes: "Ok pour avancer, attend une proposition claire.",
    priorityLevel: "haute",
    priorityScore: 70,
    priorityReasons: ["Statut pipeline Purchase", "Notes enrichies avec signal positif"]
  }
];

const fallbackTasks: CommercialTask[] = [
  {
    id: "demo-task-1",
    title: "Relancer Chateau de la Cour Senlisse",
    due: DEMO_TODAY,
    status: "needsAction",
    prospectName: "Chateau de la Cour Senlisse",
    source: "demo"
  },
  {
    id: "demo-task-2",
    title: "Preparer RDV Domaine Bellevue",
    due: DEMO_TOMORROW,
    status: "needsAction",
    prospectName: "Domaine Bellevue",
    source: "demo"
  }
];

const fallbackThreads: GmailThreadSummary[] = [
  {
    id: "demo-thread-1",
    subject: "Budget et prochaine etape",
    snippet: "Merci pour la proposition, nous devons regarder le budget et en parler en interne.",
    prospectName: "Chateau de la Cour Senlisse",
    matchedProspectId: "demo-prospect-1",
    updatedAt: DEMO_NOW,
    lastMessageAt: DEMO_NOW,
    lastMessageFromMe: false,
    commercialStatus: "a_repondre",
    needsReply: true,
    daysSinceLastMessage: 0,
    source: "demo"
  }
];

function subscribeLocalStore(key: string, listener: () => void) {
  const listeners = localStoreListeners.get(key) ?? new Set<() => void>();
  listeners.add(listener);
  localStoreListeners.set(key, listeners);

  return () => {
    listeners.delete(listener);
  };
}

function notifyLocalStore(key: string) {
  localStoreListeners.get(key)?.forEach((listener) => listener());
}

function useLocalState<T>(key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS], fallback: T) {
  const fallbackSnapshot = useMemo(() => JSON.stringify(fallback), [fallback]);
  const storedSnapshot = useSyncExternalStore(
    (listener) => subscribeLocalStore(key, listener),
    () => {
      if (typeof window === "undefined") return fallbackSnapshot;
      return window.localStorage.getItem(key) ?? fallbackSnapshot;
    },
    () => fallbackSnapshot
  );
  const value = useMemo(() => safeJsonParse(storedSnapshot, fallback), [fallback, storedSnapshot]);

  const setValue = (nextValue: T | ((previousValue: T) => T)) => {
    const resolvedValue =
      typeof nextValue === "function"
        ? (nextValue as (previousValue: T) => T)(value)
        : nextValue;
    saveLocalValue(key, resolvedValue);
    notifyLocalStore(key);
  };

  return [value, setValue] as const;
}

async function postJson<T>(url: string, body: unknown): Promise<ApiEnvelope<T>> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  if (!response.ok) throw new Error(readApiErrorText(text, response.status));
  return JSON.parse(text) as ApiEnvelope<T>;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  if (!response.ok) throw new Error(readApiErrorText(text, response.status));
  return (text ? JSON.parse(text) : {}) as T;
}

function readApiErrorText(text: string, status: number) {
  if (!text) return `Erreur API ${status}`;
  try {
    const json = JSON.parse(text) as { error?: string; message?: string };
    return json.error ?? json.message ?? text;
  } catch {
    return text;
  }
}

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Local embedded browsers may block Clipboard API writes.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatDate(value?: string) {
  if (!value) return "Non date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function isToday(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.toDateString() === new Date().toDateString();
}

function isOverdue(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

function contextFromProspect(prospect?: SalesProspect): MeetingContext {
  if (!prospect) return defaultMeetingContext;
  return {
    ...defaultMeetingContext,
    prospectName: prospect.company || prospect.name,
    contactName: prospect.name,
    sector: prospect.sector,
    objective: prospect.need || defaultMeetingContext.objective,
    knownContext: prospect.enrichedNotes || prospect.notes || prospect.need || "",
    website: prospect.website || "",
    maturity:
      prospect.isPurchase || ["chaud", "proposition", "purchase"].includes(prospect.pipelineStatus.toLowerCase())
        ? "chaud"
        : defaultMeetingContext.maturity
  };
}

function normalizeProspect(raw: Partial<SalesProspect>): SalesProspect {
  const sector = Object.keys(sectorLabels).includes(String(raw.sector))
    ? (raw.sector as Sector)
    : "autre";
  const prospect = {
    id: raw.id || crypto.randomUUID(),
    airtableRecordId: raw.airtableRecordId,
    name: raw.name || raw.company || "Prospect",
    company: raw.company || raw.name || "Entreprise",
    email: raw.email || "",
    phone: raw.phone,
    sector,
    pipelineStatus: raw.pipelineStatusRaw || raw.pipelineStatus || "nouveau",
    pipelineStatusRaw: raw.pipelineStatusRaw || raw.pipelineStatus || "nouveau",
    isPurchase: raw.isPurchase,
    source: raw.source,
    need: raw.need,
    potentialAmount: raw.potentialAmount,
    lastContactAt: raw.lastContactAt,
    nextAction: raw.nextAction,
    nextActionDate: raw.nextActionDate || raw.followupDate,
    followupDate: raw.followupDate || raw.nextActionDate,
    notes: raw.notes,
    enrichedNotes: raw.enrichedNotes || raw.notes,
    priorityLevel: raw.priorityLevel,
    priorityScore: raw.priorityScore,
    priorityReasons: raw.priorityReasons,
    linkedInUrl: raw.linkedInUrl,
    website: raw.website,
    airtableUrl: raw.airtableUrl
  } satisfies SalesProspect;

  return enrichProspectPriority(prospect);
}

function normalizeTaskSource(value: unknown): CommercialTask["source"] {
  return value === "google" || value === "demo" || value === "local" ? value : "local";
}

function meetingPreparationToText(preparation: MeetingPreparation) {
  return [
    `Contexte: ${preparation.context}`,
    `Airtable: ${preparation.knownFromAirtable}`,
    `Emails recents: ${preparation.recentEmails}`,
    `Objectif: ${preparation.objective}`,
    `Questions:\n- ${preparation.questions.join("\n- ")}`,
    `Points a valider:\n- ${preparation.pointsToValidate.join("\n- ")}`,
    `Objections probables:\n- ${preparation.likelyObjections.join("\n- ")}`,
    `Pitch: ${preparation.prodectaPitch}`,
    `Next step obligatoire: ${preparation.mandatoryNextStep}`,
    `Relance post-RDV:\n${preparation.postMeetingFollowup}`
  ].join("\n\n");
}

export function ProdectaApp() {
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [context, setContext] = useLocalState<MeetingContext>(
    STORAGE_KEYS.meetingContext,
    defaultMeetingContext
  );
  const [followups, setFollowups] = useLocalState<StoredFollowup[]>(STORAGE_KEYS.followups, []);
  const [meetings, setMeetings] = useLocalState<CommercialMeeting[]>(
    STORAGE_KEYS.meetings,
    fallbackMeetings
  );
  const [tasks, setTasks] = useLocalState<CommercialTask[]>(STORAGE_KEYS.tasks, fallbackTasks);
  const [prospects, setProspects] = useLocalState<SalesProspect[]>(
    STORAGE_KEYS.prospects,
    fallbackProspects
  );
  const [gmailThreads, setGmailThreads] = useLocalState<GmailThreadSummary[]>(
    STORAGE_KEYS.gmailThreads,
    fallbackThreads
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const allAdvice = useMemo(() => {
    const prospectAdvice = prospects.flatMap((prospect) =>
      buildSalesAdvice({
        prospect,
        lastEmail: gmailThreads.find((thread) =>
          thread.prospectName?.toLowerCase().includes(prospect.company.toLowerCase())
        )
      })
    );
    const meetingAdvice = meetings.flatMap((meeting) =>
      buildSalesAdvice({ meeting, prospect: prospects.find((item) => item.company === meeting.prospectName) })
    );
    return [...prospectAdvice, ...meetingAdvice].slice(0, 8);
  }, [gmailThreads, meetings, prospects]);
  const dailyPriorityItems = useMemo(
    () => buildDailyPriorityItems({ prospects, meetings, tasks, threads: gmailThreads }).slice(0, 12),
    [gmailThreads, meetings, prospects, tasks]
  );
  const followupOpportunities = useMemo(
    () => buildFollowupOpportunities({ prospects, meetings, tasks, threads: gmailThreads }),
    [gmailThreads, meetings, prospects, tasks]
  );

  async function syncCommercialData() {
    setSyncing(true);
    setSyncError(null);
    const errors: string[] = [];
    try {
      const [prospectsResult, tasksResult] = await Promise.allSettled([
        requestJson<{ data: { prospects: Array<Partial<SalesProspect>>; message: string } }>(
          "/api/integrations/airtable/prospects",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ limit: 200 })
          }
        ),
        requestJson<{ data: { tasks: CommercialTask[]; message: string } }>("/api/integrations/tasks/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        })
      ]);

      const nextProspects =
        prospectsResult.status === "fulfilled" && prospectsResult.value.data.prospects?.length
          ? prospectsResult.value.data.prospects.map(normalizeProspect)
          : fallbackProspects;
      if (prospectsResult.status === "rejected") errors.push(`Airtable: ${prospectsResult.reason}`);
      setProspects(nextProspects);

      const nextTasks =
        tasksResult.status === "fulfilled" && tasksResult.value.data.tasks?.length
          ? tasksResult.value.data.tasks
          : fallbackTasks;
      if (tasksResult.status === "rejected") errors.push(`Tasks: ${tasksResult.reason}`);
      setTasks(nextTasks);

      const [calendarResult, gmailResult] = await Promise.allSettled([
        requestJson<{ data: { meetings: CommercialMeeting[]; message: string } }>(
          "/api/integrations/calendar/import",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prospects: nextProspects })
          }
        ),
        requestJson<{ data: { threads: GmailThreadSummary[]; message: string } }>(
          "/api/integrations/gmail/unanswered",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prospects: nextProspects, maxProspects: 12 })
          }
        )
      ]);

      setMeetings(
        calendarResult.status === "fulfilled" && calendarResult.value.data.meetings?.length
          ? calendarResult.value.data.meetings
          : fallbackMeetings
      );
      if (calendarResult.status === "rejected") errors.push(`Calendar: ${calendarResult.reason}`);

      setGmailThreads(
        gmailResult.status === "fulfilled" && gmailResult.value.data.threads?.length
          ? gmailResult.value.data.threads
          : fallbackThreads
      );
      if (gmailResult.status === "rejected") errors.push(`Gmail: ${gmailResult.reason}`);

      setNotice(errors.length ? "Dashboard synchronise partiellement." : "Dashboard commercial synchronise.");
      setSyncError(errors.length ? errors.join(" | ") : null);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Synchronisation impossible");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void syncCommercialData();
    }, 0);
    return () => window.clearTimeout(timer);
    // Initial dashboard hydration only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetLocalData() {
    clearProdectaData();
    setContext(defaultMeetingContext);
    setFollowups([]);
    setMeetings(fallbackMeetings);
    setTasks(fallbackTasks);
    setProspects(fallbackProspects);
    setGmailThreads(fallbackThreads);
    setNotice("Donnees locales supprimees.");
  }

  return (
    <div className="min-h-screen bg-canvas text-graphite">
      <div className="grid min-h-screen grid-cols-[244px_1fr] max-xl:grid-cols-[88px_1fr] max-md:grid-cols-1">
        <Sidebar activeView={activeView} onChange={setActiveView} />
        <main className="min-w-0 overflow-x-hidden">
          <TopBar syncing={syncing} onSync={syncCommercialData} />
          <MobileNav activeView={activeView} onChange={setActiveView} />

          {notice ? (
            <div className="mx-6 mt-4 flex items-center justify-between rounded-md border border-teal/20 bg-teal/5 px-4 py-3 text-sm text-teal">
              <span>{notice}</span>
              <button className="font-semibold" onClick={() => setNotice(null)}>
                Fermer
              </button>
            </div>
          ) : null}
          {syncError ? (
            <div className="mx-6 mt-4">
              <ErrorBox message={syncError} />
            </div>
          ) : null}

          {activeView === "dashboard" ? (
            <DashboardView
              meetings={meetings}
              tasks={tasks}
              prospects={prospects}
              gmailThreads={gmailThreads}
              advice={allAdvice}
              priorityItems={dailyPriorityItems}
              followupOpportunities={followupOpportunities}
              onNavigate={setActiveView}
              onExport={() => downloadText("prodecta-sales-pilot-export.json", exportProdectaData())}
              onClear={resetLocalData}
            />
          ) : null}
          {activeView === "meetings" ? (
            <MeetingsView
              meetings={meetings}
              prospects={prospects}
              gmailThreads={gmailThreads}
              onTasksChange={setTasks}
              context={context}
              onContextChange={setContext}
              onNavigate={setActiveView}
              onNotice={setNotice}
            />
          ) : null}
          {activeView === "followups" ? (
            <FollowupsView
              prospects={prospects}
              gmailThreads={gmailThreads}
              tasks={tasks}
              meetings={meetings}
              opportunities={followupOpportunities}
              context={context}
              onTasksChange={setTasks}
              onNotice={setNotice}
              onFollowup={(strategy) => {
                setFollowups((prev) => [
                  {
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString(),
                    prospectName: context.prospectName,
                    strategy
                  },
                  ...prev
                ]);
                setNotice("Relance sauvegardee localement.");
              }}
            />
          ) : null}
          {activeView === "prospects" ? (
            <ProspectsView
              prospects={prospects}
              tasks={tasks}
              gmailThreads={gmailThreads}
              onProspectsChange={setProspects}
              onTasksChange={setTasks}
              onThreadsChange={setGmailThreads}
              onContextChange={setContext}
              onNavigate={setActiveView}
              onNotice={setNotice}
            />
          ) : null}
          {activeView === "gmail" ? (
            <GmailView
              context={context}
              prospects={prospects}
              threads={gmailThreads}
              onThreadsChange={setGmailThreads}
              onNotice={setNotice}
            />
          ) : null}
          {activeView === "tasks" ? (
            <TasksView
              tasks={tasks}
              prospects={prospects}
              onTasksChange={setTasks}
              onNotice={setNotice}
            />
          ) : null}
          {activeView === "library" ? <LibraryView context={context} /> : null}
          {activeView === "integrations" ? <IntegrationsView onNotice={setNotice} /> : null}
        </main>
      </div>
    </div>
  );
}

function Sidebar({
  activeView,
  onChange
}: {
  activeView: ViewId;
  onChange: (view: ViewId) => void;
}) {
  return (
    <aside className="sticky top-0 flex h-screen flex-col border-r border-line bg-white max-md:hidden">
      <div className="flex h-24 items-center gap-3 px-6 max-xl:justify-center max-xl:px-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-teal text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="max-xl:hidden">
          <div className="text-lg font-black tracking-wide">PRODECTA</div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Sales Pilot
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              className={clsx(
                "group flex h-12 w-full items-center gap-3 rounded-md px-4 text-sm font-medium transition",
                active
                  ? "bg-teal/10 text-teal shadow-[inset_3px_0_0_#087f7a]"
                  : "text-ink hover:bg-slate-50 hover:text-teal",
                "max-xl:justify-center max-xl:px-0"
              )}
              onClick={() => onChange(item.id)}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
              <span className="max-xl:hidden">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-line p-4">
        <div className="rounded-md border border-line bg-slate-50 p-3 max-xl:hidden">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-teal" />
            Donnees
          </div>
          <div className="mt-3 space-y-2 text-xs text-muted">
            <div className="flex justify-between">
              <span>Local + API</span>
              <Check className="h-4 w-4 text-teal" />
            </div>
            <div className="flex justify-between">
              <span>OpenAI optionnel</span>
              <Check className="h-4 w-4 text-teal" />
            </div>
          </div>
        </div>
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-ink hover:bg-slate-50">
          <Settings className="h-5 w-5" />
          <span className="max-xl:hidden">Parametres</span>
        </button>
      </div>
    </aside>
  );
}

function MobileNav({
  activeView,
  onChange
}: {
  activeView: ViewId;
  onChange: (view: ViewId) => void;
}) {
  return (
    <nav className="sticky top-[154px] z-10 hidden overflow-hidden border-b border-line bg-white/95 px-4 py-3 backdrop-blur max-md:block">
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1 thin-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              className={clsx(
                "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold",
                active
                  ? "border-teal bg-teal text-white"
                  : "border-line bg-white text-ink hover:border-teal hover:text-teal"
              )}
              onClick={() => onChange(item.id)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function TopBar({ syncing, onSync }: { syncing: boolean; onSync: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex min-h-24 items-center justify-between border-b border-line bg-white/95 px-6 backdrop-blur max-lg:flex-wrap max-lg:gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Commercial</h1>
        <p className="text-sm text-muted">Cockpit Prodecta connecte a Calendar, Tasks, Gmail et Airtable</p>
      </div>

      <div className="flex min-w-[360px] max-w-xl flex-1 items-center rounded-md border border-line bg-white px-3 py-2 shadow-sm max-lg:min-w-full">
        <Search className="mr-2 h-4 w-4 text-muted" />
        <input className="w-full bg-transparent text-sm outline-none" placeholder="Rechercher prospect, RDV, action..." />
        <kbd className="rounded border border-line px-1.5 py-0.5 text-xs text-muted">K</kbd>
      </div>

      <button className="btn-primary" onClick={onSync} disabled={syncing}>
        {syncing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
        Synchroniser
      </button>
    </header>
  );
}

function DashboardView({
  meetings,
  tasks,
  prospects,
  gmailThreads,
  advice,
  priorityItems,
  followupOpportunities,
  onNavigate,
  onExport,
  onClear
}: {
  meetings: CommercialMeeting[];
  tasks: CommercialTask[];
  prospects: SalesProspect[];
  gmailThreads: GmailThreadSummary[];
  advice: SalesAdvice[];
  priorityItems: DailyPriorityItem[];
  followupOpportunities: FollowupOpportunity[];
  onNavigate: (view: ViewId) => void;
  onExport: () => void;
  onClear: () => void;
}) {
  const activeTasks = tasks.filter((task) => task.status !== "completed");
  const todayMeetings = meetings.filter((meeting) => isToday(meeting.start));
  const weekMeetings = meetings.filter((meeting) => salesDateUtils.isThisWeek(meeting.start));
  const todayTasks = activeTasks.filter((task) => isToday(task.due));
  const overdueTasks = activeTasks.filter((task) => isOverdue(task.due));
  const purchaseProspects = prospects.filter((prospect) => prospect.isPurchase);
  const overdueProspects = prospects.filter((prospect) => isOverdue(prospect.nextActionDate || prospect.followupDate));
  const todayFollowups = prospects.filter((prospect) => isToday(prospect.nextActionDate || prospect.followupDate));
  const noNextStep = prospects.filter((prospect) => prospect.isPurchase && !prospect.nextAction?.trim());
  const hotProspects = prospects
    .filter((prospect) => (prospect.priorityScore ?? 0) >= 65 || prospect.isPurchase)
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));
  const oldContacts = prospects.filter((prospect) =>
    prospect.priorityReasons?.some((reason) => reason.toLowerCase().includes("dernier contact"))
  );
  const unansweredMails = gmailThreads.filter((thread) => thread.needsReply || thread.commercialStatus === "en_attente_reponse");
  const topAdvice = summarizeDashboardAdvice(advice);

  return (
    <section className="space-y-5 p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="A relancer"
          value={String(todayFollowups.length)}
          detail="Aujourd'hui"
          onClick={() => onNavigate("followups")}
        />
        <MetricCard
          title="En retard"
          value={String(overdueProspects.length + overdueTasks.length)}
          detail="Prospects + taches"
          onClick={() => onNavigate("followups")}
        />
        <MetricCard
          title="Mails sans reponse"
          value={String(unansweredMails.length)}
          detail="Gmail commercial"
          onClick={() => onNavigate("gmail")}
        />
        <MetricCard
          title="RDV a venir"
          value={String(weekMeetings.length)}
          detail={`${todayMeetings.length} aujourd'hui`}
          onClick={() => onNavigate("meetings")}
        />
        <MetricCard
          title="Taches du jour"
          value={String(todayTasks.length)}
          detail="Google Tasks"
          onClick={() => onNavigate("tasks")}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_380px]">
        <Panel title="Priorite du jour" icon={Activity}>
          <div className="space-y-3">
            {priorityItems.length ? (
              priorityItems.map((item, index) => (
                <PriorityActionRow
                  key={item.id}
                  item={item}
                  index={index}
                  onClick={() => onNavigate(priorityTarget(item))}
                />
              ))
            ) : (
              <EmptyText text="Synchronisez les outils pour calculer la file de priorites." />
            )}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Conseil du jour" icon={Lightbulb}>
            {topAdvice ? (
              <AdviceCard advice={topAdvice} onAction={() => onNavigate(adviceTarget(topAdvice.cta))} />
            ) : (
              <EmptyText text="Synchronisez vos donnees pour obtenir des conseils contextuels." />
            )}
          </Panel>
          <Panel title="Donnees locales" icon={ShieldCheck}>
            <div className="space-y-3 text-sm">
              <StatusLine label="Fonctionne sans OpenAI" active />
              <StatusLine label="Brouillons Gmail uniquement" active />
              <StatusLine label="Tokens hors navigateur" active />
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-secondary" onClick={onExport}>
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <button className="btn-danger" onClick={onClear}>
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardList title="A relancer aujourd'hui" empty="Aucune relance datee aujourd'hui.">
          {todayFollowups.slice(0, 5).map((prospect) => (
            <ProspectActionRow key={prospect.id} prospect={prospect} cta="Relancer" onClick={() => onNavigate("followups")} />
          ))}
        </DashboardList>
        <DashboardList title="Sans prochaine action" empty="Aucun Purchase sans next step.">
          {noNextStep.slice(0, 5).map((prospect) => (
            <ProspectActionRow key={prospect.id} prospect={prospect} cta="Creer tache" onClick={() => onNavigate("prospects")} />
          ))}
        </DashboardList>
        <DashboardList title="Purchase a traiter" empty="Aucun Purchase importe.">
          {purchaseProspects.slice(0, 5).map((prospect) => (
            <ProspectActionRow key={prospect.id} prospect={prospect} cta="Voir prospect" onClick={() => onNavigate("prospects")} />
          ))}
        </DashboardList>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardList title="Prospects chauds" empty="Aucun prospect chaud detecte.">
          {hotProspects.slice(0, 5).map((prospect) => (
            <ProspectActionRow key={prospect.id} prospect={prospect} cta="Preparer relance" onClick={() => onNavigate("followups")} />
          ))}
        </DashboardList>
        <DashboardList title="Derniers contacts anciens" empty="Aucun dernier contact ancien.">
          {oldContacts.slice(0, 5).map((prospect) => (
            <ProspectActionRow key={prospect.id} prospect={prospect} cta="Relancer" onClick={() => onNavigate("followups")} />
          ))}
        </DashboardList>
        <DashboardList title="RDV a preparer" empty="Aucun RDV aujourd'hui ou cette semaine.">
          {weekMeetings.slice(0, 5).map((meeting) => (
            <ActionRow
              key={meeting.id}
              title={meeting.title}
              detail={`${formatDate(meeting.start)} - ${meeting.prospectName || "prospect a lier"}`}
              cta="Preparer"
              onClick={() => onNavigate("meetings")}
            />
          ))}
        </DashboardList>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <DashboardList title="Relances suggerees" empty="Aucune relance suggeree.">
          {followupOpportunities.slice(0, 4).map((opportunity) => (
            <FollowupOpportunityRow
              key={opportunity.id}
              opportunity={opportunity}
              onClick={() => onNavigate("followups")}
            />
          ))}
        </DashboardList>
        <DashboardList title="Taches du jour" empty="Aucune tache Google Tasks aujourd'hui.">
          {[...overdueTasks, ...todayTasks].slice(0, 5).map((task) => (
            <ActionRow
              key={task.id}
              title={task.title}
              detail={`${isOverdue(task.due) ? "En retard" : "Aujourd'hui"} - ${task.prospectName || task.notes || "action commerciale"}`}
              cta="Traiter"
              onClick={() => onNavigate("tasks")}
            />
          ))}
        </DashboardList>
      </div>
    </section>
  );
}

function MeetingsView({
  meetings,
  prospects,
  gmailThreads,
  onTasksChange,
  context,
  onContextChange,
  onNavigate,
  onNotice
}: {
  meetings: CommercialMeeting[];
  prospects: SalesProspect[];
  gmailThreads: GmailThreadSummary[];
  onTasksChange: (tasks: CommercialTask[] | ((previous: CommercialTask[]) => CommercialTask[])) => void;
  context: MeetingContext;
  onContextChange: (context: MeetingContext) => void;
  onNavigate: (view: ViewId) => void;
  onNotice: (notice: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(meetings[0]?.id ?? "");
  const selected = meetings.find((meeting) => meeting.id === selectedId) ?? meetings[0];
  const linkedProspect = prospects.find(
    (prospect) => prospect.id === selected?.matchedProspectId || prospect.company === selected?.prospectName
  );
  const prepContext = linkedProspect ? contextFromProspect(linkedProspect) : context;
  const relatedThreads = gmailThreads.filter(
    (thread) =>
      thread.matchedProspectId === linkedProspect?.id ||
      thread.prospectName === linkedProspect?.company ||
      thread.prospectName === selected?.prospectName
  );
  const preparation = buildMeetingPreparation({ meeting: selected, prospect: linkedProspect, threads: relatedThreads });
  const [error, setError] = useState<string | null>(null);

  async function createFollowupEvent() {
    if (!selected) return;
    const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const json = await requestJson<{ data: { message: string } }>(
      "/api/integrations/calendar/create-event",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectName: selected.prospectName || selected.title,
          title: `Relance Prodecta - ${selected.prospectName || selected.title}`,
          start: start.toISOString(),
          end: end.toISOString(),
          description: `Suite commerciale apres ${selected.title}`,
          attendees: selected.attendees.filter((item) => item.includes("@"))
        })
      }
    );
    onNotice(json.data.message);
  }

  async function createMeetingTask(type: "preparation" | "relance") {
    if (!selected) return;
    setError(null);
    const due = new Date(type === "preparation" ? selected.start : selected.end || selected.start);
    if (type === "relance") due.setDate(due.getDate() + 1);
    const suggestion = buildTaskSuggestion({
      meeting: selected,
      prospect: linkedProspect,
      type,
      due: due.toISOString()
    });
    try {
      const json = await requestJson<{ data: { task?: Partial<CommercialTask>; message: string } }>(
        "/api/integrations/tasks/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: suggestion.title,
            notes: suggestion.notes,
            due: suggestion.due,
            prospectName: linkedProspect?.company || selected.prospectName,
            matchedProspectId: linkedProspect?.id,
            sourceItemId: selected.id
          })
        }
      );
      onTasksChange((previous) => [
        {
          id: json.data.task?.id || crypto.randomUUID(),
          title: suggestion.title,
          due: suggestion.due,
          status: "needsAction",
          notes: suggestion.notes,
          prospectName: linkedProspect?.company || selected.prospectName,
          matchedProspectId: linkedProspect?.id,
          sourceItemId: selected.id,
          source: normalizeTaskSource(json.data.task?.source)
        },
        ...previous
      ]);
      onNotice(json.data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation tache impossible");
    }
  }

  return (
    <section className="grid gap-4 p-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Panel title="Prochains RDV" icon={Calendar}>
        <div className="space-y-2">
          {meetings.map((meeting) => (
            <button
              key={meeting.id}
              className={clsx(
                "w-full rounded-md border p-3 text-left transition",
                selected?.id === meeting.id
                  ? "border-teal bg-teal/5"
                  : "border-line bg-white hover:border-teal hover:bg-teal/5"
              )}
              onClick={() => setSelectedId(meeting.id)}
            >
              <div className="font-bold">{meeting.title}</div>
              <div className="mt-1 text-sm text-muted">{formatDate(meeting.start)}</div>
              <div className="mt-1 text-xs text-muted">{meeting.attendees.join(", ") || "Invites non charges"}</div>
            </button>
          ))}
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel title="Fiche de preparation RDV" icon={Target}>
          {selected ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <MetricCard title="Prospect" value={selected.prospectName || "A lier"} detail={selected.source} />
                <MetricCard title="Date" value={formatDate(selected.start)} detail="Google Calendar" />
                <MetricCard title="Invites" value={String(selected.attendees.length)} detail="contacts" />
                <MetricCard title="Secteur" value={sectorLabels[prepContext.sector]} detail={prepContext.maturity} />
              </div>
              <div className="grid gap-3 lg:grid-cols-3">
                <TextBlock title="Contexte RDV" text={preparation.context} />
                <TextBlock title="Airtable" text={preparation.knownFromAirtable} />
                <TextBlock title="Derniers mails" text={preparation.recentEmails} />
              </div>
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="grid gap-4 lg:grid-cols-2">
                  <InfoList title="Questions a poser" items={preparation.questions} />
                  <InfoList title="Points a valider" items={preparation.pointsToValidate} />
                  <InfoList title="Objections probables" items={preparation.likelyObjections} />
                  <InfoList title="Checklist pendant RDV" items={preparation.checklistDuring} />
                </div>
                <div className="space-y-3">
                  <SmallMessage title="Script d'introduction" text="Avant de vous presenter Prodecta, j'aimerais comprendre ce qui doit vraiment changer pour que ce projet ait un impact commercial." />
                  <SmallMessage title="Pitch Prodecta adapte" text={preparation.prodectaPitch} />
                  <SmallMessage title="Conclusion RDV" text={preparation.mandatoryNextStep} />
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <InfoList title="Avant RDV" items={preparation.checklistBefore} />
                <InfoList title="Apres RDV" items={preparation.checklistAfter} />
                <SmallMessage title="Relance post-RDV" text={preparation.postMeetingFollowup} />
              </div>
              <div className="rounded-md border border-teal/20 bg-teal/5 p-4 font-semibold text-teal">
                Objectif : {preparation.objective}
              </div>
              {error ? <ErrorBox message={error} /> : null}
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-primary"
                  onClick={() => {
                    onContextChange(prepContext);
                    onNotice("Preparation RDV locale prete.");
                  }}
                >
                  <Target className="h-4 w-4" />
                  Marquer pret
                </button>
                <button className="btn-secondary" onClick={() => createMeetingTask("preparation")}>
                  <Plus className="h-4 w-4" />
                  Tache preparation
                </button>
                <button className="btn-secondary" onClick={() => createMeetingTask("relance")}>
                  <Plus className="h-4 w-4" />
                  Tache post-RDV
                </button>
                <button className="btn-secondary" onClick={createFollowupEvent}>
                  <Calendar className="h-4 w-4" />
                  RDV relance
                </button>
                <button className="btn-secondary" onClick={() => copyText(meetingPreparationToText(preparation))}>
                  <ClipboardCopy className="h-4 w-4" />
                  Copier fiche
                </button>
                <button className="btn-secondary" onClick={() => onNavigate("gmail")}>
                  <Mail className="h-4 w-4" />
                  Voir mails lies
                </button>
              </div>
            </div>
          ) : (
            <EmptyText text="Aucun RDV charge. Synchronisez Google Calendar depuis le dashboard." />
          )}
        </Panel>
      </div>
    </section>
  );
}

function FollowupsView({
  prospects,
  gmailThreads,
  tasks,
  meetings,
  opportunities,
  context,
  onTasksChange,
  onNotice,
  onFollowup
}: {
  prospects: SalesProspect[];
  gmailThreads: GmailThreadSummary[];
  tasks: CommercialTask[];
  meetings: CommercialMeeting[];
  opportunities: FollowupOpportunity[];
  context: MeetingContext;
  onTasksChange: (tasks: CommercialTask[] | ((previous: CommercialTask[]) => CommercialTask[])) => void;
  onNotice: (notice: string) => void;
  onFollowup: (strategy: FollowupStrategy) => void;
}) {
  const [selectedProspectId, setSelectedProspectId] = useState(prospects[0]?.id ?? "");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const selectedProspect = prospects.find((prospect) => prospect.id === selectedProspectId) ?? prospects[0];
  const [form, setForm] = useState({
    prospectName: selectedProspect?.company || context.prospectName,
    conversation: "",
    notes: selectedProspect?.enrichedNotes || selectedProspect?.notes || "",
    lastReply: "",
    daysSinceLastExchange: 3,
    goal: "obtenir une prochaine etape claire",
    pressureLevel: "moyen",
    channel: "email",
    priceProposed: context.priceDiscussed
  });
  const [strategy, setStrategy] = useState<FollowupStrategy>(() => buildFollowupFallback(JSON.stringify(form)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filteredOpportunities = opportunities.filter((opportunity) => {
    const sourceOk = sourceFilter === "all" || opportunity.source === sourceFilter;
    const priorityOk = priorityFilter === "all" || opportunity.priority === priorityFilter;
    return sourceOk && priorityOk;
  });
  const relanceTasks = tasks.filter((task) => /relance|rappel|verifier/i.test(task.title));

  function pickProspect(id: string) {
    const prospect = prospects.find((item) => item.id === id);
    setSelectedProspectId(id);
    if (prospect) {
      setForm((prev) => ({
        ...prev,
        prospectName: prospect.company,
        notes: prospect.enrichedNotes || prospect.notes || prospect.need || "",
        priceProposed: prospect.potentialAmount ? `${prospect.potentialAmount} EUR` : prev.priceProposed
      }));
    }
  }

  function pickOpportunity(opportunity: FollowupOpportunity) {
    const prospect = prospects.find((item) => item.id === opportunity.prospectId);
    if (prospect) setSelectedProspectId(prospect.id);
    const nextStrategy = {
      diagnosis: opportunity.reason,
      probableRealObjection: opportunity.context,
      recommendedStrategy: opportunity.recommendedAngle,
      pricePosture: "Preserver la valeur, proposer deux options si le budget revient dans l'echange.",
      channel: "email",
      timing: "Aujourd'hui",
      email: {
        subject: `Suite Prodecta - ${opportunity.company}`,
        body: opportunity.message
      },
      sms: "Bonjour, je reviens vers vous au sujet de Prodecta. Est-ce que l'on se cale un court point cette semaine ?",
      shortMessage: opportunity.message,
      softVersion: opportunity.message,
      directVersion: opportunity.message,
      closingVersion: opportunity.message,
      nextAction: opportunity.nextAction || "Obtenir une prochaine etape datee"
    } satisfies FollowupStrategy;
    setForm((prev) => ({
      ...prev,
      prospectName: opportunity.company,
      conversation: opportunity.context,
      notes: prospect?.enrichedNotes || prospect?.notes || opportunity.context,
      goal: opportunity.nextAction || "obtenir une prochaine etape claire",
      priceProposed: prospect?.potentialAmount ? `${prospect.potentialAmount} EUR` : prev.priceProposed
    }));
    setStrategy(nextStrategy);
    onFollowup(nextStrategy);
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const result = await postJson<FollowupStrategy>("/api/relance", form);
      setStrategy(result.data);
      onFollowup(result.data);
    } catch (err) {
      const fallback = buildFollowupFallback(JSON.stringify(form));
      setStrategy(fallback);
      onFollowup(fallback);
      setError(err instanceof Error ? err.message : "Relance locale utilisee");
    } finally {
      setLoading(false);
    }
  }

  async function createGmailDraft() {
    try {
      const json = await requestJson<{ data: { message: string } }>("/api/integrations/gmail/create-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedProspect?.email || "prospect@example.com",
          subject: strategy.email.subject,
          body: strategy.email.body,
          prospectName: form.prospectName
        })
      });
      onNotice(json.data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation brouillon impossible");
    }
  }

  async function createOpportunityDraft(opportunity: FollowupOpportunity) {
    const prospect = prospects.find((item) => item.id === opportunity.prospectId);
    try {
      const json = await requestJson<{ data: { message: string } }>("/api/integrations/gmail/create-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: prospect?.email || selectedProspect?.email || "prospect@example.com",
          subject: `Suite Prodecta - ${opportunity.company}`,
          body: opportunity.message,
          prospectName: opportunity.company
        })
      });
      onNotice(json.data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation brouillon impossible");
    }
  }

  async function createOpportunityTask(opportunity: FollowupOpportunity) {
    const prospect = prospects.find((item) => item.id === opportunity.prospectId);
    const suggestion = buildTaskSuggestion({
      prospect: prospect || { id: opportunity.prospectId, company: opportunity.company },
      type: "relance",
      due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    try {
      const json = await requestJson<{ data: { task?: Partial<CommercialTask>; message: string } }>(
        "/api/integrations/tasks/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: suggestion.title,
            notes: `${suggestion.notes}\n\nSource relance: ${sourceLabel(opportunity.source)}\nRaison: ${opportunity.reason}`,
            due: suggestion.due,
            prospectName: opportunity.company,
            matchedProspectId: prospect?.id,
            sourceItemId: opportunity.id
          })
        }
      );
      onTasksChange((previous) => [
        {
          id: json.data.task?.id || crypto.randomUUID(),
          title: suggestion.title,
          due: suggestion.due,
          status: "needsAction",
          notes: suggestion.notes,
          prospectName: opportunity.company,
          matchedProspectId: prospect?.id,
          sourceItemId: opportunity.id,
          source: normalizeTaskSource(json.data.task?.source)
        },
        ...previous
      ]);
      onNotice(json.data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation tache impossible");
    }
  }

  return (
    <section className="space-y-4 p-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Relances" value={String(opportunities.length)} detail="toutes sources" />
        <MetricCard title="Gmail" value={String(gmailThreads.filter((thread) => thread.needsReply).length)} detail="a traiter" />
        <MetricCard title="Taches relance" value={String(relanceTasks.length)} detail="Google Tasks" />
        <MetricCard title="Post-RDV" value={String(meetings.filter((meeting) => isOverdue(meeting.end)).length)} detail="a suivre" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_390px]">
        <Panel title="Relances a faire" icon={Send}>
          <div className="mb-4 grid gap-2 md:grid-cols-2">
            <SelectInput
              label="Source"
              value={sourceFilter}
              onChange={setSourceFilter}
              options={[
                { value: "all", label: "Toutes les sources" },
                { value: "airtable", label: "Airtable" },
                { value: "gmail", label: "Gmail" },
                { value: "calendar", label: "Calendar" },
                { value: "tasks", label: "Tasks" }
              ]}
            />
            <SelectInput
              label="Priorite"
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                { value: "all", label: "Toutes les priorites" },
                { value: "urgent", label: "Urgent" },
                { value: "haute", label: "Haute" },
                { value: "moyenne", label: "Moyenne" },
                { value: "basse", label: "Basse" }
              ]}
            />
          </div>
          <div className="space-y-3">
            {filteredOpportunities.length ? (
              filteredOpportunities.map((opportunity) => (
                <div key={opportunity.id} className="rounded-md border border-line bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <PriorityBadge value={opportunity.priority} />
                        <span className="rounded-full border border-line px-2 py-1 text-xs font-bold uppercase text-muted">
                          {sourceLabel(opportunity.source)}
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-black text-ink">{opportunity.company}</h3>
                      <p className="mt-1 text-sm font-semibold text-teal">{opportunity.reason}</p>
                    </div>
                    <button className="btn-secondary" onClick={() => pickOpportunity(opportunity)}>
                      Ouvrir contexte
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">{opportunity.context}</p>
                  <div className="mt-3 rounded-md bg-teal/5 p-3 text-sm font-semibold text-teal">
                    {opportunity.recommendedAngle}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <button className="btn-secondary" onClick={() => copyText(opportunity.message)}>
                      <ClipboardCopy className="h-4 w-4" />
                      Copier
                    </button>
                    <button className="btn-primary" onClick={() => createOpportunityDraft(opportunity)}>
                      <FileText className="h-4 w-4" />
                      Brouillon Gmail
                    </button>
                    <button className="btn-secondary" onClick={() => createOpportunityTask(opportunity)}>
                      <Plus className="h-4 w-4" />
                      Creer tache
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyText text="Aucune relance dans ce filtre." />
            )}
          </div>
        </Panel>

        <Panel title="Composer une relance" icon={Mail}>
        <div className="space-y-3">
          <SelectInput
            label="Prospect"
            value={selectedProspectId}
            onChange={pickProspect}
            options={prospects.map((prospect) => ({ value: prospect.id, label: prospect.company }))}
          />
          <TextArea label="Conversation / contexte" value={form.conversation} onChange={(value) => setForm({ ...form, conversation: value })} rows={4} />
          <TextArea label="Notes commerciales" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} rows={3} />
          <TextInput label="Objectif" value={form.goal} onChange={(value) => setForm({ ...form, goal: value })} />
          <TextInput label="Prix propose" value={form.priceProposed} onChange={(value) => setForm({ ...form, priceProposed: value })} />
          {error ? <ErrorBox message={error} /> : null}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary" disabled={loading} onClick={generate}>
              {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generer
            </button>
            <button className="btn-secondary" onClick={() => copyText(buildFollowupTemplate(selectedProspect))}>
              <ClipboardCopy className="h-4 w-4" />
              Template
            </button>
          </div>
        </div>
      </Panel>
      </div>

      <Panel title="Messages prets" icon={Mail}>
        <div className="grid gap-4 lg:grid-cols-2">
          <MessageBox title="Email" subject={strategy.email.subject} body={strategy.email.body} />
          <div className="space-y-3">
            <SmallMessage title="SMS" text={strategy.sms} />
            <SmallMessage title="Message court" text={strategy.shortMessage} />
            <SmallMessage title="Version directe" text={strategy.directVersion} />
            <div className="grid gap-2 sm:grid-cols-3">
              <button className="btn-secondary" onClick={() => copyText(strategy.email.body)}>
                <ClipboardCopy className="h-4 w-4" />
                Copier
              </button>
              <button className="btn-primary" onClick={createGmailDraft}>
                <FileText className="h-4 w-4" />
                Creer brouillon
              </button>
              <button
                className="btn-secondary"
                onClick={() => downloadText("prodecta-relance.json", JSON.stringify(strategy, null, 2))}
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}

function ProspectsView({
  prospects,
  tasks,
  gmailThreads,
  onProspectsChange,
  onTasksChange,
  onThreadsChange,
  onContextChange,
  onNavigate,
  onNotice
}: {
  prospects: SalesProspect[];
  tasks: CommercialTask[];
  gmailThreads: GmailThreadSummary[];
  onProspectsChange: (prospects: SalesProspect[] | ((previous: SalesProspect[]) => SalesProspect[])) => void;
  onTasksChange: (tasks: CommercialTask[] | ((previous: CommercialTask[]) => CommercialTask[])) => void;
  onThreadsChange: (threads: GmailThreadSummary[] | ((previous: GmailThreadSummary[]) => GmailThreadSummary[])) => void;
  onContextChange: (context: MeetingContext) => void;
  onNavigate: (view: ViewId) => void;
  onNotice: (notice: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(prospects[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [prospectError, setProspectError] = useState<string | null>(null);
  const selected = prospects.find((prospect) => prospect.id === selectedId) ?? prospects[0];
  const filtered = prospects.filter((prospect) =>
    `${prospect.name} ${prospect.company} ${prospect.email} ${prospect.need} ${prospect.enrichedNotes}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );
  const relatedThreads = gmailThreads.filter(
    (thread) => thread.matchedProspectId === selected?.id || thread.prospectName === selected?.company
  );
  const relatedTasks = tasks.filter(
    (task) => task.matchedProspectId === selected?.id || task.prospectName === selected?.company
  );
  const advice = buildSalesAdvice({
    prospect: selected,
    lastEmail: relatedThreads[0]
  });

  async function createProspectTask(label = "Relancer") {
    if (!selected) return;
    setProspectError(null);
    const taskType = label.toLowerCase().includes("preparer")
      ? "preparation"
      : label.toLowerCase().includes("devis")
        ? "devis"
        : label.toLowerCase().includes("appeler")
          ? "appel"
          : "relance";
    const suggestion = buildTaskSuggestion({
      prospect: selected,
      type: taskType,
      due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    const json = await requestJson<{ data: { task?: Partial<CommercialTask>; message: string } }>(
      "/api/integrations/tasks/create",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: suggestion.title,
          notes: suggestion.notes,
          due: suggestion.due,
          prospectName: selected.company,
          matchedProspectId: selected.id,
          sourceItemId: selected.airtableRecordId || selected.id
        })
      }
    );
    onTasksChange([
      {
        id: json.data.task?.id || crypto.randomUUID(),
        title: suggestion.title,
        due: suggestion.due,
        status: "needsAction",
        notes: suggestion.notes,
        prospectName: selected.company,
        matchedProspectId: selected.id,
        sourceItemId: selected.airtableRecordId || selected.id,
        source: normalizeTaskSource(json.data.task?.source)
      },
      ...tasks
    ]);
    onNotice(json.data.message);
  }

  function updateNextAction(value: string) {
    if (!selected) return;
    onProspectsChange((previous) =>
      previous.map((prospect) =>
        prospect.id === selected.id ? enrichProspectPriority({ ...prospect, nextAction: value }) : prospect
      )
    );
  }

  function updateNextActionDate(value: string) {
    if (!selected) return;
    onProspectsChange((previous) =>
      previous.map((prospect) =>
        prospect.id === selected.id ? enrichProspectPriority({ ...prospect, nextActionDate: value, followupDate: value }) : prospect
      )
    );
  }

  async function saveNextActionToAirtable() {
    if (!selected) return;
    setProspectError(null);
    try {
      const json = await requestJson<{ data: { message: string } }>(
        "/api/integrations/airtable/prospects/update",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recordId: selected.airtableRecordId || selected.id,
            nextAction: selected.nextAction,
            nextActionDate: selected.nextActionDate
          })
        }
      );
      onNotice(json.data.message);
    } catch (err) {
      setProspectError(err instanceof Error ? err.message : "Mise a jour Airtable impossible");
    }
  }

  async function searchProspectMails() {
    if (!selected) return;
    setProspectError(null);
    try {
      const queryText = [selected.email, selected.company, selected.name].filter(Boolean).join(" OR ");
      const json = await requestJson<{ data: { threads: GmailThreadSummary[]; message: string } }>(
        "/api/integrations/gmail/search",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: queryText, prospectName: selected.company, prospects: [selected] })
        }
      );
      onThreadsChange((previous) => {
        const existingIds = new Set(json.data.threads.map((thread) => thread.id));
        return [...json.data.threads, ...previous.filter((thread) => !existingIds.has(thread.id))];
      });
      onNotice(json.data.message);
    } catch (err) {
      setProspectError(err instanceof Error ? err.message : "Recherche Gmail impossible");
    }
  }

  return (
    <section className="grid gap-4 p-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Panel title="Prospects Airtable" icon={UserRound}>
        <div className="space-y-3">
          <div className="flex items-center rounded-md border border-line bg-white px-3 py-2 shadow-sm">
            <Search className="mr-2 h-4 w-4 text-muted" />
            <input className="w-full bg-transparent text-sm outline-none" placeholder="Rechercher..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="space-y-2">
            {filtered.map((prospect) => (
              <button
                key={prospect.id}
                className={clsx(
                  "w-full rounded-md border p-3 text-left transition",
                  selected?.id === prospect.id
                    ? "border-teal bg-teal/5"
                    : "border-line bg-white hover:border-teal hover:bg-teal/5"
                )}
                onClick={() => setSelectedId(prospect.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold">{prospect.company}</div>
                    <div className="mt-1 text-sm text-muted">{prospect.name}</div>
                  </div>
                  <PriorityBadge value={prospect.pipelineStatus} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <div className="space-y-4">
        {selected ? (
          <>
            <Panel title={selected.company} icon={Folder}>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <MetricCard title="Statut" value={selected.pipelineStatusRaw || selected.pipelineStatus} detail="pipeline" />
                    <MetricCard title="Secteur" value={sectorLabels[selected.sector]} detail="angle" />
                    <MetricCard title="Potentiel" value={`${selected.potentialAmount ?? 0} EUR`} detail="montant" />
                    <MetricCard title="Priorite" value={String(selected.priorityScore ?? 0)} detail={selected.priorityLevel || "a qualifier"} />
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <TextBlock title="Besoin" text={selected.need || "A qualifier"} />
                    <TextBlock title="Notes enrichies" text={selected.enrichedNotes || selected.notes || "Aucune note Airtable"} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextInput label="Prochaine action" value={selected.nextAction || ""} onChange={updateNextAction} />
                    <TextInput label="Date prochaine action" value={selected.nextActionDate || ""} onChange={updateNextActionDate} />
                  </div>
                  {prospectError ? <ErrorBox message={prospectError} /> : null}
                  <div className="rounded-md border border-line bg-slate-50 p-3 text-sm">
                    <div className="font-bold text-ink">Raisons de priorite</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(selected.priorityReasons?.length ? selected.priorityReasons : ["Informations a qualifier"]).map((reason) => (
                        <span key={reason} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-muted">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-primary" onClick={() => createProspectTask("Relancer")}>
                      <Plus className="h-4 w-4" />
                      Creer tache
                    </button>
                    <button className="btn-secondary" onClick={saveNextActionToAirtable}>
                      <Check className="h-4 w-4" />
                      Sauver Airtable
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        onContextChange(contextFromProspect(selected));
                        onNavigate("meetings");
                      }}
                    >
                      <Target className="h-4 w-4" />
                      Preparer RDV
                    </button>
                    <button className="btn-secondary" onClick={searchProspectMails}>
                      <Search className="h-4 w-4" />
                      Chercher mails
                    </button>
                    <button className="btn-secondary" onClick={() => onNavigate("gmail")}>
                      <Mail className="h-4 w-4" />
                      Creer brouillon
                    </button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <DashboardList title="Mails lies" empty="Aucun mail lie charge.">
                      {relatedThreads.slice(0, 3).map((thread) => (
                        <ActionRow
                          key={thread.id}
                          title={thread.subject}
                          detail={`${thread.commercialStatus || "recent"} - ${thread.snippet}`}
                          cta="Gmail"
                          onClick={() => onNavigate("gmail")}
                        />
                      ))}
                    </DashboardList>
                    <DashboardList title="Taches liees" empty="Aucune tache liee.">
                      {relatedTasks.slice(0, 3).map((task) => (
                        <ActionRow
                          key={task.id}
                          title={task.title}
                          detail={`${formatDate(task.due)} - ${task.status}`}
                          cta="Tasks"
                          onClick={() => onNavigate("tasks")}
                        />
                      ))}
                    </DashboardList>
                  </div>
                </div>
                <div className="space-y-3">
                  {advice.slice(0, 3).map((item) => (
                    <AdviceCard key={item.id} advice={item} onAction={() => onNavigate(adviceTarget(item.cta))} />
                  ))}
                </div>
              </div>
            </Panel>
          </>
        ) : (
          <Panel title="Prospect" icon={Folder}>
            <EmptyText text="Aucun prospect charge." />
          </Panel>
        )}
      </div>
    </section>
  );
}

function GmailView({
  context,
  prospects,
  threads,
  onThreadsChange,
  onNotice
}: {
  context: MeetingContext;
  prospects: SalesProspect[];
  threads: GmailThreadSummary[];
  onThreadsChange: (threads: GmailThreadSummary[] | ((previous: GmailThreadSummary[]) => GmailThreadSummary[])) => void;
  onNotice: (notice: string) => void;
}) {
  const [query, setQuery] = useState(context.prospectName);
  const [to, setTo] = useState(prospects[0]?.email || "prospect@example.com");
  const [subject, setSubject] = useState(`Suite Prodecta - ${context.prospectName}`);
  const [body, setBody] = useState(buildFollowupTemplate(prospects[0]));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const incomingToHandle = threads.filter((thread) => thread.needsReply || thread.commercialStatus === "a_repondre");
  const sentWithoutReply = threads.filter((thread) => thread.commercialStatus === "en_attente_reponse");
  const recentThreads = threads.filter((thread) => !thread.needsReply && thread.commercialStatus !== "en_attente_reponse");

  async function searchThreads() {
    setLoading(true);
    setError(null);
    try {
      const json = await requestJson<{ data: { threads: GmailThreadSummary[]; message: string } }>(
        "/api/integrations/gmail/search",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, prospectName: query, prospects })
        }
      );
      onThreadsChange(json.data.threads);
      onNotice(json.data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recherche Gmail impossible");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeUnanswered() {
    setLoading(true);
    setError(null);
    try {
      const json = await requestJson<{ data: { threads: GmailThreadSummary[]; message: string } }>(
        "/api/integrations/gmail/unanswered",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prospects, maxProspects: 12 })
        }
      );
      onThreadsChange(json.data.threads);
      onNotice(json.data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyse Gmail impossible");
    } finally {
      setLoading(false);
    }
  }

  async function createDraft() {
    setLoading(true);
    setError(null);
    try {
      const json = await requestJson<{ data: { message: string } }>(
        "/api/integrations/gmail/create-draft",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, subject, body, prospectName: query })
        }
      );
      onNotice(json.data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation brouillon impossible");
    } finally {
      setLoading(false);
    }
  }

  function prepareThreadDraft(thread: GmailThreadSummary) {
    const prospect = prospects.find((item) => item.id === thread.matchedProspectId || item.company === thread.prospectName);
    const message = buildFollowupTemplate(
      prospect || { company: thread.prospectName || query },
      thread.commercialStatus === "en_attente_reponse" ? "absence" : "next-step"
    );
    setQuery(thread.prospectName || prospect?.company || query);
    setTo(prospect?.email || to);
    setSubject(`Suite Prodecta - ${prospect?.company || thread.prospectName || thread.subject}`);
    setBody(message);
    onNotice("Brouillon local prepare depuis le thread.");
  }

  return (
    <section className="grid gap-4 p-5 xl:grid-cols-[390px_minmax(0,1fr)]">
      <Panel title="Gmail commercial" icon={Mail}>
        <div className="space-y-3">
          <TextInput label="Recherche prospect" value={query} onChange={setQuery} />
          <TextInput label="Destinataire" value={to} onChange={setTo} />
          <TextInput label="Objet" value={subject} onChange={setSubject} />
          <TextArea label="Message" value={body} onChange={setBody} rows={7} />
          {error ? <ErrorBox message={error} /> : null}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secondary" onClick={searchThreads} disabled={loading}>
              <Search className="h-4 w-4" />
              Rechercher
            </button>
            <button className="btn-secondary" onClick={analyzeUnanswered} disabled={loading}>
              <Activity className="h-4 w-4" />
              Sans reponse
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary" onClick={createDraft} disabled={loading}>
              <FileText className="h-4 w-4" />
              Creer brouillon
            </button>
          </div>
          <button className="btn-secondary w-full" onClick={() => copyText(body)}>
            <ClipboardCopy className="h-4 w-4" />
            Copier le message
          </button>
        </div>
      </Panel>

      <Panel title="Echanges commerciaux" icon={Mail}>
        <div className="grid gap-4 xl:grid-cols-2">
          <GmailThreadGroup title="Mails recus a traiter" empty="Aucun mail entrant sans reponse.">
            {incomingToHandle.map((thread) => (
              <GmailThreadCard key={thread.id} thread={thread} onUse={() => prepareThreadDraft(thread)} />
            ))}
          </GmailThreadGroup>
          <GmailThreadGroup title="Mails envoyes sans reponse" empty="Aucun mail envoye sans reponse detecte.">
            {sentWithoutReply.map((thread) => (
              <GmailThreadCard key={thread.id} thread={thread} onUse={() => prepareThreadDraft(thread)} />
            ))}
          </GmailThreadGroup>
          <GmailThreadGroup title="Relances suggerees" empty="Aucune relance suggeree.">
            {[...incomingToHandle, ...sentWithoutReply].slice(0, 4).map((thread) => (
              <GmailThreadCard key={`suggested-${thread.id}`} thread={thread} onUse={() => prepareThreadDraft(thread)} />
            ))}
          </GmailThreadGroup>
          <GmailThreadGroup title="Threads commerciaux recents" empty="Aucun thread recent.">
            {recentThreads.slice(0, 4).map((thread) => (
              <GmailThreadCard key={thread.id} thread={thread} onUse={() => prepareThreadDraft(thread)} />
            ))}
          </GmailThreadGroup>
        </div>
      </Panel>
    </section>
  );
}

function TasksView({
  tasks,
  prospects,
  onTasksChange,
  onNotice
}: {
  tasks: CommercialTask[];
  prospects: SalesProspect[];
  onTasksChange: (tasks: CommercialTask[] | ((previous: CommercialTask[]) => CommercialTask[])) => void;
  onNotice: (notice: string) => void;
}) {
  const [title, setTitle] = useState("Relancer prospect");
  const [selectedProspectId, setSelectedProspectId] = useState(prospects[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedProspect = prospects.find((prospect) => prospect.id === selectedProspectId);
  const activeTasks = tasks.filter((task) => task.status !== "completed");
  const overdueTasks = activeTasks.filter((task) => isOverdue(task.due));
  const todayTasks = activeTasks.filter((task) => isToday(task.due));
  const upcomingTasks = activeTasks.filter((task) => !isOverdue(task.due) && !isToday(task.due));

  async function createTask(templateTitle?: string, type?: TaskSuggestion["source"] | "devis" | "brouillon" | "appel" | "elements" | "verification" | "airtable") {
    const label = templateTitle || title;
    const taskType =
      type && type !== "calendar" && type !== "gmail" && type !== "airtable"
        ? type
        : label.toLowerCase().includes("preparer")
          ? "preparation"
          : label.toLowerCase().includes("devis")
            ? "devis"
            : label.toLowerCase().includes("brouillon")
              ? "brouillon"
              : label.toLowerCase().includes("appeler")
                ? "appel"
                : label.toLowerCase().includes("elements")
                  ? "elements"
                  : label.toLowerCase().includes("verifier")
                    ? "verification"
                    : "relance";
    const suggestion = buildTaskSuggestion({
      prospect: selectedProspect,
      type: taskType,
      due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    setLoading(true);
    setError(null);
    try {
      const json = await requestJson<{ data: { task?: Partial<CommercialTask>; message: string } }>(
        "/api/integrations/tasks/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: suggestion.title,
            notes: suggestion.notes,
            due: suggestion.due,
            prospectName: selectedProspect?.company,
            matchedProspectId: selectedProspect?.id,
            sourceItemId: selectedProspect?.airtableRecordId || selectedProspect?.id
          })
        }
      );
      onTasksChange((previous) => [
        {
          id: json.data.task?.id || crypto.randomUUID(),
          title: suggestion.title,
          due: suggestion.due,
          status: "needsAction",
          notes: suggestion.notes,
          prospectName: selectedProspect?.company,
          matchedProspectId: selectedProspect?.id,
          sourceItemId: selectedProspect?.airtableRecordId || selectedProspect?.id,
          source: normalizeTaskSource(json.data.task?.source)
        },
        ...previous
      ]);
      onNotice(json.data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation tache impossible");
    } finally {
      setLoading(false);
    }
  }

  async function completeTask(task: CommercialTask) {
    const json = await requestJson<{ data: { message: string } }>("/api/integrations/tasks/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskListId: task.taskListId || "@default", taskId: task.id })
    });
    onTasksChange((previous) =>
      previous.map((item) => (item.id === task.id ? { ...item, status: "completed" } : item))
    );
    onNotice(json.data.message);
  }

  return (
    <section className="grid gap-4 p-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Panel title="Creer une tache" icon={Check}>
        <div className="space-y-3">
          <SelectInput
            label="Prospect lie"
            value={selectedProspectId}
            onChange={setSelectedProspectId}
            options={prospects.map((prospect) => ({ value: prospect.id, label: prospect.company }))}
          />
          <TextInput label="Titre" value={title} onChange={setTitle} />
          {error ? <ErrorBox message={error} /> : null}
          <button className="btn-primary w-full" onClick={() => createTask()} disabled={loading}>
            {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Creer tache
          </button>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "Relancer prospect",
              "Preparer RDV",
              "Envoyer devis",
              "Creer brouillon Gmail",
              "Appeler prospect",
              "Envoyer elements",
              "Verifier reponse",
              "Mettre a jour Airtable"
            ].map((item) => (
              <button key={item} className="btn-secondary" onClick={() => createTask(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Taches commerciales" icon={Check}>
        <div className="grid gap-4 xl:grid-cols-3">
          <TaskBucket title="En retard" tasks={overdueTasks} onComplete={completeTask} />
          <TaskBucket title="Aujourd'hui" tasks={todayTasks} onComplete={completeTask} />
          <TaskBucket title="A venir" tasks={upcomingTasks} onComplete={completeTask} />
        </div>
      </Panel>
    </section>
  );
}

function LibraryView({ context }: { context: MeetingContext }) {
  const [activeCategory, setActiveCategory] = useState<TrainingCategory>("fondamentaux");
  const [activeTab, setActiveTab] = useState<LibraryTab>("resume");
  const [query, setQuery] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState(trainingModules[0]?.id ?? "");
  const normalizedQuery = query.trim().toLowerCase();
  const activeCategoryMeta =
    trainingCategories.find((category) => category.id === activeCategory) ?? trainingCategories[0];
  const visibleModules = trainingModules.filter((module) => {
    const categoryMatch = normalizedQuery || module.category === activeCategory;
    const searchable = `${module.title} ${module.goal} ${module.whyItMatters} ${module.script} ${module.keyPrinciples.join(" ")}`.toLowerCase();
    return categoryMatch && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
  const selectedModule =
    visibleModules.find((module) => module.id === selectedModuleId) ?? visibleModules[0] ?? trainingModules[0];
  const visibleDrills = trainingDrills.filter((drill) => drill.category === activeCategory || normalizedQuery);

  function openCategory(category: TrainingCategory) {
    setActiveCategory(category);
    setActiveTab("resume");
    const first = trainingModules.find((module) => module.category === category);
    if (first) setSelectedModuleId(first.id);
  }

  return (
    <section className="min-w-0 space-y-4 p-5">
      <Panel title="Academie commerciale Prodecta" icon={BookOpen}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <div className="rounded-md border border-teal/20 bg-teal/5 p-4">
              <h3 className="text-lg font-black text-teal">Camp d&apos;entrainement commercial</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Methodes, scripts, secteurs et objections. Tout fonctionne sans API externe.
              </p>
            </div>
            <div className="flex items-center rounded-md border border-line bg-white px-3 py-2 shadow-sm">
              <Search className="mr-2 h-4 w-4 text-muted" />
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Rechercher : prix, closing, Cialdini, associe..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
              {trainingCategories.map((category) => (
                <button
                  key={category.id}
                  className={clsx(
                    "flex min-h-14 items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-bold transition",
                    activeCategory === category.id
                      ? "border-teal bg-teal text-white"
                      : "border-line bg-white text-ink hover:border-teal hover:bg-teal/5 hover:text-teal"
                  )}
                  onClick={() => openCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-line bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-muted">A pratiquer maintenant</div>
            <div className="mt-2 text-lg font-black text-ink">{activeCategoryMeta.label}</div>
            <p className="mt-2 text-sm leading-6 text-muted">{selectedModule?.script}</p>
            <button className="btn-primary mt-4 w-full" onClick={() => copyText(selectedModule?.script ?? "")}>
              <ClipboardCopy className="h-4 w-4" />
              Copier script
            </button>
          </div>
        </div>
      </Panel>

      <Panel title={selectedModule?.title ?? activeCategoryMeta.label} icon={Brain}>
        <div className="flex flex-wrap gap-2 border-b border-line pb-4">
          {libraryTabs.map((tab) => (
            <button
              key={tab.id}
              className={clsx(
                "rounded-full border px-3 py-1.5 text-xs font-bold",
                activeTab === tab.id
                  ? "border-teal bg-teal text-white"
                  : "border-line bg-white text-muted hover:border-teal hover:text-teal"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-4">
          {selectedModule && activeTab === "resume" ? <TrainingModuleSpotlight module={selectedModule} /> : null}
          {selectedModule && activeTab === "methode" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <InfoList title="Principes cles" items={selectedModule.keyPrinciples} />
              <InfoList title="Application terrain" items={selectedModule.howToApply} />
            </div>
          ) : null}
          {selectedModule && activeTab === "scripts" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <SmallMessage title="Script principal" text={selectedModule.script} />
              {prodectaScripts.slice(0, 5).map((script) => (
                <SmallMessage key={script.id} title={`${script.moment} - ${script.title}`} text={script.text} />
              ))}
            </div>
          ) : null}
          {activeTab === "drills" ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {visibleDrills.map((drill) => <TrainingDrillRow key={drill.id} drill={drill} />)}
            </div>
          ) : null}
          {selectedModule && activeTab === "eviter" ? (
            <InfoList title="A eviter" items={[selectedModule.avoid, selectedModule.drill]} />
          ) : null}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Modules disponibles" icon={Folder}>
          <div className="grid gap-3 md:grid-cols-2">
            {visibleModules.map((module) => (
              <TrainingModuleRow
                key={module.id}
                module={module}
                active={selectedModule?.id === module.id}
                onSelect={() => setSelectedModuleId(module.id)}
              />
            ))}
          </div>
        </Panel>
        <Panel title="Playbook objections" icon={AlertTriangle}>
          <div className="space-y-3">
            {objectionPlaybook.map((item) => (
              <div key={item.id} className="rounded-md border border-line bg-white p-3 text-sm">
                <div className="font-bold">{item.label}</div>
                <p className="mt-1 text-muted">{item.diagnosis}</p>
                <p className="mt-2 rounded-md bg-teal/5 p-2 font-semibold text-teal">{item.phrase}</p>
                <p className="mt-2 text-xs text-muted">Next step : {item.strategy}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Questions par secteur" icon={Target}>
          <InfoList title={sectorLabels[context.sector]} items={sectorQuestions[context.sector]} />
        </Panel>
        <Panel title="Fiches memo" icon={FileText}>
          <div className="grid gap-4 md:grid-cols-2">
            {salesCheatSheets.slice(0, 4).map((sheet) => (
              <InfoList key={sheet.id} title={sheet.title} items={sheet.items} />
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function IntegrationsView({ onNotice }: { onNotice: (notice: string) => void }) {
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function loadStatuses() {
    setLoading(true);
    setError(null);
    try {
      const json = await requestJson<{ data: { statuses: IntegrationStatus[] } }>("/api/integrations/status");
      setStatuses(json.data.statuses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Statuts integrations impossibles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStatuses();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function run(key: string, action: () => Promise<string>) {
    setBusy(key);
    setError(null);
    try {
      const message = await action();
      setResult(message);
      onNotice(message);
      await loadStatuses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="min-w-0 space-y-4 p-5">
      <Panel title="Connexions commerciales" icon={Folder}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <h3 className="text-xl font-black text-ink">Connecter les outils commerciaux Prodecta</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Google Calendar, Google Tasks, Gmail et Airtable alimentent le dashboard. OpenAI est optionnel.
            </p>
          </div>
          <div className="rounded-md border border-teal/20 bg-teal/5 p-4 text-sm">
            <div className="font-bold text-teal">Fonctionne sans OpenAI</div>
            <p className="mt-2 text-ink">
              Les conseils de base, la bibliotheque commerciale, les relances templates et les synchronisations restent disponibles.
            </p>
          </div>
        </div>
      </Panel>

      {loading ? <div className="rounded-md border border-line bg-white p-4 text-sm text-muted">Chargement...</div> : null}
      {error ? <ErrorBox message={error} /> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {statuses.map((status) => (
          <IntegrationCard key={status.provider} status={status}>
            {status.provider === "airtable" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  className="btn-secondary"
                  disabled={busy === "airtable-test"}
                  onClick={() =>
                    run("airtable-test", async () => {
                      const json = await requestJson<{ data: { message: string } }>(
                        "/api/integrations/airtable/discover",
                        { method: "POST" }
                      );
                      return json.data.message;
                    })
                  }
                >
                  Tester
                </button>
                <button
                  className="btn-primary"
                  disabled={busy === "airtable-prospects"}
                  onClick={() =>
                    run("airtable-prospects", async () => {
                      const json = await requestJson<{ data: { message: string } }>(
                        "/api/integrations/airtable/prospects",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ limit: 10 })
                        }
                      );
                      return json.data.message;
                    })
                  }
                >
                  Import prospects
                </button>
              </div>
            ) : null}
            {status.provider === "googleCalendar" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <button className="btn-secondary" onClick={() => { window.location.href = "/api/integrations/google/oauth/start"; }}>
                  Connecter
                </button>
                <button
                  className="btn-primary"
                  disabled={busy === "calendar"}
                  onClick={() =>
                    run("calendar", async () => {
                      const json = await requestJson<{ data: { message: string } }>(
                        "/api/integrations/calendar/import",
                        { method: "POST" }
                      );
                      return json.data.message;
                    })
                  }
                >
                  Importer RDV
                </button>
              </div>
            ) : null}
            {status.provider === "googleTasks" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  className="btn-secondary"
                  disabled={busy === "tasks-lists"}
                  onClick={() =>
                    run("tasks-lists", async () => {
                      const json = await requestJson<{ data: { message: string } }>(
                        "/api/integrations/tasks/lists",
                        { method: "POST" }
                      );
                      return json.data.message;
                    })
                  }
                >
                  Tester listes
                </button>
                <button
                  className="btn-primary"
                  disabled={busy === "tasks-create"}
                  onClick={() =>
                    run("tasks-create", async () => {
                      const json = await requestJson<{ data: { message: string } }>(
                        "/api/integrations/tasks/create",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ title: "Relancer prospect Prodecta" })
                        }
                      );
                      return json.data.message;
                    })
                  }
                >
                  Creer tache test
                </button>
              </div>
            ) : null}
            {status.provider === "gmail" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  className="btn-secondary"
                  disabled={busy === "gmail-search"}
                  onClick={() =>
                    run("gmail-search", async () => {
                      const json = await requestJson<{ data: { message: string } }>(
                        "/api/integrations/gmail/search",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ query: "Prodecta", prospectName: "Prodecta" })
                        }
                      );
                      return json.data.message;
                    })
                  }
                >
                  Rechercher
                </button>
                <button
                  className="btn-primary"
                  disabled={busy === "gmail-draft"}
                  onClick={() =>
                    run("gmail-draft", async () => {
                      const json = await requestJson<{ data: { message: string } }>(
                        "/api/integrations/gmail/create-draft",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            to: "prospect@example.com",
                            subject: "Relance Prodecta",
                            body: buildFollowupTemplate()
                          })
                        }
                      );
                      return json.data.message;
                    })
                  }
                >
                  Creer brouillon
                </button>
              </div>
            ) : null}
          </IntegrationCard>
        ))}
      </div>

      {result ? (
        <Panel title="Dernier resultat" icon={Check}>
          <p className="text-sm font-semibold text-ink">{result}</p>
        </Panel>
      ) : null}
    </section>
  );
}

function adviceTarget(cta: SalesAdvice["cta"]): ViewId {
  if (cta === "Preparer") return "meetings";
  if (cta === "Relancer") return "followups";
  if (cta === "Creer tache") return "tasks";
  if (cta === "Creer brouillon") return "gmail";
  return "prospects";
}

function priorityTarget(item: DailyPriorityItem): ViewId {
  if (item.source === "calendar") return "meetings";
  if (item.source === "gmail") return "gmail";
  if (item.source === "tasks") return "tasks";
  if (item.cta === "Creer tache") return "tasks";
  return "followups";
}

function DashboardList({
  title,
  empty,
  children
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasItems = Array.isArray(children) ? children.some(Boolean) : Boolean(children);
  return (
    <div className="min-w-0 rounded-md border border-line bg-slate-50 p-3">
      <h3 className="font-bold">{title}</h3>
      <div className="mt-3 space-y-2">{hasItems ? children : <EmptyText text={empty} />}</div>
    </div>
  );
}

function PriorityActionRow({
  item,
  index,
  onClick
}: {
  item: DailyPriorityItem;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      className="min-w-0 w-full rounded-md border border-line bg-white p-3 text-left shadow-sm transition hover:border-teal hover:bg-teal/5"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-sm font-black text-ink">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge value={item.priority} />
            <span className="rounded-full border border-line px-2 py-1 text-xs font-bold uppercase text-muted">
              {sourceLabel(item.source)}
            </span>
          </div>
          <div className="mt-2 font-black text-ink">{item.title}</div>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{item.detail}</p>
          <p className="mt-2 text-sm font-semibold text-ink">{item.action}</p>
          <p className="mt-1 text-xs font-semibold text-teal">{item.reason}</p>
        </div>
        <span className="shrink-0 rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">{item.cta}</span>
      </div>
    </button>
  );
}

function ProspectActionRow({
  prospect,
  cta,
  onClick
}: {
  prospect: SalesProspect;
  cta: string;
  onClick: () => void;
}) {
  const detail = [
    prospect.nextAction || "Next step a definir",
    prospect.nextActionDate ? formatDate(prospect.nextActionDate) : "",
    prospect.priorityReasons?.[0] || ""
  ]
    .filter(Boolean)
    .join(" - ");
  return (
    <ActionRow
      title={prospect.company}
      detail={detail || prospect.enrichedNotes || prospect.notes || "Contexte a qualifier"}
      cta={cta}
      onClick={onClick}
    />
  );
}

function FollowupOpportunityRow({
  opportunity,
  onClick
}: {
  opportunity: FollowupOpportunity;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full rounded-md border border-line bg-white p-3 text-left transition hover:border-teal hover:bg-teal/5"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge value={opportunity.priority} />
            <span className="rounded-full border border-line px-2 py-1 text-xs font-bold uppercase text-muted">
              {sourceLabel(opportunity.source)}
            </span>
          </div>
          <div className="mt-2 font-bold">{opportunity.company}</div>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{opportunity.reason}</p>
          <p className="mt-2 text-sm font-semibold text-teal">{opportunity.recommendedAngle}</p>
        </div>
        <span className="shrink-0 rounded-full bg-teal/10 px-2 py-1 text-xs font-bold text-teal">
          {opportunity.cta}
        </span>
      </div>
    </button>
  );
}

function sourceLabel(source: DailyPriorityItem["source"] | FollowupOpportunity["source"] | TaskSuggestion["source"]) {
  const labels = {
    airtable: "Airtable",
    gmail: "Gmail",
    calendar: "Calendar",
    tasks: "Tasks"
  } as const;
  return labels[source];
}

function ActionRow({
  title,
  detail,
  cta,
  onClick
}: {
  title: string;
  detail: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button className="min-w-0 w-full rounded-md border border-line bg-white p-3 text-left hover:border-teal hover:bg-teal/5" onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-bold">{title}</div>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{detail}</p>
        </div>
        <span className="shrink-0 rounded-full bg-teal/10 px-2 py-1 text-xs font-bold text-teal">{cta}</span>
      </div>
    </button>
  );
}

function GmailThreadGroup({
  title,
  empty,
  children
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasItems = Array.isArray(children) ? children.some(Boolean) : Boolean(children);
  return (
    <div className="min-w-0 rounded-md border border-line bg-slate-50 p-3">
      <h3 className="font-bold">{title}</h3>
      <div className="mt-3 space-y-3">{hasItems ? children : <EmptyText text={empty} />}</div>
    </div>
  );
}

function GmailThreadCard({ thread, onUse }: { thread: GmailThreadSummary; onUse: () => void }) {
  return (
    <div className="rounded-md border border-line bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold">{thread.subject}</div>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{thread.snippet}</p>
        </div>
        <PriorityBadge value={thread.needsReply ? "urgent" : thread.commercialStatus === "en_attente_reponse" ? "haute" : "moyenne"} />
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-muted">
        <span>{thread.lastMessageFromMe ? "Dernier mail envoye" : "Dernier mail recu"}</span>
        <span>{thread.daysSinceLastMessage ?? 0} j</span>
        <span>{thread.prospectName || "prospect a lier"}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="btn-secondary" onClick={() => copyText(thread.snippet)}>
          <ClipboardCopy className="h-4 w-4" />
          Copier
        </button>
        <button className="btn-primary" onClick={onUse}>
          <FileText className="h-4 w-4" />
          Brouillon
        </button>
      </div>
    </div>
  );
}

function TaskBucket({
  title,
  tasks,
  onComplete
}: {
  title: string;
  tasks: CommercialTask[];
  onComplete: (task: CommercialTask) => void;
}) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-slate-50 p-3">
      <h3 className="font-bold">{title}</h3>
      <div className="mt-3 space-y-2">
        {tasks.length ? (
          tasks.map((task) => (
            <div key={task.id} className="rounded-md border border-line bg-white p-3">
              <div className={clsx("font-bold", task.status === "completed" && "line-through text-muted")}>
                {task.title}
              </div>
              <div className="mt-1 text-sm text-muted">{formatDate(task.due)} - {task.prospectName || task.source}</div>
              {task.notes ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{task.notes}</p> : null}
              <button className="btn-secondary mt-3 w-full" disabled={task.status === "completed"} onClick={() => onComplete(task)}>
                Terminer
              </button>
            </div>
          ))
        ) : (
          <EmptyText text="Aucune tache." />
        )}
      </div>
    </div>
  );
}

function AdviceCard({ advice, onAction }: { advice: SalesAdvice; onAction: () => void }) {
  const tone =
    advice.priority === "haute"
      ? "border-coral/30 bg-coral/5"
      : advice.priority === "moyenne"
        ? "border-gold/30 bg-gold/10"
        : "border-teal/20 bg-teal/5";
  return (
    <div className={clsx("rounded-md border p-4 text-sm", tone)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-muted">{advice.priority}</div>
          <div className="mt-1 font-black text-ink">{advice.title}</div>
        </div>
        <button className="icon-button" title="Copier conseil" onClick={() => copyText(advice.template)}>
          <ClipboardCopy className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 leading-6 text-muted">{advice.insight}</p>
      <p className="mt-2 font-semibold text-ink">{advice.action}</p>
      <button className="btn-secondary mt-3 w-full" onClick={onAction}>
        {advice.cta}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function IntegrationCard({
  status,
  children
}: {
  status: IntegrationStatus;
  children?: React.ReactNode;
}) {
  const tone = {
    connected: "border-teal/25 bg-teal/5 text-teal",
    assisted: "border-navy/20 bg-navy/5 text-navy",
    needs_reauth: "border-gold/30 bg-gold/10 text-gold",
    insufficient_permissions: "border-gold/30 bg-gold/10 text-gold",
    not_configured: "border-line bg-slate-50 text-muted",
    error: "border-coral/30 bg-coral/5 text-coral"
  } satisfies Record<IntegrationStatus["state"], string>;
  return (
    <Panel title={status.label} icon={Folder}>
      <div className="space-y-4">
        <div className={clsx("rounded-md border px-3 py-2 text-sm font-semibold", tone[status.state])}>
          {integrationStateLabel(status.state)}
        </div>
        <p className="text-sm leading-6 text-muted">{status.detail}</p>
        {children}
      </div>
    </Panel>
  );
}

function integrationStateLabel(state: IntegrationStatus["state"]) {
  const labels = {
    connected: "Connecte",
    not_configured: "Non configure",
    needs_reauth: "Reauth requise",
    insufficient_permissions: "Permissions insuffisantes",
    assisted: "Mode assiste",
    error: "Erreur"
  } satisfies Record<IntegrationStatus["state"], string>;
  return labels[state];
}

function TrainingModuleSpotlight({ module }: { module: (typeof trainingModules)[number] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold uppercase text-teal">
            {module.level}
          </span>
          {module.keyPrinciples.map((principle) => (
            <span key={principle} className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-muted">
              {principle}
            </span>
          ))}
        </div>
        <p className="mt-4 text-lg font-semibold leading-8 text-ink">{module.goal}</p>
        <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-muted">{module.whyItMatters}</p>
      </div>
      <SmallMessage title="Script pret a dire" text={module.script} />
    </div>
  );
}

function TrainingModuleRow({
  module,
  active,
  onSelect
}: {
  module: (typeof trainingModules)[number];
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={clsx(
        "w-full rounded-md border p-3 text-left transition",
        active ? "border-teal bg-teal/5" : "border-line bg-white hover:border-teal hover:bg-teal/5"
      )}
      onClick={onSelect}
    >
      <div className="font-bold">{module.title}</div>
      <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{module.goal}</p>
    </button>
  );
}

function TrainingDrillRow({ drill }: { drill: (typeof trainingDrills)[number] }) {
  return (
    <div className="rounded-md border border-line bg-white p-3 text-sm">
      <div className="font-bold">{drill.title}</div>
      <p className="mt-1 text-muted">{drill.situation}</p>
      <p className="mt-2 rounded-md bg-teal/5 p-2 font-semibold text-teal">{drill.expectedMove}</p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  onClick
}: {
  title: string;
  value: string;
  detail: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="text-xs font-bold uppercase tracking-wide text-muted">{title}</div>
      <div className="mt-2 truncate text-2xl font-black text-ink">{value}</div>
      <div className="mt-1 text-sm text-muted">{detail}</div>
    </>
  );

  if (onClick) {
    return (
      <button className="rounded-md border border-line bg-white p-4 text-left shadow-sm transition hover:border-teal hover:bg-teal/5" onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className="rounded-md border border-line bg-white p-4 shadow-sm">{content}</div>;
}

function PriorityBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone = ["urgent", "purchase", "chaud", "proposition"].includes(normalized)
    ? "bg-coral/10 text-coral"
    : ["haute", "aujourd'hui", "today"].includes(normalized)
      ? "bg-gold/10 text-gold"
      : ["gagne", "moyenne"].includes(normalized)
        ? "bg-teal/10 text-teal"
        : "bg-slate-100 text-muted";
  return <span className={clsx("rounded-full px-2 py-1 text-xs font-bold", tone)}>{value}</span>;
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-line bg-slate-50 p-3 text-sm">
      <div className="font-bold text-ink">{title}</div>
      <p className="mt-2 leading-6 text-muted">{text}</p>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-bold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-muted">
            <Check className="mt-1 h-4 w-4 shrink-0 text-teal" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      <input className="input mt-1" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      <textarea className="input mt-1 resize-y" rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      <select className="input mt-1" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MessageBox({ title, subject, body }: { title: string; subject: string; body: string }) {
  return (
    <div className="rounded-md border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-muted">{title}</div>
          <div className="mt-2 font-bold">{subject}</div>
        </div>
        <button className="icon-button" title="Copier" onClick={() => copyText(`${subject}\n\n${body}`)}>
          <ClipboardCopy className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}

function SmallMessage({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-line bg-white p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="font-bold">{title}</div>
        <button className="icon-button" title="Copier" onClick={() => copyText(text)}>
          <ClipboardCopy className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 whitespace-pre-wrap leading-6 text-muted">{text}</p>
    </div>
  );
}

function StatusLine({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <Check className={clsx("h-4 w-4", active ? "text-teal" : "text-muted")} />
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed border-line bg-slate-50 p-4 text-sm text-muted">{text}</div>;
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-coral/30 bg-coral/5 p-3 text-sm font-medium text-coral">
      {message}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
  className,
  bodyClassName
}: {
  title: string;
  icon: typeof Home;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={clsx("min-w-0 rounded-md border border-line bg-white shadow-sm", className)}>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-5 w-5 shrink-0 text-teal" />
          <h2 className="truncate text-base font-bold">{title}</h2>
        </div>
      </div>
      <div className={clsx("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
