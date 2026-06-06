import { z } from "zod";

export const sectorSchema = z.enum([
  "chateau_domaine",
  "hotel",
  "salle_sport",
  "gite",
  "restaurant",
  "salle_evenementielle",
  "autre"
]);

export const meetingTypeSchema = z.enum([
  "decouverte",
  "demo",
  "negociation",
  "closing",
  "suivi"
]);

export const dealMaturitySchema = z.enum([
  "froid",
  "tiede",
  "chaud",
  "client",
  "inconnu"
]);

export const meetingContextSchema = z.object({
  prospectName: z.string().min(1),
  contactName: z.string().min(0),
  sector: sectorSchema,
  meetingType: meetingTypeSchema,
  objective: z.string().min(1),
  knownContext: z.string().min(0),
  website: z.string().min(0),
  offer: z.string().min(0),
  examplesToShow: z.string().min(0),
  maturity: dealMaturitySchema,
  expectedDuration: z.number().int().min(10).max(180),
  priceDiscussed: z.string().min(0),
  consentObtained: z.boolean(),
  noRecordingMode: z.boolean()
});

const evidenceItemSchema = z.object({
  title: z.string(),
  quoteOrMoment: z.string(),
  interpretation: z.string(),
  recommendation: z.string()
});

export const preparationSchema = z.object({
  primaryAngle: z.string(),
  openingLine: z.string(),
  priorityQuestions: z.array(z.string()).min(3),
  likelyObjections: z.array(z.string()).min(3),
  influenceLevers: z.array(z.string()).min(3),
  proofToShow: z.array(z.string()).min(2),
  targetClosing: z.string(),
  mistakesToAvoid: z.array(z.string()).min(3)
});

export const commercialReportSchema = z.object({
  executiveSummary: z.string(),
  commercialTemperature: z.object({
    score: z.number().int().min(0).max(100),
    label: z.string(),
    justification: z.string()
  }),
  expressedNeed: z.string(),
  realNeed: z.string(),
  pains: z.object({
    primary: z.string(),
    secondary: z.string(),
    business: z.string(),
    emotional: z.string()
  }),
  positiveSignals: z.array(evidenceItemSchema),
  riskSignals: z.array(evidenceItemSchema),
  objections: z.array(
    z.object({
      apparent: z.string(),
      probableReality: z.string(),
      response: z.string()
    })
  ),
  performance: z.object({
    framing: z.string(),
    diagnostic: z.string(),
    listening: z.string(),
    valueSelling: z.string(),
    objectionHandling: z.string(),
    closing: z.string()
  }),
  missedMoments: z.array(
    z.object({
      moment: z.string(),
      whatHappened: z.string(),
      betterResponse: z.string()
    })
  ),
  priceStrategy: z.object({
    strategy: z.enum([
      "defendre_prix",
      "deux_options",
      "reduire_perimetre",
      "concession_contrepartie",
      "retrait_elegant"
    ]),
    reasoning: z.string(),
    recommendedPhrase: z.string()
  }),
  negotiationStrategy: z.object({
    posture: z.string(),
    limits: z.string(),
    possibleConcessions: z.string(),
    nextMove: z.string()
  }),
  nextAction: z.object({
    action: z.string(),
    timing: z.string(),
    owner: z.string()
  }),
  recommendedEmail: z.object({
    subject: z.string(),
    body: z.string()
  }),
  followups: z.array(
    z.object({
      timing: z.string(),
      angle: z.string(),
      message: z.string()
    })
  )
});

export const followupStrategySchema = z.object({
  diagnosis: z.string(),
  probableRealObjection: z.string(),
  recommendedStrategy: z.string(),
  pricePosture: z.string(),
  channel: z.string(),
  timing: z.string(),
  email: z.object({ subject: z.string(), body: z.string() }),
  sms: z.string(),
  linkedIn: z.string(),
  softVersion: z.string(),
  directVersion: z.string(),
  closingVersion: z.string(),
  nextAction: z.string()
});

export const negotiationStrategySchema = z.object({
  diagnosis: z.string(),
  recommendedStrategy: z.enum([
    "defendre_prix",
    "deux_options",
    "reduire_perimetre",
    "concession_contrepartie",
    "retrait_elegant"
  ]),
  valueAnchor: z.string(),
  phraseToSay: z.string(),
  phraseToAvoid: z.string(),
  concessionRules: z.array(z.string()),
  nextStep: z.string()
});

export const objectionStrategySchema = z.object({
  diagnosis: z.string(),
  riskLevel: z.enum(["faible", "moyen", "eleve"]),
  psychologicalLevers: z.array(z.string()),
  questionToAsk: z.string(),
  phraseToSay: z.string(),
  mistakeToAvoid: z.string(),
  nextAction: z.string()
});

export const liveTranscriptSegmentSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  speaker: z.enum(["commercial", "prospect", "system", "unknown"]),
  source: z.enum(["micro", "tab", "mixed", "manual", "unknown"]),
  final: z.boolean(),
  startedAt: z.string(),
  endedAt: z.string().optional()
});

export const liveSignalDetectionSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  category: z.enum(["achat", "risque", "objection", "biais", "ecoute", "closing"]),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
  recommendation: z.string()
});

export const liveCoachingEventSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string(),
  severity: z.enum(["info", "opportunity", "warning", "urgent"]),
  title: z.string(),
  insight: z.string(),
  suggestedPhrase: z.string(),
  questionToAsk: z.string(),
  mistakeToAvoid: z.string(),
  psychologicalLever: z.string(),
  sourceSegmentIds: z.array(z.string())
});

export const liveCoachResponseSchema = z.object({
  summary: z.string(),
  detectedSignals: z.array(liveSignalDetectionSchema),
  events: z.array(liveCoachingEventSchema),
  sellerTalkRatio: z.number().int().min(0).max(100),
  nextBestAction: z.string()
});

export type Sector = z.infer<typeof sectorSchema>;
export type MeetingType = z.infer<typeof meetingTypeSchema>;
export type DealMaturity = z.infer<typeof dealMaturitySchema>;
export type MeetingContext = z.infer<typeof meetingContextSchema>;
export type Preparation = z.infer<typeof preparationSchema>;
export type CommercialReport = z.infer<typeof commercialReportSchema>;
export type FollowupStrategy = z.infer<typeof followupStrategySchema>;
export type NegotiationStrategy = z.infer<typeof negotiationStrategySchema>;
export type ObjectionStrategy = z.infer<typeof objectionStrategySchema>;
export type LiveTranscriptSegment = z.infer<typeof liveTranscriptSegmentSchema>;
export type LiveSignalDetection = z.infer<typeof liveSignalDetectionSchema>;
export type LiveCoachingEvent = z.infer<typeof liveCoachingEventSchema>;
export type LiveCoachResponse = z.infer<typeof liveCoachResponseSchema>;
