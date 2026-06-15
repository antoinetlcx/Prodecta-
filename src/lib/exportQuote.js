import { eur, formatDate, roundMoney, safeFileName } from "./formatters.js";

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildQontoReadyPayload(quote) {
  const lineItems = (quote.pricing.lineItems || quote.pricing.selectedModules || []).map((module) => ({
    type: module.monthlyPublic > 0 && module.setupPublic === 0 ? "subscription" : "service",
    title: module.label,
    property: module.propertyName || "Client",
    category: module.category,
    description: module.description,
    quantity: module.quantity || 1,
    unit_setup_price: roundMoney(module.unitSetupPublic ?? module.setupPublic),
    setup_total: roundMoney(module.setupPublic),
    unit_monthly_price: roundMoney(module.unitMonthlyPublic ?? module.monthlyPublic),
    monthly_total: roundMoney(module.monthlyPublic),
  }));

  const discountItem =
    quote.pricing.discount.appliedDiscountEuro > 0
      ? [
          {
            type: "discount",
            title: "Remise commerciale",
            category: "Remise",
            description: `${roundMoney(quote.pricing.discount.appliedDiscountPct)} % sur les frais de création`,
            quantity: 1,
            unit_setup_price: -quote.pricing.discount.appliedDiscountEuro,
            setup_total: -quote.pricing.discount.appliedDiscountEuro,
            unit_monthly_price: 0,
            monthly_total: 0,
          },
        ]
      : [];

  return {
    source: "prodecta-simulator",
    generatedAt: new Date().toISOString(),
    quote: {
      id: quote.id,
      name: quote.quoteName,
      status: quote.status,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      sector: quote.sectorLabel,
      establishmentName: quote.client.establishmentName,
    },
    client: quote.client,
    invoiceDraft: {
      currency: "EUR",
      properties: quote.pricing.properties || [],
      lineItems: [...lineItems, ...discountItem],
      totals: {
        setup: quote.pricing.setupFinalHT,
        monthly: quote.pricing.monthlyFinalHT,
        startup_total: quote.pricing.startupTotalHT,
      },
    },
    qontoPreparation: {
      note: "Export structuré pour ressaisie ou future intégration API. Aucune intégration Qonto automatique n’est déclenchée.",
      suggestedWorkflow: "Créer le client, recopier les lignes, appliquer la remise, puis valider les conditions commerciales.",
    },
    notes: quote.notes,
  };
}

