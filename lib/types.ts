import type {
  CommercialReport,
  DealMaturity,
  FollowupStrategy,
  MeetingContext,
  MeetingType,
  NegotiationStrategy,
  ObjectionStrategy,
  Preparation,
  Sector
} from "./schemas";

export type {
  CommercialReport,
  DealMaturity,
  FollowupStrategy,
  MeetingContext,
  MeetingType,
  NegotiationStrategy,
  ObjectionStrategy,
  Preparation,
  Sector
};

export type PsychologyCard = {
  id: string;
  principle: string;
  useWhen: string;
  ethicalUse: string;
  phrase: string;
  avoid: string;
};

export type TrainingCategory =
  | "fondamentaux"
  | "psychologie"
  | "decouverte"
  | "objections"
  | "negociation"
  | "closing"
  | "relance"
  | "scripts"
  | "exercices";

export type TrainingCategoryMeta = {
  id: TrainingCategory;
  label: string;
  description: string;
};

export type TrainingModule = {
  id: string;
  category: TrainingCategory;
  title: string;
  level: "base" | "intermediaire" | "avance";
  goal: string;
  whyItMatters: string;
  keyPrinciples: string[];
  howToApply: string[];
  script: string;
  avoid: string;
  drill: string;
};

export type TrainingDrill = {
  id: string;
  title: string;
  category: TrainingCategory;
  situation: string;
  objective: string;
  prompt: string;
  expectedMove: string;
  selfCheck: string[];
};

export type ObjectionPlaybookItem = {
  id: string;
  label: string;
  triggers: string[];
  diagnosis: string;
  question: string;
  phrase: string;
  strategy: string;
  avoid: string;
};

export type ProdectaScript = {
  id: string;
  title: string;
  moment: string;
  text: string;
  whyItWorks: string;
};

export type SalesCheatSheet = {
  id: string;
  title: string;
  items: string[];
};

export type IntegrationProvider = "airtable" | "googleCalendar" | "googleTasks" | "gmail" | "openai";

export type IntegrationConnectionState =
  | "connected"
  | "not_configured"
  | "needs_reauth"
  | "insufficient_permissions"
  | "assisted"
  | "error";

export type IntegrationStatus = {
  provider: IntegrationProvider;
  label: string;
  state: IntegrationConnectionState;
  detail: string;
  configured: boolean;
  lastSyncAt?: string;
};

export type AirtableMapping = {
  baseId: string;
  baseName: string;
  prospectsTableId?: string;
  meetingsTableId?: string;
  reportsTableId?: string;
  followupsTableId?: string;
  tasksTableId?: string;
};

export type GoogleConnection = {
  email?: string;
  scope: string[];
  expiresAt?: string;
};

export type GmailDraftAction = {
  to: string;
  subject: string;
  body: string;
  prospectName?: string;
};

export type CalendarMeetingAction = {
  prospectName: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  attendees?: string[];
};

export type SalesProspect = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  sector: Sector;
  pipelineStatus: "nouveau" | "a_contacter" | "rdv_planifie" | "chaud" | "proposition" | "gagne" | "perdu";
  source?: string;
  need?: string;
  potentialAmount?: number;
  lastContactAt?: string;
  nextAction?: string;
  followupDate?: string;
  notes?: string;
  linkedInUrl?: string;
  website?: string;
};

export type CommercialMeeting = {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  attendees: string[];
  prospectName?: string;
  source: "google" | "local" | "demo";
};

export type CommercialTask = {
  id: string;
  title: string;
  due?: string;
  status: "needsAction" | "completed";
  taskListId?: string;
  notes?: string;
  prospectName?: string;
  source: "google" | "local" | "demo";
};

export type GmailThreadSummary = {
  id: string;
  subject: string;
  snippet: string;
  prospectName?: string;
  updatedAt?: string;
  source: "gmail" | "demo";
};

export type StoredReport = {
  id: string;
  createdAt: string;
  prospectName: string;
  score: number;
  report: CommercialReport;
};

export type StoredFollowup = {
  id: string;
  createdAt: string;
  prospectName: string;
  strategy: FollowupStrategy;
};
