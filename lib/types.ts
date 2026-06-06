import type {
  CommercialReport,
  DealMaturity,
  FollowupStrategy,
  LiveCoachResponse,
  LiveCoachingEvent,
  LiveSignalDetection,
  LiveTranscriptSegment,
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
  LiveCoachResponse,
  LiveCoachingEvent,
  LiveSignalDetection,
  LiveTranscriptSegment,
  MeetingContext,
  MeetingType,
  NegotiationStrategy,
  ObjectionStrategy,
  Preparation,
  Sector
};

export type CopilotStep = {
  id: string;
  title: string;
  timing: string;
  objective: string;
  phrase: string;
  question: string;
  signal: string;
  avoid: string;
  influence: string;
};

export type LiveSignal = {
  id: string;
  label: string;
  risk: "positive" | "warning" | "danger" | "neutral";
  meaning: string;
  phrase: string;
  nextQuestion: string;
  avoid: string;
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

export type IntegrationProvider = "airtable" | "googleCalendar" | "gmail" | "linkedin";

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

export type LinkedInDraftAction = {
  prospectName: string;
  contactName?: string;
  profileUrl?: string;
  context?: string;
  objective?: string;
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

export type RealtimeConnectionStatus =
  | "idle"
  | "permission"
  | "connecting"
  | "connected"
  | "coaching"
  | "stopping"
  | "missing-key"
  | "unsupported"
  | "error";

export type LiveSessionState = {
  status: RealtimeConnectionStatus;
  error: string | null;
  warning: string | null;
  startedAt: string | null;
  micActive: boolean;
  tabAudioActive: boolean;
  transcriptSegments: LiveTranscriptSegment[];
  coachingEvents: LiveCoachingEvent[];
  detectedSignals: LiveSignalDetection[];
  sellerTalkRatio: number;
  nextBestAction: string | null;
};