export function exportQuoteJson(quote) {
  const payload = buildQontoReadyPayload(quote);
  const filename = `${safeFileName(quote.quoteName)}.json`;
  downloadTextFile(filename, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
}

export function exportQuoteCsv(quote) {
  const payload = buildQontoReadyPayload(quote);
  const rows = [
    ["Type", "Bien", "Catégorie", "Service", "Description", "Quantité", "Création unitaire", "Création", "Mensuel unitaire", "Mensuel"],
    ...payload.invoiceDraft.lineItems.map((line) => [
      line.type,
      line.property || "",
      line.category,
      line.title,
      line.description,
      line.quantity,
      line.unit_setup_price,
      line.setup_total,
      line.unit_monthly_price,
      line.monthly_total,
    ]),
    [],
    ["Frais de création", "", "", "", "", "", "", quote.pricing.setupFinalHT, "", ""],
    ["Abonnement mensuel", "", "", "", "", "", "", "", "", quote.pricing.monthlyFinalHT],
    ["Total de démarrage", "", "", "", "", "", "", quote.pricing.startupTotalHT, "", quote.pricing.monthlyFinalHT],
  ];

  const content = rows.map((row) => row.map(csvEscape).join(";")).join("\n");
  downloadTextFile(`${safeFileName(quote.quoteName)}.csv`, content, "text/csv;charset=utf-8");
}

function addWrappedText(doc, text, x, y, maxWidth, options = {}) {
  const lines = doc.splitTextToSize(String(text || ""), maxWidth);
  doc.text(lines, x, y, options);
  return y + lines.length * 14;
}

function addPageIfNeeded(doc, y) {
  if (y < 760) return y;
  doc.addPage();
  return 48;
}

export async function exportQuotePdf(quote, options = {}) {
  const clientMode = Boolean(options.clientMode);
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 42;
  const width = doc.internal.pageSize.getWidth();
  const right = width - margin;
  let y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Prodecta", margin, y);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Solutions digitales immersives pour établissements physiques", margin, y + 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Devis commercial", right, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(formatDate(quote.createdAt), right, y + 16, { align: "right" });

  y += 54;
  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(1);
  doc.line(margin, y, right, y);
  y += 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(quote.quoteName, margin, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const clientLines = [
    quote.client.name && `Client : ${quote.client.name}`,
    quote.client.establishmentName && `Établissement : ${quote.client.establishmentName}`,
    quote.client.email && `Email : ${quote.client.email}`,
    quote.client.phone && `Téléphone : ${quote.client.phone}`,
    `Secteur : ${quote.sectorLabel}`,
    `Statut : ${quote.status}`,
  ].filter(Boolean);
  clientLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 14;
  });

  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Services sélectionnés", margin, y);
  y += 18;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Service", margin, y);
  doc.text("Bien", margin + 190, y);
  doc.text("Création", right - 150, y, { align: "right" });
  doc.text("Mensuel", right, y, { align: "right" });
  y += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, right, y);
  y += 18;

  (quote.pricing.lineItems || quote.pricing.selectedModules).forEach((module) => {
    y = addPageIfNeeded(doc, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(module.label, margin, y);
    doc.text(module.propertyName || "Client", margin + 190, y);
    doc.text(eur(module.setupPublic), right - 150, y, { align: "right" });
    doc.text(eur(module.monthlyPublic, " €/mois"), right, y, { align: "right" });
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    y = addWrappedText(doc, module.description, margin, y, 330);
    doc.setTextColor(15, 23, 42);
    y += 8;
  });

  y = addPageIfNeeded(doc, y + 10);
  doc.setDrawColor(15, 23, 42);
  doc.line(margin, y, right, y);
  y += 24;

  const totalRows = [
    ["Frais de création", quote.pricing.setupPublicSubtotal],
    ...(!clientMode ? [["Remise", -quote.pricing.discount.appliedDiscountEuro]] : []),
    ["Prix final création", quote.pricing.setupFinalHT],
    ["Abonnement mensuel", quote.pricing.monthlyFinalHT],
    ["Total de démarrage", quote.pricing.startupTotalHT],
  ];

  totalRows.forEach(([label, value], index) => {
    doc.setFont("helvetica", index >= totalRows.length - 1 ? "bold" : "normal");
    doc.setFontSize(index >= totalRows.length - 1 ? 13 : 10);
    doc.text(label, right - 220, y);
    doc.text(eur(value), right, y, { align: "right" });
    y += index >= totalRows.length - 1 ? 20 : 16;
  });

  if (quote.notes?.clientComments || (!clientMode && quote.notes?.internalNotes)) {
    y = addPageIfNeeded(doc, y + 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Notes", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (quote.notes.clientComments) {
      y = addWrappedText(doc, `Commentaire client : ${quote.notes.clientComments}`, margin, y, right - margin);
      y += 8;
    }
    if (!clientMode && quote.notes.internalNotes) {
      y = addWrappedText(doc, `Notes internes : ${quote.notes.internalNotes}`, margin, y, right - margin);
    }
  }

  doc.save(`${safeFileName(quote.quoteName)}.pdf`);
}

export function createPlainTextSummary(quote) {
  const lines = [
    `Devis Prodecta — ${quote.quoteName}`,
    `Client : ${quote.client.name || "Non renseigné"}`,
    `Établissement : ${quote.client.establishmentName || "Non renseigné"}`,
    `Secteur : ${quote.sectorLabel}`,
    `Biens : ${quote.pricing.propertyCount || 1}`,
    `Visites : ${quote.pricing.virtualVisitCount || 0}`,
    `Espaces Matterport : ${quote.pricing.matterportSpaces || 0}`,
    `Apps web : ${quote.pricing.webAppCount || 0}`,
    `Frais de création : ${eur(quote.pricing.setupFinalHT)}`,
    `Abonnement mensuel : ${eur(quote.pricing.monthlyFinalHT, " €/mois")}`,
    `Total de démarrage : ${eur(quote.pricing.startupTotalHT)}`,
  ];
  return lines.join("\n");
}
