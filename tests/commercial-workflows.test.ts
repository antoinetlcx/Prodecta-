import { describe, expect, it } from "vitest";
import {
  buildAirtableUpdateFields,
  findPipelineTable,
  mapAirtableRecordToProspect
} from "@/lib/airtable-crm";
import { summarizeGmailThread } from "@/lib/gmail-commercial";
import type { SalesProspect } from "@/lib/types";

const prospect: SalesProspect = {
  id: "rec1",
  name: "Sophie",
  company: "Chateau test",
  email: "sophie@example.com",
  sector: "chateau_domaine",
  pipelineStatus: "Purchase",
  pipelineStatusRaw: "Purchase",
  isPurchase: true
};

describe("connected commercial workflow helpers", () => {
  it("maps Airtable aliases and preserves Purchase priority", () => {
    const mapped = mapAirtableRecordToProspect(
      {
        id: "rec1",
        fields: {
          "Société": "Chateau test",
          "Statut pipeline": "Purchase",
          "Notes enrichies": "Tres interessee, devis a envoyer",
          "Date prochaine...": "2026-06-06T10:00:00+02:00",
          "Dernier contact": "2026-05-27T10:00:00+02:00"
        }
      },
      { baseId: "appYccQqBN2qgQ1uA", tableIdOrName: "Pipeline Commercial", now: "2026-06-06T12:00:00+02:00" }
    );

    expect(mapped.company).toBe("Chateau test");
    expect(mapped.pipelineStatusRaw).toBe("Purchase");
    expect(mapped.isPurchase).toBe(true);
    expect(mapped.nextActionDate).toBe("2026-06-06T10:00:00+02:00");
    expect(mapped.priorityLevel).toBe("urgent");
    expect(mapped.priorityReasons).toContain("Purchase sans prochaine action");
  });

  it("finds Pipeline Commercial and builds safe next-action updates", () => {
    const table = findPipelineTable([
      { id: "tblOther", name: "Archive" },
      {
        id: "tblPipeline",
        name: "Pipeline Commercial",
        fields: [
          { id: "fld1", name: "Prochaine action" },
          { id: "fld2", name: "Date prochaine..." }
        ]
      }
    ]);
    const update = buildAirtableUpdateFields(table, {
      nextAction: "Relancer avec deux creneaux",
      nextActionDate: "2026-06-07"
    });

    expect(table?.id).toBe("tblPipeline");
    expect(update.fields).toEqual({
      "Prochaine action": "Relancer avec deux creneaux",
      "Date prochaine...": "2026-06-07"
    });
    expect(update.missing).toEqual([]);
  });

  it("classifies Gmail inbound and sent-without-reply threads", () => {
    const inbound = summarizeGmailThread({
      myEmail: "paul@prodecta.fr",
      prospects: [prospect],
      now: "2026-06-06T10:00:00+02:00",
      thread: {
        id: "thread-in",
        messages: [
          {
            id: "msg-in",
            internalDate: String(new Date("2026-06-06T08:00:00+02:00").getTime()),
            snippet: "Pouvez-vous confirmer le budget ?",
            payload: {
              headers: [
                { name: "Subject", value: "Budget Prodecta Chateau test" },
                { name: "From", value: "Sophie <sophie@example.com>" },
                { name: "To", value: "Paul <paul@prodecta.fr>" }
              ]
            }
          }
        ]
      }
    });
    const waiting = summarizeGmailThread({
      myEmail: "paul@prodecta.fr",
      prospects: [prospect],
      now: "2026-06-06T10:00:00+02:00",
      thread: {
        id: "thread-out",
        messages: [
          {
            id: "msg-out",
            internalDate: String(new Date("2026-06-01T08:00:00+02:00").getTime()),
            snippet: "Je vous renvoie les deux scenarios.",
            payload: {
              headers: [
                { name: "Subject", value: "Suite devis Chateau test" },
                { name: "From", value: "Paul <paul@prodecta.fr>" },
                { name: "To", value: "Sophie <sophie@example.com>" }
              ]
            }
          }
        ]
      }
    });

    expect(inbound.commercialStatus).toBe("a_repondre");
    expect(inbound.needsReply).toBe(true);
    expect(inbound.matchedProspectId).toBe("rec1");
    expect(waiting.commercialStatus).toBe("en_attente_reponse");
    expect(waiting.daysSinceLastMessage).toBeGreaterThanOrEqual(3);
  });
});
