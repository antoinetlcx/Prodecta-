"use client";

import { ChangeEvent, useEffect, useMemo, useSyncExternalStore, useState } from "react";
import clsx from "clsx";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCopy,
  Download,
  FileAudio,
  FileText,
  Folder,
  Gauge,
  Handshake,
  Home,
  Lightbulb,
  Mail,
  Mic,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
  UserRound
} from "lucide-react";
import type {
  CommercialReport,
  DealMaturity,
  FollowupStrategy,
  IntegrationStatus,
  LiveCoachingEvent,
  LiveSignalDetection,
  LiveTranscriptSegment,
  MeetingContext,
  MeetingType,
  NegotiationStrategy,
  ObjectionStrategy,
  Preparation
} from "@/lib/types";
import { useRealtimeMeeting } from "@/lib/use-realtime-meeting";
import {
  buildNegotiationFallback,
  buildObjectionFallback,
  buildFollowupFallback,
  buildPreparationFallback,
  buildReportFallback,
  copilotSteps,
  defaultMeetingContext,
  liveSignals,
  objectionPlaybook,
  psychologyCards,
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
import type { Sector, StoredFollowup, StoredReport, TrainingCategory } from "@/lib/types";

type ViewId =
  | "home"
  | "prepare"
  | "call"
  | "analyze"
  | "relance"
  | "negociation"
  | "library"
  | "integrations";

type LibraryTab = "resume" | "methode" | "scripts" | "drills" | "eviter";

type ApiEnvelope<T> = {
  demoMode: boolean;
  model: string;
  data: T;
};

const navItems: Array<{ id: ViewId; label: string; icon: typeof Home }> = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "prepare", label: "Preparation RDV", icon: Calendar },
  { id: "call", label: "Call Copilot", icon: Mic },
  { id: "analyze", label: "Analyse RDV", icon: BarChart3 },
  { id: "relance", label: "Relance Lab", icon: Send },
  { id: "negociation", label: "Objection & prix", icon: CircleDollarSign },
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
  if (!response.ok) {
    throw new Error(readApiErrorText(text, response.status));
  }

  return JSON.parse(text) as ApiEnvelope<T>;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(readApiErrorText(text, response.status));
  }

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
    // Some local/embedded browsers block Clipboard API writes even on user click.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
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

function preparationToText(preparation: Preparation) {
  return [
    `Angle: ${preparation.primaryAngle}`,
    `Ouverture: ${preparation.openingLine}`,
    `Questions:\n- ${preparation.priorityQuestions.join("\n- ")}`,
    `Objections probables:\n- ${preparation.likelyObjections.join("\n- ")}`,
    `Leviers:\n- ${preparation.influenceLevers.join("\n- ")}`,
    `Preuves:\n- ${preparation.proofToShow.join("\n- ")}`,
    `Closing: ${preparation.targetClosing}`,
    `Erreurs a eviter:\n- ${preparation.mistakesToAvoid.join("\n- ")}`
  ].join("\n\n");
}

