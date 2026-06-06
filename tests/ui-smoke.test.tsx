import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProdectaApp } from "@/components/ProdectaApp";
import {
  buildFollowupFallback,
  buildPreparationFallback,
  defaultMeetingContext
} from "@/lib/sales-knowledge";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

describe("Prodecta connected dashboard smoke", () => {
  beforeEach(() => {
    window.localStorage.clear();
    let taskCounter = 0;
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn() },
      configurable: true
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.endsWith("/api/integrations/calendar/import")) {
          return jsonResponse({
            demoMode: true,
            data: {
              message: "RDV importes depuis Google Calendar.",
              meetings: [
                {
                  id: "meeting-1",
                  title: "RDV Prodecta - Chateau test",
                  start: "2026-06-06T11:00:00+02:00",
                  end: "2026-06-06T12:00:00+02:00",
                  description: "Qualifier le besoin.",
                  attendees: ["sophie@example.com"],
                  prospectName: "Chateau test",
                  source: "demo"
                }
              ]
            }
          });
        }

        if (url.endsWith("/api/integrations/tasks/list")) {
          return jsonResponse({
            demoMode: true,
            data: {
              message: "Taches chargees.",
              tasks: [
                {
                  id: "task-1",
                  title: "Relancer Chateau test",
                  due: "2026-06-06T15:00:00+02:00",
                  status: "needsAction",
                  prospectName: "Chateau test",
                  source: "demo"
                }
              ]
            }
          });
        }

        if (url.endsWith("/api/integrations/airtable/prospects")) {
          return jsonResponse({
            demoMode: true,
            data: {
              message: "Prospects chargees.",
              prospects: [
                {
                  id: "prospect-1",
                  name: "Sophie",
                  company: "Chateau test",
                  email: "sophie@example.com",
                  sector: "chateau_domaine",
                  pipelineStatus: "chaud",
                  need: "Projeter les futurs maries",
                  potentialAmount: 24000,
                  lastContactAt: "2026-06-01T10:00:00+02:00",
                  followupDate: "2026-06-05T10:00:00+02:00",
                  nextAction: ""
                }
              ]
            }
          });
        }

        if (url.endsWith("/api/integrations/gmail/search")) {
          return jsonResponse({
            demoMode: true,
            data: {
              message: "Messages Gmail trouves.",
              threads: [
                {
                  id: "thread-1",
                  subject: "Budget Prodecta",
                  snippet: "Nous devons regarder le budget et choisir la prochaine etape.",
                  prospectName: "Chateau test",
                  source: "demo"
                }
              ]
            }
          });
        }

        if (url.endsWith("/api/prepare-rdv")) {
          return jsonResponse({
            demoMode: false,
            model: "mock",
            data: buildPreparationFallback(defaultMeetingContext)
          });
        }

        if (url.endsWith("/api/relance")) {
          return jsonResponse({
            demoMode: true,
            model: "local-fallback",
            data: buildFollowupFallback("budget prochaine etape")
          });
        }

        if (url.endsWith("/api/integrations/gmail/create-draft")) {
          return jsonResponse({
            demoMode: true,
            data: {
              message: "Brouillon Gmail cree. Aucun envoi automatique.",
              sent: false
            }
          });
        }

        if (url.endsWith("/api/integrations/tasks/create")) {
          taskCounter += 1;
          return jsonResponse({
            demoMode: true,
            data: {
              message: "Tache Google Tasks creee.",
              task: { id: `task-created-${taskCounter}`, source: "demo" }
            }
          });
        }

        if (url.endsWith("/api/integrations/tasks/complete")) {
          return jsonResponse({
            demoMode: true,
            data: { message: "Tache Google Tasks terminee." }
          });
        }

        if (url.endsWith("/api/integrations/status")) {
          return jsonResponse({
            data: {
              statuses: [
                {
                  provider: "airtable",
                  label: "Airtable Prodecta",
                  state: "needs_reauth",
                  detail: "Reauth Airtable requise.",
                  configured: false
                },
                {
                  provider: "googleCalendar",
                  label: "Google Calendar",
                  state: "not_configured",
                  detail: "OAuth local a configurer.",
                  configured: false
                },
                {
                  provider: "googleTasks",
                  label: "Google Tasks",
                  state: "not_configured",
                  detail: "OAuth Google requis.",
                  configured: false
                },
                {
                  provider: "gmail",
                  label: "Gmail",
                  state: "not_configured",
                  detail: "OAuth Gmail requis.",
                  configured: false
                },
                {
                  provider: "openai",
                  label: "OpenAI",
                  state: "not_configured",
                  detail: "Optionnel.",
                  configured: false
                }
              ]
            }
          });
        }

        if (url.endsWith("/api/integrations/tasks/lists")) {
          return jsonResponse({
            demoMode: true,
            data: {
              message: "Listes Google Tasks importees.",
              lists: [{ id: "default", title: "Actions commerciales" }]
            }
          });
        }

        if (url.endsWith("/api/integrations/airtable/discover")) {
          return jsonResponse({
            data: { message: "Airtable a besoin d'une reauth.", state: "needs_reauth" }
          });
        }

        return jsonResponse({ error: `Unhandled mock URL ${url}` }, 500);
      })
    );
  });

  it("runs the connected commercial workflow without live or audio UI", async () => {
    render(<ProdectaApp />);

    expect(screen.getByText("Dashboard Commercial")).toBeInTheDocument();
    expect(screen.queryByText(/micro|audio|realtime|transcription|ecoute active|lancer live/i)).not.toBeInTheDocument();
    await screen.findByText("Dashboard commercial synchronise.");

    fireEvent.click(screen.getByTitle("RDV"));
    fireEvent.click(screen.getByRole("button", { name: /^Preparer$/i }));
    await screen.findByText("Preparation avancee generee.");

    fireEvent.click(screen.getByTitle("Relances"));
    fireEvent.click(screen.getByRole("button", { name: /^Generer$/i }));
    await screen.findByText("Relance sauvegardee localement.");
    fireEvent.click(screen.getByRole("button", { name: /Creer brouillon/i }));
    await screen.findByText("Brouillon Gmail cree. Aucun envoi automatique.");

    fireEvent.click(screen.getByTitle("Prospects"));
    fireEvent.click(screen.getAllByRole("button", { name: /Creer tache/i })[0]);
    await screen.findByText("Tache Google Tasks creee.");

    fireEvent.click(screen.getByTitle("Gmail"));
    fireEvent.click(screen.getByRole("button", { name: /Rechercher/i }));
    await screen.findByText("Messages Gmail trouves.");
    fireEvent.click(screen.getByRole("button", { name: /Creer brouillon/i }));
    await screen.findByText("Brouillon Gmail cree. Aucun envoi automatique.");

    fireEvent.click(screen.getByTitle("Taches"));
    fireEvent.click(screen.getByRole("button", { name: /^Creer tache$/i }));
    await screen.findByText("Tache Google Tasks creee.");
    fireEvent.click(screen.getAllByRole("button", { name: /Terminer/i })[0]);
    await screen.findByText("Tache Google Tasks terminee.");

    fireEvent.click(screen.getByTitle("Bibliotheque"));
    expect(screen.getByText("Academie commerciale Prodecta")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Rechercher : prix/i), { target: { value: "Cialdini" } });
    await screen.findAllByText("Cialdini, version ethique");

    fireEvent.click(screen.getByTitle("Connexions"));
    await screen.findByText("Connexions commerciales");
    expect(await screen.findByText("Google Tasks")).toBeInTheDocument();
    expect(await screen.findByText("OpenAI")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Dashboard"));
    fireEvent.click(screen.getByRole("button", { name: /Supprimer/i }));
    await waitFor(() => {
      expect(screen.getByText("Donnees locales supprimees.")).toBeInTheDocument();
    });
  });
});
