import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProdectaApp } from "@/components/ProdectaApp";
import {
  buildLiveCoachFallback,
  buildNegotiationFallback,
  buildObjectionFallback,
  buildPreparationFallback,
  buildReportFallback,
  defaultMeetingContext
} from "@/lib/sales-knowledge";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

describe("Prodecta app smoke", () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn() },
      configurable: true
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.endsWith("/api/prepare-rdv")) {
          return jsonResponse({
            demoMode: false,
            model: "mock",
            data: buildPreparationFallback(defaultMeetingContext)
          });
        }

        if (url.endsWith("/api/live-coach")) {
          return jsonResponse({
            demoMode: true,
            model: "local-fallback",
            data: buildLiveCoachFallback({
              transcript: "Le prix est interessant mais je dois voir avec mon associe.",
              manualSignals: ["prix"],
              sellerTalkRatio: 61
            })
          });
        }

        if (url.endsWith("/api/analyze-rdv")) {
          return jsonResponse({
            demoMode: false,
            model: "mock",
            data: buildReportFallback(defaultMeetingContext, "prix associe proposition mardi")
          });
        }

        if (url.endsWith("/api/objection")) {
          return jsonResponse({
            demoMode: true,
            model: "local-fallback",
            data: buildObjectionFallback({
              objection: "elle veut pas d'argent, c'est trop cher",
              context: "La direction a peur du risque financier.",
              price: "18 000 - 28 000 EUR"
            })
          });
        }

        if (url.endsWith("/api/negociation")) {
          return jsonResponse({
            demoMode: true,
            model: "local-fallback",
            data: buildNegotiationFallback({
              objection: "elle veut pas d'argent, c'est trop cher",
              context: "La direction a peur du risque financier.",
              price: "18 000 - 28 000 EUR"
            })
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
                  provider: "gmail",
                  label: "Gmail",
                  state: "not_configured",
                  detail: "OAuth Gmail requis.",
                  configured: false
                },
                {
                  provider: "linkedin",
                  label: "LinkedIn",
                  state: "assisted",
                  detail: "Mode assiste.",
                  configured: true
                }
              ]
            }
          });
        }

        if (url.endsWith("/api/integrations/linkedin/draft")) {
          return jsonResponse({
            demoMode: false,
            data: {
              message: "Message LinkedIn pret a copier.",
              draft: {
                profileUrl: "",
                text: "Bonjour, message LinkedIn de test."
              }
            }
          });
        }

        return jsonResponse({ error: `Unhandled mock URL ${url}` }, 500);
      })
    );
  });

  it("runs core sections without crashing", async () => {
    render(<ProdectaApp />);

    fireEvent.click(screen.getByTitle("Preparation RDV"));
    fireEvent.click(screen.getByRole("button", { name: /Generer/i }));
    await screen.findByText("Preparation IA generee.");

    fireEvent.click(screen.getByTitle("Call Copilot"));
    fireEvent.click(screen.getAllByRole("button", { name: /^Coach$/i })[0]);
    await screen.findByText("Ancrer le prix sur la valeur");

    fireEvent.click(screen.getByTitle("Analyse RDV"));
    fireEvent.click(screen.getByRole("button", { name: /Exemple/i }));
    fireEvent.click(screen.getByRole("button", { name: /Generer le rapport/i }));
    await screen.findByText("Rapport sauvegarde localement.");

    fireEvent.click(screen.getByTitle("Objection & prix"));
    fireEvent.click(screen.getByRole("button", { name: /Exemple prix/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Generer$/i }));
    await screen.findByText(/perimetre essentiel/i);

    fireEvent.click(screen.getByTitle("Bibliotheque"));
    expect(screen.getByText("Academie commerciale Prodecta")).toBeInTheDocument();
    expect(screen.getAllByText("SPIN Selling").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByPlaceholderText(/Rechercher : prix/i), { target: { value: "Cialdini" } });
    await screen.findAllByText("Cialdini, version ethique");

    fireEvent.click(screen.getByTitle("Connexions"));
    await screen.findByText("Connexions commerciales");
    expect(screen.getByText("Airtable Prodecta")).toBeInTheDocument();
    expect(screen.getByText("Gmail")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Creer message/i }));
    await screen.findByText("Message LinkedIn pret a copier.");

    fireEvent.click(screen.getByTitle("Accueil"));
    fireEvent.click(screen.getByRole("button", { name: /Supprimer/i }));
    await waitFor(() => {
      expect(screen.getByText("Donnees locales supprimees.")).toBeInTheDocument();
    });
  });
});