export function ProdectaApp() {
  const [activeView, setActiveView] = useState<ViewId>("call");
  const [context, setContext] = useLocalState<MeetingContext>(
    STORAGE_KEYS.meetingContext,
    defaultMeetingContext
  );
  const [reports, setReports] = useLocalState<StoredReport[]>(STORAGE_KEYS.reports, []);
  const [followups, setFollowups] = useLocalState<StoredFollowup[]>(STORAGE_KEYS.followups, []);
  const [liveNotes, setLiveNotes] = useLocalState<string[]>(STORAGE_KEYS.liveNotes, [
    "14:02 - Sophie gere aussi la communication.",
    "14:05 - Saison haute : mai a septembre.",
    "14:09 - Souhaite plus de reservations directes."
  ]);
  const [signals, setSignals] = useLocalState<string[]>(STORAGE_KEYS.signals, [
    "prix",
    "associe"
  ]);

  const [currentStep, setCurrentStep] = useState(2);
  const [selectedSignalId, setSelectedSignalId] = useState("prix");
  const [selectedPsychologyId, setSelectedPsychologyId] = useState("contraste");
  const [speakerCounts, setSpeakerCounts] = useState({ seller: 52, prospect: 48 });
  const [notice, setNotice] = useState<string | null>(null);

  const latestReport = reports[0]?.report;
  const activeStep = copilotSteps[currentStep];
  const activeSignal = liveSignals.find((signal) => signal.id === selectedSignalId) ?? liveSignals[0];
  const activePsychology =
    psychologyCards.find((card) => card.id === selectedPsychologyId) ?? psychologyCards[0];
  const realtime = useRealtimeMeeting({
    context,
    currentStepId: activeStep.id,
    manualSignals: signals
  });

  function addSignal(id: string) {
    setSignals((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setSelectedSignalId(id);
  }

  function addNote(note: string) {
    if (!note.trim()) return;
    const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setLiveNotes((prev) => [`${time} - ${note.trim()}`, ...prev].slice(0, 12));
  }

  function resetLocalData() {
    clearProdectaData();
    setReports([]);
    setFollowups([]);
    setLiveNotes([]);
    setSignals([]);
    setContext(defaultMeetingContext);
    setNotice("Donnees locales supprimees.");
  }

  const talkTotal = speakerCounts.seller + speakerCounts.prospect;
  const sellerRatio = Math.round((speakerCounts.seller / talkTotal) * 100);

  return (
    <div className="min-h-screen bg-canvas text-graphite">
      <div className="grid min-h-screen grid-cols-[244px_1fr] max-xl:grid-cols-[88px_1fr] max-md:grid-cols-1">
        <Sidebar activeView={activeView} onChange={setActiveView} />
        <main className="min-w-0">
          <TopBar
            context={context}
            listening={realtime.isRunning}
            statusLabel={realtimeStatusLabel(realtime.status)}
            onToggleListening={() => {
              if (realtime.isRunning) {
                realtime.stop();
                return;
              }

              setActiveView("call");
              void realtime.start({ includeTabAudio: true });
            }}
          />
          <MobileNav activeView={activeView} onChange={setActiveView} />

          {notice ? (
            <div className="mx-6 mt-4 flex items-center justify-between rounded-md border border-teal/20 bg-teal/5 px-4 py-3 text-sm text-teal">
              <span>{notice}</span>
              <button className="font-semibold" onClick={() => setNotice(null)}>
                Fermer
              </button>
            </div>
          ) : null}

          {activeView === "home" ? (
            <HomeView
              context={context}
              reports={reports}
              followups={followups}
              onNavigate={setActiveView}
              onExport={() => downloadText("prodecta-sales-pilot-export.json", exportProdectaData())}
              onClear={resetLocalData}
            />
          ) : null}

          {activeView === "prepare" ? (
            <PrepareView context={context} onContextChange={setContext} onNotice={setNotice} />
          ) : null}

          {activeView === "call" ? (
            <CallCopilotView
              context={context}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              activeStep={activeStep}
              signals={signals}
              addSignal={addSignal}
              selectedSignalId={selectedSignalId}
              setSelectedSignalId={setSelectedSignalId}
              activeSignal={activeSignal}
              activePsychology={activePsychology}
              selectedPsychologyId={selectedPsychologyId}
              setSelectedPsychologyId={setSelectedPsychologyId}
              liveNotes={liveNotes}
              addNote={addNote}
              speakerCounts={speakerCounts}
              setSpeakerCounts={setSpeakerCounts}
              sellerRatio={sellerRatio}
              realtime={realtime}
              onNavigate={setActiveView}
            />
          ) : null}

          {activeView === "analyze" ? (
            <AnalyzeView
              context={context}
              latestReport={latestReport}
              onReport={(report) => {
                setReports((prev) => [
                  {
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString(),
                    prospectName: context.prospectName,
                    score: report.commercialTemperature.score,
                    report
                  },
                  ...prev
                ]);
                setNotice("Rapport sauvegarde localement.");
              }}
            />
          ) : null}

          {activeView === "relance" ? (
            <RelanceView
              context={context}
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

          {activeView === "negociation" ? <NegotiationView context={context} /> : null}

          {activeView === "library" ? <LibraryView context={context} /> : null}

          {activeView === "integrations" ? (
            <IntegrationsView
              context={context}
              latestReport={latestReport}
              latestFollowup={followups[0]}
            />
          ) : null}
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
            Conformite
          </div>
          <div className="mt-3 space-y-2 text-xs text-muted">
            <div className="flex justify-between">
              <span>Consentement</span>
              <Check className="h-4 w-4 text-teal" />
            </div>
            <div className="flex justify-between">
              <span>Audio supprime</span>
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
    <nav className="sticky top-[170px] z-10 hidden border-b border-line bg-white/95 px-4 py-3 backdrop-blur max-md:block">
      <div className="flex gap-2 overflow-x-auto pb-1 thin-scrollbar">
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

function TopBar({
  context,
  listening,
  statusLabel,
  onToggleListening
}: {
  context: MeetingContext;
  listening: boolean;
  statusLabel: string;
  onToggleListening: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-24 items-center justify-between border-b border-line bg-white/95 px-6 backdrop-blur max-lg:flex-wrap max-lg:gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Timeline Commerciale</h1>
        <p className="text-sm text-muted">Votre copilote commercial en temps reel</p>
      </div>

      <div className="flex min-w-[360px] max-w-xl flex-1 items-center rounded-md border border-line bg-white px-3 py-2 shadow-sm max-lg:min-w-full">
        <Search className="mr-2 h-4 w-4 text-muted" />
        <input
          className="w-full bg-transparent text-sm outline-none"
          placeholder="Rechercher un prospect, un RDV..."
        />
        <kbd className="rounded border border-line px-1.5 py-0.5 text-xs text-muted">K</kbd>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 border-l border-line pl-4 text-sm lg:flex">
          <Calendar className="h-5 w-5 text-coral" />
          <div>
            <div className="font-semibold">RDV en cours</div>
            <div className="text-xs text-muted">14 mai 2025 - 14:00</div>
          </div>
        </div>
        <button
          onClick={onToggleListening}
          className={clsx(
            "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold",
            listening
              ? "border-teal/30 bg-teal/10 text-teal"
              : "border-line bg-white text-muted hover:text-ink"
          )}
        >
          {listening ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {listening ? "Ecoute active" : "Lancer live"}
        </button>
        <div className="rounded-md border border-line bg-white px-4 py-2 text-sm">
          <div className="font-semibold">Realtime</div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className={clsx("h-2 w-2 rounded-full", listening ? "bg-teal" : "bg-muted")} />
            {statusLabel}
          </div>
        </div>
      </div>
    </header>
  );
}

function realtimeStatusLabel(status: ReturnType<typeof useRealtimeMeeting>["status"]) {
  const labels = {
    idle: "Pret",
    permission: "Permissions",
    connecting: "Connexion",
    connected: "Live",
    coaching: "Coaching",
    stopping: "Arret",
    "missing-key": "Cle API requise",
    unsupported: "Non supporte",
    error: "Erreur"
  } satisfies Record<ReturnType<typeof useRealtimeMeeting>["status"], string>;

  return labels[status];
}

function HomeView({
  context,
  reports,
  followups,
  onNavigate,
  onExport,
  onClear
}: {
  context: MeetingContext;
  reports: StoredReport[];
  followups: StoredFollowup[];
  onNavigate: (view: ViewId) => void;
  onExport: () => void;
  onClear: () => void;
}) {
  const latestScore = reports[0]?.score ?? 74;

  return (
    <section className="p-5">
      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard title="Score dernier RDV" value={`${latestScore}/100`} detail="Bon potentiel" />
        <MetricCard title="Rapports sauvegardes" value={String(reports.length)} detail="Local only" />
        <MetricCard title="Relances pretes" value={String(followups.length)} detail="Email, SMS, LinkedIn" />
        <MetricCard title="Mode donnees" value="Local" detail="Sans CRM en V1" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Panel title="Actions rapides" icon={Activity}>
          <div className="grid gap-3 md:grid-cols-3">
            <QuickAction icon={Mic} label="Lancer Call Copilot" detail="Ecoute active Realtime + manuel" onClick={() => onNavigate("call")} />
            <QuickAction icon={Upload} label="Analyser un RDV" detail="Audio, transcript, notes" onClick={() => onNavigate("analyze")} />
            <QuickAction icon={Mail} label="Preparer relance" detail="Angle, timing, message" onClick={() => onNavigate("relance")} />
            <QuickAction icon={Target} label="Preparation RDV" detail="Questions et closing" onClick={() => onNavigate("prepare")} />
            <QuickAction icon={CircleDollarSign} label="Traiter objection" detail="Prix et negociation" onClick={() => onNavigate("negociation")} />
            <QuickAction icon={BookOpen} label="Bibliotheque" detail="Methodes et scripts" onClick={() => onNavigate("library")} />
            <QuickAction icon={Folder} label="Connexions" detail="Calendar, Gmail, Airtable" onClick={() => onNavigate("integrations")} />
          </div>
        </Panel>

        <Panel title="Conformite & donnees" icon={ShieldCheck}>
          <div className="space-y-3 text-sm">
            <StatusLine label="Consentement obtenu" active={context.consentObtained} />
            <StatusLine label="Mode sans enregistrement disponible" active />
            <StatusLine label="Audio non conserve apres analyse" active />
            <p className="rounded-md bg-slate-50 p-3 text-muted">
              {`Phrase recommandee : "Pour etre sur de ne rien oublier et vous faire un compte rendu precis, j'utilise un assistant de prise de notes. Est-ce que cela vous convient ?"`}
            </p>
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
    </section>
  );
}

function PrepareView({
  context,
  onContextChange,
  onNotice
}: {
  context: MeetingContext;
  onContextChange: (context: MeetingContext) => void;
  onNotice: (notice: string) => void;
}) {
  const [draft, setDraft] = useState(context);
  const [preparation, setPreparation] = useState<Preparation>(() => buildPreparationFallback(context));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    onContextChange(draft);
    try {
      const result = await postJson<Preparation>("/api/prepare-rdv", draft);
      setPreparation(result.data);
      onNotice(result.demoMode ? "Preparation generee en mode demo local." : "Preparation IA generee.");
    } catch (err) {
      setPreparation(buildPreparationFallback(draft));
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid min-w-0 gap-4 p-5 xl:grid-cols-[390px_minmax(0,1fr)]">
      <Panel title="Preparation RDV" icon={Target}>
        <div className="space-y-3">
          <TextInput label="Prospect" value={draft.prospectName} onChange={(value) => setDraft({ ...draft, prospectName: value })} />
          <TextInput label="Interlocuteur" value={draft.contactName} onChange={(value) => setDraft({ ...draft, contactName: value })} />
          <SelectInput
            label="Secteur"
            value={draft.sector}
            onChange={(value) => setDraft({ ...draft, sector: value as Sector })}
            options={Object.entries(sectorLabels).map(([value, label]) => ({ value, label }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <SelectInput
              label="Type RDV"
              value={draft.meetingType}
              onChange={(value) => setDraft({ ...draft, meetingType: value as MeetingType })}
              options={meetingTypeOptions}
            />
            <SelectInput
              label="Maturite"
              value={draft.maturity}
              onChange={(value) => setDraft({ ...draft, maturity: value as DealMaturity })}
              options={maturityOptions}
            />
          </div>
          <TextArea label="Objectif" value={draft.objective} onChange={(value) => setDraft({ ...draft, objective: value })} rows={3} />
          <TextArea label="Contexte connu" value={draft.knownContext} onChange={(value) => setDraft({ ...draft, knownContext: value })} rows={4} />
          <TextInput label="Site" value={draft.website} onChange={(value) => setDraft({ ...draft, website: value })} />
          <TextInput label="Offre envisagee" value={draft.offer} onChange={(value) => setDraft({ ...draft, offer: value })} />
          <TextArea label="Exemples a montrer" value={draft.examplesToShow} onChange={(value) => setDraft({ ...draft, examplesToShow: value })} rows={3} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Duree prevue" value={String(draft.expectedDuration)} onChange={(value) => setDraft({ ...draft, expectedDuration: Number(value) || 60 })} />
            <TextInput label="Prix discute" value={draft.priceDiscussed} onChange={(value) => setDraft({ ...draft, priceDiscussed: value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Toggle label="Consentement obtenu" checked={draft.consentObtained} onChange={(checked) => setDraft({ ...draft, consentObtained: checked })} />
            <Toggle label="Sans enregistrement" checked={draft.noRecordingMode} onChange={(checked) => setDraft({ ...draft, noRecordingMode: checked })} />
          </div>
          {error ? <ErrorBox message={error} /> : null}
          <div className="grid gap-2 sm:grid-cols-3">
            <button className="btn-primary sm:col-span-2" onClick={generate} disabled={loading}>
              {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generer
            </button>
            <button className="btn-secondary" onClick={() => copyText(preparationToText(preparation))}>
              <ClipboardCopy className="h-4 w-4" />
              Copier
            </button>
          </div>
        </div>
      </Panel>

      <div className="min-w-0 space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard title="Secteur" value={sectorLabels[draft.sector]} detail={draft.meetingType} />
          <MetricCard title="Maturite" value={draft.maturity} detail="niveau deal" />
          <MetricCard title="Duree" value={`${draft.expectedDuration} min`} detail="cadence RDV" />
          <MetricCard title="Prix" value={draft.priceDiscussed || "A cadrer"} detail="ancrage valeur" />
        </div>
        <Panel title="Angle genere" icon={Lightbulb}>
          <div className="rounded-md border border-teal/20 bg-teal/5 p-4 text-lg font-semibold leading-8 text-teal">
            {preparation.primaryAngle}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <InfoList title="Questions prioritaires" items={preparation.priorityQuestions} />
            <InfoList title="Objections probables" items={preparation.likelyObjections} />
            <InfoList title="Leviers psychologiques" items={preparation.influenceLevers} />
            <InfoList title="Erreurs a eviter" items={preparation.mistakesToAvoid} />
          </div>
        </Panel>
        <Panel title="Ouverture et closing" icon={Handshake}>
          <TwoColumnText
            leftTitle="Phrase d'ouverture"
            left={preparation.openingLine}
            rightTitle="Closing a viser"
            right={preparation.targetClosing}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => copyText(preparationToText(preparation))}>
              <ClipboardCopy className="h-4 w-4" />
              Copier la preparation
            </button>
            <button
              className="btn-secondary"
              onClick={() => downloadText("prodecta-preparation-rdv.json", JSON.stringify(preparation, null, 2))}
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function CallCopilotView({
  context,
  currentStep,
  setCurrentStep,
  activeStep,
  signals,
  addSignal,
  selectedSignalId,
  setSelectedSignalId,
  activeSignal,
  activePsychology,
  selectedPsychologyId,
  setSelectedPsychologyId,
  liveNotes,
  addNote,
  speakerCounts,
  setSpeakerCounts,
  sellerRatio,
  realtime,
  onNavigate
}: {
  context: MeetingContext;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  activeStep: (typeof copilotSteps)[number];
  signals: string[];
  addSignal: (id: string) => void;
  selectedSignalId: string;
  setSelectedSignalId: (id: string) => void;
  activeSignal: (typeof liveSignals)[number];
  activePsychology: (typeof psychologyCards)[number];
  selectedPsychologyId: string;
  setSelectedPsychologyId: (id: string) => void;
  liveNotes: string[];
  addNote: (note: string) => void;
  speakerCounts: { seller: number; prospect: number };
  setSpeakerCounts: (counts: { seller: number; prospect: number }) => void;
  sellerRatio: number;
  realtime: ReturnType<typeof useRealtimeMeeting>;
  onNavigate: (view: ViewId) => void;
}) {
  const [noteDraft, setNoteDraft] = useState("");
  const liveSellerRatio = realtime.transcriptSegments.length ? realtime.sellerTalkRatio : sellerRatio;
  const liveBalanced = liveSellerRatio <= 58;

  return (
    <section className="p-5">
      <StepTimeline currentStep={currentStep} onChange={setCurrentStep} />

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[310px_minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Panel title="Contexte prospect" icon={UserRound}>
            <div className="space-y-4 text-sm">
              <div>
                <h2 className="text-lg font-bold">{context.prospectName}</h2>
                <p className="text-muted">{sectorLabels[context.sector]}</p>
              </div>
              <KeyValue label="Interlocuteur" value={context.contactName || "A preciser"} />
              <KeyValue label="Site web" value={context.website || "A preciser"} />
              <KeyValue label="Objectif declare" value={context.objective} />
              <button className="btn-secondary w-full" onClick={() => onNavigate("prepare")}>
                Ouvrir la fiche prospect
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </Panel>

          <Panel title="Notes en direct" icon={FileText}>
            <div className="space-y-3">
              <div className="max-h-56 space-y-2 overflow-auto pr-1 text-sm thin-scrollbar">
                {liveNotes.length ? (
                  liveNotes.map((note) => (
                    <div key={note} className="rounded-md bg-slate-50 px-3 py-2 text-ink">
                      {note}
                    </div>
                  ))
                ) : (
                  <EmptyText text="Aucune note live pour ce rendez-vous." />
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="Ajouter une note..."
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      addNote(noteDraft);
                      setNoteDraft("");
                    }
                  }}
                />
                <button
                  className="icon-button"
                  title="Ajouter"
                  onClick={() => {
                    addNote(noteDraft);
                    setNoteDraft("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Panel>

          <LiveTranscriptPanel realtime={realtime} />
        </div>

        <Panel title={`Call Copilot - ${activeStep.title}`} icon={Mic}>
          <div className="space-y-6">
            <RealtimeControlPanel context={context} realtime={realtime} onNavigate={onNavigate} />
            <CallBlock
              icon={Sparkles}
              label="Phrase a dire"
              badge="Suggeree"
              tone="teal"
              text={activeStep.phrase}
            />
            <CallBlock
              icon={Lightbulb}
              label="Question suivante"
              badge="A poser"
              tone="navy"
              text={activeStep.question}
            />
            <CallBlock
              icon={Activity}
              label="Signal a ecouter"
              badge="A surveiller"
              tone="gold"
              text={activeStep.signal}
            />
            <CallBlock
              icon={AlertTriangle}
              label="Erreur a eviter"
              badge="A eviter"
              tone="coral"
              text={activeStep.avoid}
            />

            <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-4">
              <button className="btn-secondary" onClick={() => copyText(activeStep.phrase)}>
                <ClipboardCopy className="h-4 w-4" />
                Copier
              </button>
              <button className="btn-secondary" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}>
                Precedent
              </button>
              <button className="btn-primary" onClick={() => setCurrentStep(Math.min(copilotSteps.length - 1, currentStep + 1))}>
                Etape suivante
              </button>
              <button className="btn-secondary" onClick={() => onNavigate("analyze")}>
                Rapport
              </button>
            </div>
          </div>
        </Panel>

        <div className="min-w-0 space-y-4">
          <LiveCoachPanel
            events={realtime.coachingEvents}
            detectedSignals={realtime.detectedSignals}
            nextBestAction={realtime.nextBestAction}
            onRequest={() => void realtime.requestCoaching()}
            busy={realtime.status === "coaching"}
          />

          <Panel title="Objections & signaux" icon={AlertTriangle}>
            <div className="grid grid-cols-2 gap-2">
              {liveSignals.map((signal) => (
                <button
                  key={signal.id}
                  className={clsx(
                    "rounded-md border px-3 py-2 text-sm font-semibold transition",
                    selectedSignalId === signal.id
                      ? "border-teal bg-teal text-white"
                      : "border-teal/50 bg-white text-teal hover:bg-teal/5"
                  )}
                  onClick={() => addSignal(signal.id)}
                >
                  {signal.label}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-md border border-line bg-slate-50 p-3 text-sm">
              <div className="font-bold">{activeSignal.label}</div>
              <p className="mt-2 text-muted">{activeSignal.meaning}</p>
              <p className="mt-3 font-semibold text-ink">Phrase : {activeSignal.phrase}</p>
              <p className="mt-2 text-muted">Question : {activeSignal.nextQuestion}</p>
              <p className="mt-2 text-coral">A eviter : {activeSignal.avoid}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {signals.map((id) => {
                const signal = liveSignals.find((item) => item.id === id);
                if (!signal) return null;
                return (
                  <button
                    key={id}
                    className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold"
                    onClick={() => setSelectedSignalId(id)}
                  >
                    {signal.label}
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Biais psychologiques" icon={Brain}>
            <div className="space-y-2">
              <select
                className="input"
                value={selectedPsychologyId}
                onChange={(event) => setSelectedPsychologyId(event.target.value)}
              >
                {psychologyCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.principle}
                  </option>
                ))}
              </select>
              <div className="rounded-md border border-line bg-white p-3 text-sm">
                <p className="font-semibold text-graphite">{activePsychology.useWhen}</p>
                <p className="mt-2 text-muted">{activePsychology.ethicalUse}</p>
                <p className="mt-3 rounded-md bg-teal/5 p-3 font-medium text-teal">
                  {activePsychology.phrase}
                </p>
                <p className="mt-2 text-coral">A eviter : {activePsychology.avoid}</p>
              </div>
            </div>
          </Panel>

          <Panel title="Ecoute active" icon={Gauge}>
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <div className="grid h-28 w-28 place-items-center rounded-full border-[12px] border-slate-200 border-t-teal text-center">
                <div>
                  <div className="text-2xl font-bold">{liveSellerRatio}/{100 - liveSellerRatio}</div>
                  <div className="text-xs text-muted">Vous / prospect</div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <StatusLine label={liveBalanced ? "Bon equilibre" : "Vous parlez trop"} active={liveBalanced} />
                <StatusLine label="Micro" active={realtime.micActive} />
                <StatusLine label="Audio onglet" active={realtime.tabAudioActive} />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => setSpeakerCounts({ ...speakerCounts, seller: speakerCounts.seller + 5 })}
                  >
                    Moi +5
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setSpeakerCounts({ ...speakerCounts, prospect: speakerCounts.prospect + 5 })}
                  >
                    Prospect +5
                  </button>
                </div>
                <button
                  className={realtime.isRunning ? "btn-secondary w-full" : "btn-primary w-full"}
                  onClick={() => {
                    if (realtime.isRunning) realtime.stop();
                    else void realtime.start({ includeTabAudio: true });
                  }}
                >
                  {realtime.isRunning ? "Arreter l'ecoute" : "Demarrer l'ecoute active"}
                </button>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <AfterCallCard title="Score de l'appel" value="74/100" detail="Bon potentiel, decision a confirmer" icon={Gauge} />
        <AfterCallCard title="Rapport & synthese" value="Debrief complet" detail="Signaux, risques, moments rates" icon={FileText} onClick={() => onNavigate("analyze")} />
        <AfterCallCard title="Strategie prix" value="Deux options" detail="Version essentielle + complete" icon={CircleDollarSign} onClick={() => onNavigate("negociation")} />
        <AfterCallCard title="Mail de relance" value="Pret a generer" detail="Email personnalise post-call" icon={Mail} onClick={() => onNavigate("relance")} />
      </div>
    </section>
  );
}

function RealtimeControlPanel({
  context,
  realtime,
  onNavigate
}: {
  context: MeetingContext;
  realtime: ReturnType<typeof useRealtimeMeeting>;
  onNavigate: (view: ViewId) => void;
}) {
  const status = realtimeStatusLabel(realtime.status);
  const canStart = context.consentObtained;

  return (
    <div className="rounded-md border border-teal/20 bg-teal/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "h-2.5 w-2.5 rounded-full",
                realtime.isRunning ? "bg-teal" : realtime.status === "error" ? "bg-coral" : "bg-muted"
              )}
            />
            <h3 className="font-bold text-teal">Ecoute active Realtime</h3>
          </div>
          <p className="mt-1 text-sm text-muted">
            Micro + audio d&apos;onglet si disponible. Aucun audio n&apos;est conserve.
          </p>
        </div>
        <span className="rounded-full border border-teal/20 bg-white px-3 py-1 text-xs font-bold text-teal">
          {status}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StatusLine label="Consentement" active={context.consentObtained} />
        <StatusLine label="Micro actif" active={realtime.micActive} />
        <StatusLine label="Audio onglet" active={realtime.tabAudioActive} />
      </div>

      {realtime.warning ? (
        <div className="mt-3 rounded-md border border-gold/30 bg-gold/10 p-3 text-sm text-gold">
          {realtime.warning}
        </div>
      ) : null}
      {realtime.error ? <div className="mt-3"><ErrorBox message={realtime.error} /></div> : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {!canStart ? (
          <button className="btn-secondary sm:col-span-2" onClick={() => onNavigate("prepare")}>
            <ShieldCheck className="h-4 w-4" />
            Valider consentement
          </button>
        ) : (
          <button
            className={realtime.isRunning ? "btn-secondary" : "btn-primary"}
            onClick={() => {
              if (realtime.isRunning) realtime.stop();
              else void realtime.start({ includeTabAudio: true });
            }}
          >
            {realtime.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {realtime.isRunning ? "Arreter" : "Demarrer"}
          </button>
        )}
        <button
          className="btn-secondary"
          disabled={realtime.status === "coaching"}
          onClick={() => void realtime.requestCoaching()}
        >
          {realtime.status === "coaching" ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          Coach
        </button>
        <button className="btn-secondary" onClick={() => copyText(realtime.transcriptText)}>
          <ClipboardCopy className="h-4 w-4" />
          Transcript
        </button>
        <button className="btn-secondary" onClick={realtime.clearTranscript}>
          <Trash2 className="h-4 w-4" />
          Effacer live
        </button>
      </div>
    </div>
  );
}

function LiveTranscriptPanel({ realtime }: { realtime: ReturnType<typeof useRealtimeMeeting> }) {
  const segments = realtime.transcriptSegments.slice(-8).reverse();

  return (
    <Panel title="Transcript live" icon={FileText}>
      <div className="space-y-3">
        <div className="max-h-72 space-y-2 overflow-auto pr-1 thin-scrollbar">
          {segments.length ? (
            segments.map((segment) => (
              <div
                key={segment.id}
                className={clsx(
                  "rounded-md border px-3 py-2 text-sm leading-6",
                  segment.final ? "border-line bg-white" : "border-teal/20 bg-teal/5"
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold uppercase text-muted">
                  <span>{segment.speaker === "unknown" ? "Interlocuteur" : segment.speaker}</span>
                  <span>{segment.final ? "final" : "live"}</span>
                </div>
                <p className="text-ink">{segment.text}</p>
              </div>
            ))
          ) : (
            <EmptyText text="Le transcript apparaitra ici des que le live entendra une prise de parole." />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-secondary" onClick={() => copyText(realtime.transcriptText)}>
            <ClipboardCopy className="h-4 w-4" />
            Copier
          </button>
          <button
            className="btn-secondary"
            onClick={() => downloadText("prodecta-transcript-live.json", JSON.stringify(realtime.transcriptSegments, null, 2))}
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>
    </Panel>
  );
}

function LiveCoachPanel({
  events,
  detectedSignals,
  nextBestAction,
  onRequest,
  busy
}: {
  events: LiveCoachingEvent[];
  detectedSignals: LiveSignalDetection[];
  nextBestAction: string | null;
  onRequest: () => void;
  busy: boolean;
}) {
  return (
    <Panel title="Coaching IA live" icon={Brain}>
      <div className="space-y-3">
        {nextBestAction ? (
          <div className="rounded-md border border-teal/20 bg-teal/5 p-3 text-sm font-semibold text-teal">
            {nextBestAction}
          </div>
        ) : null}

        {detectedSignals.length ? (
          <div className="flex flex-wrap gap-2">
            {detectedSignals.slice(0, 6).map((signal) => (
              <span
                key={signal.id}
                className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink"
                title={signal.evidence}
              >
                {signal.label}
              </span>
            ))}
          </div>
        ) : null}

        <div className="max-h-80 space-y-3 overflow-auto pr-1 thin-scrollbar">
          {events.length ? (
            events.map((event) => <LiveCoachCard key={event.id} event={event} />)
          ) : (
            <EmptyText text="Lancez le live ou cliquez Coach apres quelques notes pour obtenir des conseils." />
          )}
        </div>

        <button className="btn-primary w-full" disabled={busy} onClick={onRequest}>
          {busy ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Actualiser le coaching
        </button>
      </div>
    </Panel>
  );
}

function LiveCoachCard({ event }: { event: LiveCoachingEvent }) {
  const tone = {
    info: "border-navy/20 bg-navy/5 text-navy",
    opportunity: "border-teal/20 bg-teal/5 text-teal",
    warning: "border-gold/30 bg-gold/10 text-gold",
    urgent: "border-coral/30 bg-coral/5 text-coral"
  }[event.severity];

  return (
    <div className={clsx("rounded-md border p-3 text-sm", tone)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold">{event.title}</div>
          <p className="mt-1 leading-6 text-ink">{event.insight}</p>
        </div>
        <button
          className="icon-button"
          title="Copier la phrase"
          onClick={() => copyText(`${event.suggestedPhrase}\n\n${event.questionToAsk}`)}
        >
          <ClipboardCopy className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-3 rounded-md bg-white/80 p-3 font-semibold text-ink">{event.suggestedPhrase}</p>
      <p className="mt-2 text-ink">Question : {event.questionToAsk}</p>
      <p className="mt-2 text-muted">Levier : {event.psychologicalLever}</p>
      <p className="mt-2 text-coral">A eviter : {event.mistakeToAvoid}</p>
    </div>
  );
}

function AnalyzeView({
  context,
  latestReport,
  onReport
}: {
  context: MeetingContext;
  latestReport?: CommercialReport;
  onReport: (report: CommercialReport) => void;
}) {
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [report, setReport] = useState<CommercialReport | undefined>(
    latestReport ?? buildReportFallback(context, "")
  );
  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function transcribe(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setTranscribing(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/transcribe", { method: "POST", body: form });
      const text = await response.text();
      if (!response.ok) throw new Error(readApiErrorText(text, response.status));
      const result = JSON.parse(text) as ApiEnvelope<{ transcript: string }>;
      setTranscript(result.data.transcript);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription impossible");
    } finally {
      setTranscribing(false);
      event.target.value = "";
    }
  }

  function useLiveTranscript() {
    const stored = safeJsonParse<LiveTranscriptSegment[]>(
      typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEYS.liveTranscript),
      []
    );
    const text = stored
      .map((segment) => `${segment.speaker === "unknown" ? "Interlocuteur" : segment.speaker}: ${segment.text}`)
      .join("\n");
    setTranscript(text);
  }

  function loadSample() {
    setTranscript(
      "Commercial: Avant de parler solution, j'aimerais comprendre votre parcours client actuel.\nProspect: Aujourd'hui les clients ne se projettent pas assez avant de visiter le domaine.\nCommercial: Qu'est-ce que ca vous coute ?\nProspect: On perd du temps en appels et certains trouvent le prix eleve. Je dois aussi voir avec mon associe.\nCommercial: On peut comparer deux scenarios et valider le bon perimetre mardi."
    );
    setNotes("Signal prix, decision interne avec associe, besoin de projection avant visite.");
    setExtraContext("RDV de decouverte, proposition attendue en deux scenarios.");
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const result = await postJson<CommercialReport>("/api/analyze-rdv", {
        context,
        transcript,
        notes,
        extraContext
      });
      setReport(result.data);
      onReport(result.data);
    } catch (err) {
      const fallback = buildReportFallback(context, `${transcript}\n${notes}\n${extraContext}`);
      setReport(fallback);
      onReport(fallback);
      setError(err instanceof Error ? err.message : "Erreur analyse");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid min-w-0 gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-4">
        <Panel title="Upload audio / transcript" icon={FileAudio}>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid min-h-36 cursor-pointer place-items-center rounded-md border border-dashed border-line bg-slate-50 p-6 text-center">
              <Upload className="mb-2 h-8 w-8 text-teal" />
              <span className="font-semibold">
                {transcribing ? "Transcription en cours..." : "Importer l'audio du RDV"}
              </span>
              <span className="mt-1 text-xs text-muted">mp3, m4a, wav, webm</span>
              <input type="file" className="hidden" accept="audio/*" onChange={transcribe} />
            </label>
            <div className="rounded-md border border-line bg-white p-4 text-sm">
              <StatusLine label="Consentement obtenu" active={context.consentObtained} />
              <StatusLine label="Audio supprime apres analyse" active />
              <StatusLine label="Mode transcript colle possible" active />
              <p className="mt-3 text-muted">
                Aucun audio n&apos;est stocke localement par l&apos;app apres l&apos;appel de
                transcription.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <TextArea label="Transcript" value={transcript} onChange={setTranscript} rows={6} />
            <TextArea label="Notes commerciales" value={notes} onChange={setNotes} rows={3} />
            <TextArea label="Contexte complementaire" value={extraContext} onChange={setExtraContext} rows={2} />
            {error ? <ErrorBox message={error} /> : null}
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={analyze} disabled={loading}>
                {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generer le rapport
              </button>
              <button className="btn-secondary" onClick={useLiveTranscript}>
                <Mic className="h-4 w-4" />
                Utiliser live
              </button>
              <button className="btn-secondary" onClick={loadSample}>
                <FileText className="h-4 w-4" />
                Exemple
              </button>
              {report ? (
                <button
                  className="btn-secondary"
                  onClick={() => downloadText("prodecta-rapport-rdv.json", JSON.stringify(report, null, 2))}
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              ) : null}
            </div>
          </div>
        </Panel>

        {report ? <ReportPanel report={report} /> : null}
      </div>

      {report ? <ReportRail report={report} /> : null}
    </section>
  );
}

function RelanceView({
  context,
  onFollowup
}: {
  context: MeetingContext;
  onFollowup: (strategy: FollowupStrategy) => void;
}) {
  const [form, setForm] = useState({
    prospectName: context.prospectName,
    conversation: "",
    notes: "",
    lastReply: "",
    daysSinceLastExchange: 3,
    goal: "relancer sans pression et closer une prochaine etape",
    pressureLevel: "moyen",
    channel: "email",
    priceProposed: context.priceDiscussed
  });
  const [strategy, setStrategy] = useState<FollowupStrategy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : "Erreur relance");
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setForm({
      prospectName: context.prospectName,
      conversation:
        "Bonjour, merci pour la proposition. C'est interessant mais nous devons encore regarder le budget et en parler avec mon associe.",
      notes:
        "Le prospect aime l'idee de projection immersive mais hesite sur le prix. Decision interne a clarifier.",
      lastReply: "Je reviens vers vous apres en avoir parle.",
      daysSinceLastExchange: 3,
      goal: "obtenir un retour date et choisir entre deux scenarios",
      pressureLevel: "moyen",
      channel: "email",
      priceProposed: context.priceDiscussed || "18 000 - 28 000 EUR"
    });
  }

  return (
    <section className="grid min-w-0 gap-4 p-5 xl:grid-cols-[390px_minmax(0,1fr)]">
      <Panel title="Relance Lab" icon={Send}>
        <div className="space-y-3">
          <TextInput label="Prospect" value={form.prospectName} onChange={(value) => setForm({ ...form, prospectName: value })} />
          <TextArea label="Conversation mail" value={form.conversation} onChange={(value) => setForm({ ...form, conversation: value })} rows={4} />
          <TextArea label="Notes / contexte" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} rows={3} />
          <TextInput label="Derniere reponse" value={form.lastReply} onChange={(value) => setForm({ ...form, lastReply: value })} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput
              label="Jours depuis dernier echange"
              value={String(form.daysSinceLastExchange)}
              onChange={(value) => setForm({ ...form, daysSinceLastExchange: Number(value) || 0 })}
            />
            <TextInput label="Prix propose" value={form.priceProposed} onChange={(value) => setForm({ ...form, priceProposed: value })} />
          </div>
          <TextInput label="Objectif" value={form.goal} onChange={(value) => setForm({ ...form, goal: value })} />
          {error ? <ErrorBox message={error} /> : null}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary" disabled={loading} onClick={generate}>
              {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generer
            </button>
            <button className="btn-secondary" onClick={loadSample}>
              <FileText className="h-4 w-4" />
              Exemple
            </button>
          </div>
        </div>
      </Panel>

      <Panel title="Strategie recommandee" icon={Mail}>
        {strategy ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <InfoList
              title="Diagnostic"
              items={[
                strategy.diagnosis,
                `Objection reelle probable : ${strategy.probableRealObjection}`,
                `Timing : ${strategy.timing}`,
                `Canal : ${strategy.channel}`
              ]}
            />
            <InfoList
              title="Posture"
              items={[
                strategy.recommendedStrategy,
                strategy.pricePosture,
                strategy.nextAction
              ]}
            />
            <MessageBox title="Email pret a envoyer" subject={strategy.email.subject} body={strategy.email.body} />
            <div className="space-y-3">
              <SmallMessage title="SMS" text={strategy.sms} />
              <SmallMessage title="LinkedIn" text={strategy.linkedIn} />
              <SmallMessage title="Version directe" text={strategy.directVersion} />
              <button
                className="btn-secondary w-full"
                onClick={() => downloadText("prodecta-relance.json", JSON.stringify(strategy, null, 2))}
              >
                <Download className="h-4 w-4" />
                Export relance
              </button>
            </div>
          </div>
        ) : (
          <EmptyText text="Collez le contexte, puis genere une strategie de relance." />
        )}
      </Panel>
    </section>
  );
}

function NegotiationView({ context }: { context: MeetingContext }) {
  const [objection, setObjection] = useState("C'est trop cher.");
  const [negContext, setNegContext] = useState(context.knownContext);
  const [price, setPrice] = useState(context.priceDiscussed || "18 000 - 28 000 EUR");
  const [objectionResult, setObjectionResult] = useState<ObjectionStrategy>(() =>
    buildObjectionFallback(objection)
  );
  const [negotiation, setNegotiation] = useState<NegotiationStrategy>(() =>
    buildNegotiationFallback({ objection, context: negContext, price, prospectName: context.prospectName })
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState("Mode demo local");

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const [objectionEnvelope, negotiationEnvelope] = await Promise.all([
        postJson<ObjectionStrategy>("/api/objection", {
          objection,
          context: negContext,
          meetingMoment: "Pendant RDV"
        }),
        postJson<NegotiationStrategy>("/api/negociation", {
          prospectName: context.prospectName,
          context: negContext,
          price,
          objection,
          objective: "defendre la valeur et obtenir une prochaine etape"
        })
      ]);
      setObjectionResult(objectionEnvelope.data);
      setNegotiation(negotiationEnvelope.data);
      setSourceLabel(
        objectionEnvelope.demoMode || negotiationEnvelope.demoMode
          ? "Mode demo local"
          : "Analyse OpenAI"
      );
    } catch (err) {
      setObjectionResult(buildObjectionFallback({ objection, context: negContext, price }));
      setNegotiation(buildNegotiationFallback({ objection, context: negContext, price, prospectName: context.prospectName }));
      setSourceLabel("Fallback local");
      setError(err instanceof Error ? err.message : "Erreur strategie");
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setObjection("Elle veut pas d'argent, le budget est trop serre pour ce projet.");
    setNegContext(
      "Le prospect veut mieux valoriser son lieu en ligne, mais la direction a peur du risque financier. Il faut proposer un perimetre essentiel sans pression."
    );
    setPrice("18 000 - 28 000 EUR");
  }

  return (
    <section className="grid min-w-0 gap-4 p-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Panel title="Traiter une objection" icon={AlertTriangle}>
        <div className="space-y-3">
          <TextArea label="Objection client" value={objection} onChange={setObjection} rows={3} />
          <TextArea label="Contexte" value={negContext} onChange={setNegContext} rows={4} />
          <TextInput label="Prix / fourchette" value={price} onChange={setPrice} />
          <div className="rounded-md border border-teal/20 bg-teal/5 px-3 py-2 text-sm font-semibold text-teal">
            {sourceLabel}
          </div>
          {error ? <ErrorBox message={error} /> : null}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary" onClick={generate} disabled={loading}>
              {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generer
            </button>
            <button className="btn-secondary" onClick={loadSample}>
              <FileText className="h-4 w-4" />
              Exemple prix
            </button>
          </div>
        </div>
      </Panel>

      <div className="min-w-0 space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <NegotiationActionBlock
            title="Phrase a dire"
            value={objectionResult.phraseToSay}
            icon={Lightbulb}
            tone="teal"
          />
          <NegotiationActionBlock
            title="Question"
            value={objectionResult.questionToAsk}
            icon={Target}
            tone="navy"
          />
          <NegotiationActionBlock
            title="Strategie prix"
            value={negotiation.valueAnchor}
            icon={CircleDollarSign}
            tone="gold"
          />
          <NegotiationActionBlock
            title="Concession"
            value={negotiation.concessionRules[0] ?? "Pas de remise sans contrepartie claire."}
            icon={Handshake}
            tone="coral"
          />
        </div>

        <Panel title="Plan d'action objection & prix" icon={Lightbulb}>
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <InfoList
              title="Diagnostic"
              items={[
                objectionResult.diagnosis,
                `Risque : ${objectionResult.riskLevel}`,
                `A eviter : ${objectionResult.mistakeToAvoid}`,
                objectionResult.nextAction
              ]}
            />
            <InfoList
              title={negotiation.recommendedStrategy}
              items={[
                negotiation.diagnosis,
                `Phrase prix : ${negotiation.phraseToSay}`,
                `A eviter : ${negotiation.phraseToAvoid}`,
                `Suite : ${negotiation.nextStep}`
              ]}
            />
          </div>
          <div className="mt-4 rounded-md border border-teal/20 bg-teal/5 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-teal">Reponse complete prete</div>
            <p className="mt-2 text-sm font-semibold leading-7 text-teal">
              {objectionResult.phraseToSay} {objectionResult.questionToAsk}
            </p>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              className="btn-secondary"
              onClick={() => copyText(`${objectionResult.phraseToSay}\n\n${objectionResult.questionToAsk}`)}
            >
              <ClipboardCopy className="h-4 w-4" />
              Copier reponse
            </button>
            <button className="btn-secondary" onClick={() => copyText(negotiation.phraseToSay)}>
              <ClipboardCopy className="h-4 w-4" />
              Copier prix
            </button>
            <button
              className="btn-secondary"
              onClick={() => downloadText("prodecta-negociation.json", JSON.stringify({ objectionResult, negotiation }, null, 2))}
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function NegotiationActionBlock({
  title,
  value,
  icon: Icon,
  tone
}: {
  title: string;
  value: string;
  icon: typeof Home;
  tone: "teal" | "navy" | "gold" | "coral";
}) {
  const color = {
    teal: "border-teal/20 bg-teal/5 text-teal",
    navy: "border-navy/20 bg-navy/5 text-navy",
    gold: "border-gold/30 bg-gold/10 text-gold",
    coral: "border-coral/30 bg-coral/5 text-coral"
  }[tone];

  return (
    <button
      className={clsx("min-h-44 rounded-md border p-4 text-left shadow-sm transition hover:-translate-y-0.5", color)}
      onClick={() => copyText(value)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-bold uppercase tracking-wide">{title}</div>
        <Icon className="h-5 w-5 shrink-0" />
      </div>
      <p className="mt-3 line-clamp-5 text-sm font-semibold leading-6 text-ink">{value}</p>
    </button>
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
  const categoryCounts = useMemo(
    () =>
      trainingCategories.reduce<Record<string, number>>((acc, category) => {
        acc[category.id] =
          category.id === "exercices"
            ? trainingDrills.length
            : trainingModules.filter((module) => module.category === category.id).length;
        return acc;
      }, {}),
    []
  );
  const moduleMatches = (module: (typeof trainingModules)[number]) => {
    const searchable = [
      module.title,
      module.goal,
      module.whyItMatters,
      module.script,
      module.keyPrinciples.join(" "),
      module.howToApply.join(" ")
    ]
      .join(" ")
      .toLowerCase();
    return !normalizedQuery || searchable.includes(normalizedQuery);
  };
  const drillMatches = (drill: (typeof trainingDrills)[number]) => {
    const searchable = [drill.title, drill.situation, drill.objective, drill.expectedMove]
      .join(" ")
      .toLowerCase();
    return !normalizedQuery || searchable.includes(normalizedQuery);
  };
  const filteredModules = trainingModules.filter((module) => {
    const matchesCategory =
      Boolean(normalizedQuery) || module.category === activeCategory || activeCategory === "exercices";
    return matchesCategory && moduleMatches(module);
  });
  const filteredDrills = trainingDrills.filter((drill) => {
    const matchesCategory =
      Boolean(normalizedQuery) || activeCategory === "exercices" || drill.category === activeCategory;
    return matchesCategory && drillMatches(drill);
  });
  const selectedModule =
    filteredModules.find((module) => module.id === selectedModuleId) ?? filteredModules[0] ?? trainingModules[0];
  const categoryModules = trainingModules.filter((module) => module.category === activeCategory);
  const selectedDrills = filteredDrills.length
    ? filteredDrills
    : trainingDrills.filter((drill) => drill.category === activeCategory);
  const selectedDrill =
    selectedDrills[0] ??
    trainingDrills.find((drill) => drill.category === activeCategory) ??
    trainingDrills[0];
  const quickObjections = objectionPlaybook.filter((item) =>
    ["prix", "pas-argent", "associe", "pas-prioritaire", "concurrence"].includes(item.id)
  );
  const activeScript =
    prodectaScripts.find((script) =>
      selectedModule?.title.toLowerCase().includes(script.moment.toLowerCase())
    ) ?? prodectaScripts.find((script) => script.moment === "Prix") ?? prodectaScripts[0];
  const linkedObjection =
    quickObjections.find((item) =>
      selectedModule
        ? item.triggers.some((trigger) =>
            `${selectedModule.title} ${selectedModule.goal} ${selectedModule.script}`
              .toLowerCase()
              .includes(trigger.toLowerCase())
          )
        : false
    ) ?? quickObjections[0];

  function openCategory(categoryId: TrainingCategory) {
    setActiveCategory(categoryId);
    setActiveTab("resume");
    const firstModule = trainingModules.find((module) => module.category === categoryId);
    if (firstModule) setSelectedModuleId(firstModule.id);
  }

  function openObjectionPlaybook() {
    setQuery("");
    setActiveCategory("objections");
    setActiveTab("scripts");
    const priceModule = trainingModules.find((module) => module.id === "price-objection");
    if (priceModule) setSelectedModuleId(priceModule.id);
  }

  return (
    <section className="min-w-0 space-y-4 p-5">
      <Panel title="Academie commerciale Prodecta" icon={BookOpen}>
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4">
            <div className="rounded-md border border-teal/20 bg-teal/5 p-4">
              <h3 className="text-lg font-black text-teal">Camp d&apos;entrainement commercial</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                Choisis une section, ouvre seulement ce dont tu as besoin, copie le script, puis entraine-toi avec un drill. Influence oui, pression et mensonge non.
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
                    "flex min-h-16 items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-bold transition",
                    activeCategory === category.id && !normalizedQuery
                      ? "border-teal bg-teal text-white"
                      : "border-line bg-white text-ink hover:border-teal hover:bg-teal/5 hover:text-teal"
                  )}
                  onClick={() => openCategory(category.id)}
                >
                  <span>{category.label}</span>
                  <span
                    className={clsx(
                      "rounded-full px-2 py-0.5 text-[11px]",
                      activeCategory === category.id && !normalizedQuery
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-muted"
                    )}
                  >
                    {categoryCounts[category.id] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-line bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-muted">
              A pratiquer maintenant
            </div>
            <div className="mt-2 text-lg font-black text-ink">{activeCategoryMeta.label}</div>
            <p className="mt-2 text-sm leading-6 text-muted">
              {selectedDrill?.expectedMove ?? "Ouvre un drill pour travailler un reflexe commercial."}
            </p>
            <div className="mt-4 grid gap-2">
              <button className="btn-primary" onClick={() => copyText(selectedModule?.script ?? "")}>
                <ClipboardCopy className="h-4 w-4" />
                Copier script
              </button>
              <button className="btn-secondary" onClick={() => setActiveTab("drills")}>
                <Activity className="h-4 w-4" />
                Lancer drill
              </button>
              <button className="btn-secondary" onClick={openObjectionPlaybook}>
                <AlertTriangle className="h-4 w-4" />
                Objection liee
              </button>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 md:grid-cols-4">
        <LibraryMiniStat label="Modules" value={String(trainingModules.length)} />
        <LibraryMiniStat label="Drills" value={String(trainingDrills.length)} />
        <LibraryMiniStat label="Objections" value={String(objectionPlaybook.length)} />
        <LibraryMiniStat label="Scripts" value={String(prodectaScripts.length)} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <LibraryWidget
          title="Focus"
          label={selectedModule?.title ?? activeCategoryMeta.label}
          text={selectedModule?.goal ?? activeCategoryMeta.description}
          icon={Brain}
        />
        <LibraryWidget
          title="Script utile"
          label={activeScript?.moment ?? "Script"}
          text={activeScript?.text ?? selectedModule?.script ?? ""}
          icon={Sparkles}
        />
        <LibraryWidget
          title="Regle ethique"
          label="Influence"
          text="Cadrer et aider oui. Mentir, inventer une urgence ou pousser sous pression non."
          icon={ShieldCheck}
        />
      </div>

      <Panel title={selectedModule ? selectedModule.title : `${activeCategoryMeta.label} - module`} icon={Brain}>
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
          {!selectedModule ? <EmptyText text="Aucun module ne correspond a cette recherche." /> : null}
          {selectedModule && activeTab === "resume" ? <TrainingModuleSpotlight module={selectedModule} /> : null}
          {selectedModule && activeTab === "methode" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <InfoList title="Principes cles" items={selectedModule.keyPrinciples} />
              <InfoList title="Application terrain" items={selectedModule.howToApply} />
              <div className="rounded-md border border-line bg-slate-50 p-4 lg:col-span-2">
                <div className="text-xs font-bold uppercase tracking-wide text-muted">Pourquoi c&apos;est important</div>
                <p className="mt-2 text-sm leading-7 text-ink">{selectedModule.whyItMatters}</p>
              </div>
            </div>
          ) : null}
          {selectedModule && activeTab === "scripts" ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-md border border-teal/20 bg-teal/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-teal">Script principal</div>
                    <p className="mt-3 text-base font-semibold leading-8 text-teal">{selectedModule.script}</p>
                  </div>
                  <button className="icon-button" title="Copier script" onClick={() => copyText(selectedModule.script)}>
                    <ClipboardCopy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {prodectaScripts.slice(0, 3).map((script) => (
                  <SmallMessage
                    key={script.id}
                    title={`${script.moment} - ${script.title}`}
                    text={`${script.text}\n\nPourquoi : ${script.whyItWorks}`}
                  />
                ))}
              </div>
            </div>
          ) : null}
          {activeTab === "drills" ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {selectedDrills.length ? (
                selectedDrills.map((drill) => <TrainingDrillRow key={drill.id} drill={drill} />)
              ) : (
                <EmptyText text="Aucun exercice pour cette section." />
              )}
            </div>
          ) : null}
          {selectedModule && activeTab === "eviter" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border border-coral/20 bg-coral/5 p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-coral">Erreur a eviter</div>
                <p className="mt-2 text-sm font-semibold leading-7 text-ink">{selectedModule.avoid}</p>
              </div>
              <div className="rounded-md border border-line bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-muted">Reflexe a entrainer</div>
                <p className="mt-2 text-sm leading-7 text-ink">{selectedModule.drill}</p>
              </div>
            </div>
          ) : null}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Modules disponibles" icon={Folder} bodyClassName="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            {(normalizedQuery ? filteredModules : categoryModules).length ? (
              (normalizedQuery ? filteredModules : categoryModules).map((module) => (
                <TrainingModuleRow
                  key={module.id}
                  module={module}
                  active={selectedModule?.id === module.id}
                  onSelect={() => {
                    setSelectedModuleId(module.id);
                    setActiveTab("resume");
                  }}
                />
              ))
            ) : (
              <EmptyText text="Aucun module ne correspond a cette recherche." />
            )}
          </div>
        </Panel>

        <Panel title="Playbook objection rapide" icon={AlertTriangle} bodyClassName="space-y-3">
          <div className="rounded-md border border-teal/20 bg-teal/5 p-3 text-sm">
            <div className="font-bold text-teal">{linkedObjection.label}</div>
            <p className="mt-2 text-ink">{linkedObjection.phrase}</p>
            <button
              className="btn-secondary mt-3 w-full"
              onClick={() => copyText(`${linkedObjection.phrase}\n\n${linkedObjection.question}`)}
            >
              <ClipboardCopy className="h-4 w-4" />
              Copier reponse
            </button>
          </div>
          {quickObjections.slice(0, 4).map((item) => (
            <button
              key={item.id}
              className="w-full rounded-md border border-line bg-white p-3 text-left text-sm hover:border-teal hover:bg-teal/5"
              onClick={() => copyText(`${item.phrase}\n\n${item.question}`)}
            >
              <div className="font-bold">{item.label}</div>
              <p className="mt-1 line-clamp-2 text-muted">{item.diagnosis}</p>
            </button>
          ))}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Questions terrain" icon={Target}>
          <InfoList title={sectorLabels[context.sector]} items={sectorQuestions[context.sector].slice(0, 4)} />
          <div className="mt-4 rounded-md border border-teal/20 bg-teal/5 p-3 text-sm">
            <div className="font-bold text-teal">Phrase signature</div>
            <p className="mt-2 text-ink">
              Un site classique informe. Une app immersive fait visiter, comprendre et se projeter.
            </p>
          </div>
        </Panel>

        <Panel title="Fiches memo" icon={FileText}>
          <div className="grid gap-4 md:grid-cols-2">
            {salesCheatSheets.slice(0, 4).map((sheet) => (
              <InfoList key={sheet.id} title={sheet.title} items={sheet.items.slice(0, 5)} />
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function LibraryMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-white p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-xl font-black text-ink">{value}</div>
    </div>
  );
}

function LibraryWidget({
  title,
  label,
  text,
  icon: Icon
}: {
  title: string;
  label: string;
  text: string;
  icon: typeof Home;
}) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wide text-muted">{title}</div>
          <div className="mt-1 truncate font-bold text-ink">{label}</div>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-teal/10 text-teal">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}

function TrainingModuleSpotlight({ module }: { module: (typeof trainingModules)[number] }) {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold uppercase text-teal">
            {module.level}
          </span>
          {module.keyPrinciples.slice(0, 4).map((principle) => (
            <span key={principle} className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-muted">
              {principle}
            </span>
          ))}
        </div>
        <p className="mt-4 text-lg font-semibold leading-8 text-ink">{module.goal}</p>
        <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-muted">{module.whyItMatters}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoList title="Application" items={module.howToApply.slice(0, 4)} />
          <InfoList title="A eviter" items={[module.avoid, module.drill]} />
        </div>
      </div>
      <div className="min-w-0 rounded-md border border-teal/20 bg-teal/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-teal">Script pret a dire</div>
            <p className="mt-3 text-sm font-semibold leading-7 text-teal">{module.script}</p>
          </div>
          <button className="icon-button" title="Copier script" onClick={() => copyText(module.script)}>
            <ClipboardCopy className="h-4 w-4" />
          </button>
        </div>
      </div>
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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-bold">{module.title}</div>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{module.goal}</p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted" />
      </div>
    </button>
  );
}

function TrainingDrillRow({ drill }: { drill: (typeof trainingDrills)[number] }) {
  return (
    <div className="rounded-md border border-line bg-white p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold">{drill.title}</div>
          <p className="mt-1 line-clamp-2 text-muted">{drill.situation}</p>
        </div>
        <button className="icon-button" title="Copier exercice" onClick={() => copyText(drill.expectedMove)}>
          <ClipboardCopy className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 rounded-md bg-teal/5 p-2 font-semibold text-teal">{drill.expectedMove}</p>
    </div>
  );
}

function IntegrationsView({
  context,
  latestReport,
  latestFollowup
}: {
  context: MeetingContext;
  latestReport?: CommercialReport;
  latestFollowup?: StoredFollowup;
}) {
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    title: string;
    message: string;
    detail?: string;
    url?: string;
  } | null>(null);
  const [prospectEmail, setProspectEmail] = useState("prospect@example.com");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const json = await requestJson<{ data: { statuses: IntegrationStatus[] } }>(
          "/api/integrations/status"
        );
        if (!cancelled) setStatuses(json.data.statuses);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Statut integrations impossible");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const statusByProvider = useMemo(
    () => Object.fromEntries(statuses.map((status) => [status.provider, status])),
    [statuses]
  ) as Partial<Record<IntegrationStatus["provider"], IntegrationStatus>>;

  async function refreshStatus() {
    const json = await requestJson<{ data: { statuses: IntegrationStatus[] } }>(
      "/api/integrations/status"
    );
    setStatuses(json.data.statuses);
  }

  async function runAction(
    key: string,
    title: string,
    action: () => Promise<{ message: string; detail?: string; url?: string }>
  ) {
    setBusy(key);
    setError(null);
    try {
      const nextResult = await action();
      setResult({ title, ...nextResult });
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action integration impossible");
    } finally {
      setBusy(null);
    }
  }

  const followupBody =
    latestFollowup?.strategy.email.body ??
    `Bonjour,\n\nSuite a notre echange, je vous propose de comparer deux scenarios Prodecta pour ${context.prospectName} : une version essentielle et une version complete.\n\nL'objectif est de preserver la valeur commerciale tout en cadrant le bon perimetre.\n\nBien a vous`;
  const followupSubject =
    latestFollowup?.strategy.email.subject ?? `Suite RDV Prodecta - ${context.prospectName}`;

  function buildFollowupSlot() {
    const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    start.setHours(10, 0, 0, 0);
    return {
      start,
      end: new Date(start.getTime() + 30 * 60 * 1000)
    };
  }

  return (
    <section className="min-w-0 space-y-4 p-5">
      <Panel title="Connexions commerciales" icon={Folder}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <h3 className="text-xl font-black text-ink">Brancher Prodecta a ton quotidien commercial</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Airtable pour le pipeline, Google Calendar pour les RDV, Gmail pour les brouillons et LinkedIn en mode assiste. Les tokens restent cote serveur local dans `.prodecta-local`, jamais dans le navigateur.
            </p>
          </div>
          <div className="rounded-md border border-teal/20 bg-teal/5 p-4 text-sm">
            <div className="font-bold text-teal">Regle de securite</div>
            <p className="mt-2 text-ink">
              Gmail cree uniquement des brouillons. LinkedIn prepare le message a copier. Aucun envoi automatique sans validation explicite.
            </p>
          </div>
        </div>
      </Panel>

      {loading ? (
        <div className="rounded-md border border-line bg-white p-4 text-sm text-muted">
          Chargement des connexions...
        </div>
      ) : null}
      {error ? <ErrorBox message={error} /> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <IntegrationCard
          status={statusByProvider.airtable}
          fallbackLabel="Airtable Prodecta"
          icon={Folder}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="btn-secondary"
              disabled={busy === "airtable-test"}
              onClick={() =>
                runAction("airtable-test", "Airtable", async () => {
                  const json = await requestJson<{
                    data: { message: string; tables?: Array<{ name: string }> };
                  }>("/api/integrations/airtable/discover", { method: "POST" });
                  return {
                    message: json.data.message,
                    detail: json.data.tables?.length
                      ? json.data.tables.map((table) => table.name).join(", ")
                      : "Aucun schema lu pour le moment."
                  };
                })
              }
            >
              {busy === "airtable-test" ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
              Tester
            </button>
            <button
              className="btn-primary"
              disabled={busy === "airtable-sync"}
              onClick={() =>
                runAction("airtable-sync", "Airtable", async () => {
                  const json = await requestJson<{
                    data: { message: string; state: string };
                  }>("/api/integrations/airtable/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      kind: latestReport ? "report" : "prospect",
                      payload: {
                        prospectName: context.prospectName,
                        contactName: context.contactName,
                        sector: sectorLabels[context.sector],
                        score: latestReport?.commercialTemperature.score,
                        nextAction: latestReport?.nextAction.action
                      }
                    })
                  });
                  return { message: json.data.message, detail: `Etat : ${json.data.state}` };
                })
              }
            >
              {busy === "airtable-sync" ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Exporter vers Airtable
            </button>
          </div>
        </IntegrationCard>

        <IntegrationCard
          status={statusByProvider.googleCalendar}
          fallbackLabel="Google Calendar"
          icon={Calendar}
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              className="btn-secondary"
              onClick={() => {
                window.location.href = "/api/integrations/google/oauth/start";
              }}
            >
              <Settings className="h-4 w-4" />
              Connecter
            </button>
            <button
              className="btn-secondary"
              disabled={busy === "calendar-import"}
              onClick={() =>
                runAction("calendar-import", "Google Calendar", async () => {
                  const json = await requestJson<{
                    data: { message: string; meetings: Array<{ title: string; start: string }> };
                  }>("/api/integrations/calendar/import", { method: "POST" });
                  return {
                    message: json.data.message,
                    detail: json.data.meetings.map((meeting) => `${meeting.title} - ${meeting.start}`).join("\n")
                  };
                })
              }
            >
              {busy === "calendar-import" ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Importer RDV
            </button>
            <button
              className="btn-primary"
              disabled={busy === "calendar-create"}
              onClick={() =>
                runAction("calendar-create", "Google Calendar", async () => {
                  const followupSlot = buildFollowupSlot();
                  const json = await requestJson<{
                    data: { message: string; event?: { htmlLink?: string } };
                  }>("/api/integrations/calendar/create-event", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      prospectName: context.prospectName,
                      title: `Relance Prodecta - ${context.prospectName}`,
                      start: followupSlot.start.toISOString(),
                      end: followupSlot.end.toISOString(),
                      description: `Relance commerciale Prodecta. Objectif : ${context.objective}`
                    })
                  });
                  return {
                    message: json.data.message,
                    detail: "Creneau propose : apres-demain 10:00.",
                    url: json.data.event?.htmlLink
                  };
                })
              }
            >
              {busy === "calendar-create" ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Creer RDV
            </button>
          </div>
        </IntegrationCard>

        <IntegrationCard status={statusByProvider.gmail} fallbackLabel="Gmail" icon={Mail}>
          <div className="space-y-3">
            <TextInput label="Email prospect" value={prospectEmail} onChange={setProspectEmail} />
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                className="btn-secondary"
                disabled={busy === "gmail-search"}
                onClick={() =>
                  runAction("gmail-search", "Gmail", async () => {
                    const json = await requestJson<{
                      data: { message: string; threads: Array<{ subject: string; snippet: string }> };
                    }>("/api/integrations/gmail/search", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ query: context.prospectName, prospectName: context.prospectName })
                    });
                    return {
                      message: json.data.message,
                      detail: json.data.threads.map((thread) => `${thread.subject} : ${thread.snippet}`).join("\n")
                    };
                  })
                }
              >
                {busy === "gmail-search" ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Rechercher emails
              </button>
              <button
                className="btn-primary"
                disabled={busy === "gmail-draft"}
                onClick={() =>
                  runAction("gmail-draft", "Gmail", async () => {
                    const json = await requestJson<{ data: { message: string; sent: boolean } }>(
                      "/api/integrations/gmail/create-draft",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          to: prospectEmail,
                          subject: followupSubject,
                          body: followupBody,
                          prospectName: context.prospectName
                        })
                      }
                    );
                    return {
                      message: json.data.message,
                      detail: json.data.sent ? "Envoye" : "Brouillon seulement, aucun envoi automatique."
                    };
                  })
                }
              >
                {busy === "gmail-draft" ? <RotateCcw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Creer brouillon
              </button>
            </div>
          </div>
        </IntegrationCard>

        <IntegrationCard status={statusByProvider.linkedin} fallbackLabel="LinkedIn" icon={Send}>
          <div className="space-y-3">
            <TextInput label="URL profil LinkedIn" value={linkedinUrl} onChange={setLinkedinUrl} />
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                className="btn-primary"
                disabled={busy === "linkedin-draft"}
                onClick={() =>
                  runAction("linkedin-draft", "LinkedIn", async () => {
                    const json = await requestJson<{
                      data: { message: string; draft: { text: string; profileUrl: string } };
                    }>("/api/integrations/linkedin/draft", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        prospectName: context.prospectName,
                        contactName: context.contactName,
                        profileUrl: linkedinUrl,
                        context: context.knownContext,
                        objective: context.objective
                      })
                    });
                    return {
                      message: json.data.message,
                      detail: json.data.draft.text,
                      url: json.data.draft.profileUrl
                    };
                  })
                }
              >
                {busy === "linkedin-draft" ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Creer message
              </button>
              <button
                className="btn-secondary"
                disabled={!linkedinUrl}
                onClick={() => window.open(linkedinUrl, "_blank", "noopener,noreferrer")}
              >
                <ChevronRight className="h-4 w-4" />
                Ouvrir profil
              </button>
            </div>
          </div>
        </IntegrationCard>
      </div>

      {result ? <IntegrationResultPanel result={result} /> : null}
    </section>
  );
}

function IntegrationCard({
  status,
  fallbackLabel,
  icon: Icon,
  children
}: {
  status?: IntegrationStatus;
  fallbackLabel: string;
  icon: typeof Home;
  children: React.ReactNode;
}) {
  const state = status?.state ?? "not_configured";
  const tone = {
    connected: "border-teal/25 bg-teal/5 text-teal",
    assisted: "border-navy/20 bg-navy/5 text-navy",
    needs_reauth: "border-gold/30 bg-gold/10 text-gold",
    insufficient_permissions: "border-gold/30 bg-gold/10 text-gold",
    not_configured: "border-line bg-slate-50 text-muted",
    error: "border-coral/30 bg-coral/5 text-coral"
  } satisfies Record<IntegrationStatus["state"], string>;

  return (
    <Panel title={status?.label ?? fallbackLabel} icon={Icon}>
      <div className="space-y-4">
        <div className={clsx("rounded-md border px-3 py-2 text-sm font-semibold", tone[state])}>
          {integrationStateLabel(state)}
        </div>
        <p className="text-sm leading-6 text-muted">
          {status?.detail ?? "Connexion non configuree pour le moment."}
        </p>
        {children}
      </div>
    </Panel>
  );
}

function IntegrationResultPanel({
  result
}: {
  result: { title: string; message: string; detail?: string; url?: string };
}) {
  return (
    <Panel title={`Resultat - ${result.title}`} icon={Check}>
      <div className="space-y-3 text-sm">
        <p className="font-semibold text-ink">{result.message}</p>
        {result.detail ? (
          <pre className="whitespace-pre-wrap rounded-md border border-line bg-slate-50 p-3 font-sans leading-6 text-muted">
            {result.detail}
          </pre>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {result.detail ? (
            <button className="btn-secondary" onClick={() => copyText(result.detail ?? "")}>
              <ClipboardCopy className="h-4 w-4" />
              Copier
            </button>
          ) : null}
          {result.url ? (
            <button
              className="btn-secondary"
              onClick={() => window.open(result.url, "_blank", "noopener,noreferrer")}
            >
              <ChevronRight className="h-4 w-4" />
              Ouvrir
            </button>
          ) : null}
        </div>
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

function StepTimeline({
  currentStep,
  onChange
}: {
  currentStep: number;
  onChange: (index: number) => void;
}) {
  return (
    <div className="rounded-md border border-line bg-white px-5 py-4 shadow-sm">
      <div className="grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-sm:grid-cols-1">
        {copilotSteps.slice(0, 5).map((step, index) => (
          <button key={step.id} className="text-left" onClick={() => onChange(index)}>
            <div className="flex items-center gap-3">
              <span
                className={clsx(
                  "grid h-9 w-9 place-items-center rounded-full border text-sm font-bold",
                  index < currentStep
                    ? "border-teal bg-teal text-white"
                    : index === currentStep
                      ? "border-teal text-teal"
                      : "border-line text-muted"
                )}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span className="h-px flex-1 border-t border-dashed border-line max-sm:hidden" />
            </div>
            <div className="mt-2 font-semibold">{step.title}</div>
            <div className="text-xs text-muted">{step.timing}</div>
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {copilotSteps.slice(5).map((step, offset) => {
          const index = offset + 5;
          return (
            <button
              key={step.id}
              className={clsx(
                "rounded-full border px-3 py-1 text-xs font-semibold",
                currentStep === index
                  ? "border-teal bg-teal text-white"
                  : "border-line bg-white text-muted hover:text-teal"
              )}
              onClick={() => onChange(index)}
            >
              {step.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReportPanel({ report }: { report: CommercialReport }) {
  const rows = [
    ["1", "Resume executif", report.executiveSummary],
    ["2", "Temperature commerciale", `${report.commercialTemperature.score}/100 - ${report.commercialTemperature.label}`],
    ["3", "Besoin exprime", report.expressedNeed],
    ["4", "Besoin reel", report.realNeed],
    ["5", "Douleur principale", report.pains.primary],
    ["6", "Signaux positifs", report.positiveSignals.map((item) => item.title).join(", ")],
    ["7", "Risques", report.riskSignals.map((item) => item.title).join(", ")],
    ["8", "Objections", report.objections.map((item) => item.apparent).join(", ")],
    ["9", "Performance", report.performance.diagnostic],
    ["10", "Moments rates", report.missedMoments.map((item) => item.moment).join(", ")],
    ["11", "Strategie prix", report.priceStrategy.reasoning],
    ["12", "Negociation", report.negotiationStrategy.nextMove],
    ["13", "Prochaine action", `${report.nextAction.action} - ${report.nextAction.timing}`],
    ["14", "Mail recommande", report.recommendedEmail.subject],
    ["15", "Relances suivantes", report.followups.map((item) => item.timing).join(", ")]
  ];

  return (
    <Panel title="Rapport commercial - 15 sections" icon={FileText}>
      <div className="overflow-hidden rounded-md border border-line">
        {rows.map(([number, title, detail]) => (
          <div key={number} className="grid grid-cols-[48px_220px_1fr_32px] items-center border-b border-line bg-white px-4 py-3 last:border-b-0 max-md:grid-cols-[36px_1fr] max-md:gap-2">
            <div className="text-lg text-muted">{number}</div>
            <div className="font-semibold">{title}</div>
            <div className="line-clamp-2 text-sm text-muted max-md:col-span-2">{detail}</div>
            <ChevronRight className="h-4 w-4 text-muted max-md:hidden" />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ReportRail({ report }: { report: CommercialReport }) {
  return (
    <aside className="space-y-4">
      <Panel title="Synthese IA" icon={Sparkles}>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-muted">Score global</div>
            <div className="text-5xl font-bold text-teal">{report.commercialTemperature.score}</div>
            <div className="text-sm font-semibold">{report.commercialTemperature.label}</div>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-teal"
                style={{ width: `${report.commercialTemperature.score}%` }}
              />
            </div>
          </div>
          <RailBox title="Strategie tarifaire" body={report.priceStrategy.reasoning} tone="gold" />
          <RailBox title="Posture de negociation" body={report.negotiationStrategy.posture} tone="navy" />
          <RailBox title="Prochaine action" body={`${report.nextAction.action} ${report.nextAction.timing}`} tone="teal" />
        </div>
      </Panel>
      <MessageBox title="Email recommande" subject={report.recommendedEmail.subject} body={report.recommendedEmail.body} />
    </aside>
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

function MetricCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-white p-4 shadow-sm">
      <div className="text-sm text-muted">{title}</div>
      <div className="mt-2 truncate text-2xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-muted">{detail}</div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  detail,
  onClick
}: {
  icon: typeof Home;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-md border border-line bg-white p-4 text-left transition hover:border-teal hover:bg-teal/5"
      onClick={onClick}
    >
      <Icon className="h-5 w-5 text-teal" />
      <div className="mt-3 font-semibold">{label}</div>
      <div className="text-sm text-muted">{detail}</div>
    </button>
  );
}

function AfterCallCard({
  title,
  value,
  detail,
  icon: Icon,
  onClick
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof Home;
  onClick?: () => void;
}) {
  return (
    <button
      className="rounded-md border border-line bg-white p-4 text-left shadow-sm transition hover:border-teal hover:bg-teal/5"
      onClick={onClick}
    >
      <Icon className="h-6 w-6 text-teal" />
      <div className="mt-3 text-sm text-muted">{title}</div>
      <div className="mt-1 font-bold">{value}</div>
      <div className="mt-1 text-sm text-muted">{detail}</div>
    </button>
  );
}

function CallBlock({
  icon: Icon,
  label,
  badge,
  text,
  tone
}: {
  icon: typeof Home;
  label: string;
  badge: string;
  text: string;
  tone: "teal" | "navy" | "gold" | "coral";
}) {
  const color = {
    teal: "text-teal bg-teal/10",
    navy: "text-navy bg-navy/10",
    gold: "text-gold bg-gold/10",
    coral: "text-coral bg-coral/10"
  }[tone];

  return (
    <div className="border-b border-line pb-5 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className={clsx("grid h-8 w-8 place-items-center rounded-full", color)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="font-bold">{label}</div>
        <span className={clsx("rounded px-2 py-1 text-[11px] font-bold uppercase", color)}>
          {badge}
        </span>
      </div>
      <p className="mt-3 pl-11 text-lg leading-8 text-ink">{text}</p>
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
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <input className="input" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <textarea
        className="input resize-y"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
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
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      className={clsx(
        "flex items-center justify-between rounded-md border px-3 py-2 text-sm",
        checked ? "border-teal/30 bg-teal/5 text-teal" : "border-line bg-white text-muted"
      )}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span>{label}</span>
      <span className={clsx("h-4 w-4 rounded-full border", checked && "border-teal bg-teal")} />
    </button>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <div className="text-muted">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function StatusLine({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <span className={clsx("flex items-center gap-1 font-semibold", active ? "text-teal" : "text-coral")}>
        {active ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        {active ? "OK" : "A verifier"}
      </span>
    </div>
  );
}

function TwoColumnText({
  leftTitle,
  left,
  rightTitle,
  right
}: {
  leftTitle: string;
  left: string;
  rightTitle: string;
  right: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-md bg-slate-50 p-4">
        <h3 className="font-bold">{leftTitle}</h3>
        <p className="mt-2 leading-7 text-muted">{left}</p>
      </div>
      <div className="rounded-md bg-teal/5 p-4">
        <h3 className="font-bold text-teal">{rightTitle}</h3>
        <p className="mt-2 leading-7 text-ink">{right}</p>
      </div>
    </div>
  );
}

function MessageBox({ title, subject, body }: { title: string; subject: string; body: string }) {
  return (
    <div className="rounded-md border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold">{title}</h3>
        <button className="icon-button" title="Copier" onClick={() => copyText(`${subject}\n\n${body}`)}>
          <ClipboardCopy className="h-4 w-4" />
        </button>
      </div>
      <input className="input mt-3" value={subject} readOnly />
      <textarea className="input mt-3 min-h-40 resize-y" value={body} readOnly />
    </div>
  );
}

function SmallMessage({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-line bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold">{title}</h3>
        <button className="icon-button" title="Copier" onClick={() => copyText(text)}>
          <ClipboardCopy className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 line-clamp-5 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}

function RailBox({ title, body, tone }: { title: string; body: string; tone: "teal" | "gold" | "navy" }) {
  const color = {
    teal: "border-teal/20 bg-teal/5 text-teal",
    gold: "border-gold/20 bg-gold/10 text-gold",
    navy: "border-navy/20 bg-navy/5 text-navy"
  }[tone];

  return (
    <div className={clsx("rounded-md border p-4", color)}>
      <div className="font-bold">{title}</div>
      <p className="mt-2 text-sm leading-6 text-ink">{body}</p>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-coral/30 bg-coral/5 p-3 text-sm text-coral">
      {message}
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed border-line p-5 text-center text-sm text-muted">{text}</div>;
}
