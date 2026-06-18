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
  if (/[",\n;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
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
    vat_rate: 0,
  }));
  return {
    source: "prodecta-simulator",
    generatedAt: new Date().toISOString(),
    quote: { id: quote.id, name: quote.quoteName, status: quote.status, sector: quote.sectorLabel },
    client: quote.client,
    invoiceDraft: {
      currency: "EUR",
      vat_exemption_note: "TVA non applicable, article 293 B du CGI",
      lineItems,
      totals: { setup: quote.pricing.setupFinalHT, monthly: quote.pricing.monthlyFinalHT, startup_total: quote.pricing.startupTotalHT },
    },
    qontoPreparation: {
      note: "Payload structuré pour future intégration. Aucune création Qonto automatique n’est déclenchée ici.",
    },
    notes: quote.notes,
  };
}

export function exportQuoteJson(quote) {
  downloadTextFile(`${safeFileName(quote.quoteName)}.json`, JSON.stringify(buildQontoReadyPayload(quote), null, 2), "application/json;charset=utf-8");
}

export function exportQuoteCsv(quote) {
  const payload = buildQontoReadyPayload(quote);
  const rows = [
    ["Type", "Bien", "Catégorie", "Service", "Description", "Quantité", "Création unitaire", "Création", "Mensuel unitaire", "Mensuel"],
    ...payload.invoiceDraft.lineItems.map((line) => [line.type, line.property || "", line.category, line.title, line.description, line.quantity, line.unit_setup_price, line.setup_total, line.unit_monthly_price, line.monthly_total]),
    [],
    ["Frais de création", "", "", "", "", "", "", quote.pricing.setupFinalHT, "", ""],
    ["Abonnement mensuel", "", "", "", "", "", "", "", "", quote.pricing.monthlyFinalHT],
    ["Total de démarrage", "", "", "", "", "", "", quote.pricing.startupTotalHT, "", quote.pricing.monthlyFinalHT],
  ];
  downloadTextFile(`${safeFileName(quote.quoteName)}.csv`, rows.map((row) => row.map(csvEscape).join(";")).join("\n"), "text/csv;charset=utf-8");
}

function money(value, suffix = " €") {
  return eur(value, suffix).replace(/\u202f/g, " ").replace(/\u00a0/g, " ");
}

function text(value) {
  return String(value || "").replace(/\u202f/g, " ").replace(/\u00a0/g, " ");
}

function card(doc, x, y, w, h, fill, stroke = [226, 232, 240]) {
  doc.setFillColor(...fill);
  doc.setDrawColor(...stroke);
  doc.roundedRect(x, y, w, h, 14, 14, "FD");
}

function footer(doc, page, width, height) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Prodecta — Solutions digitales immersives", 42, height - 24);
  doc.text(String(page.number), width - 42, height - 24, { align: "right" });
}

function ensure(doc, y, needed, page) {
  if (y + needed < page.height - 58) return y;
  footer(doc, page, page.width, page.height);
  doc.addPage();
  page.number += 1;
  return 46;
}

function metric(doc, x, y, w, label, value, detail, accent = [15, 118, 110]) {
  card(doc, x, y, w, 74, [255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...accent);
  doc.text(label.toUpperCase(), x + 14, y + 19);
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(text(value), x + 14, y + 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(text(detail), x + 14, y + 60);
}

function segment(doc, data, title, subtitle, y, page) {
  if (!data?.lineItems?.length) return y;
  const margin = 42;
  const right = page.width - margin;
  y = ensure(doc, y, 90, page);
  card(doc, margin, y, right - margin, 43, [248, 250, 252]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(title, margin + 14, y + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, margin + 14, y + 32);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(money(data.setupPublic), right - 96, y + 18, { align: "right" });
  doc.text(money(data.monthlyPublic, " €/mois"), right - 14, y + 18, { align: "right" });
  y += 60;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Service", margin, y);
  doc.text("Bien", margin + 220, y);
  doc.text("Qté", right - 178, y, { align: "right" });
  doc.text("Création", right - 82, y, { align: "right" });
  doc.text("Mensuel", right, y, { align: "right" });
  y += 16;
  data.lineItems.forEach((line, index) => {
    y = ensure(doc, y, 42, page);
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin - 4, y - 13, right - margin + 8, 32, 7, 7, "F");
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(doc.splitTextToSize(text(line.label), 205).slice(0, 2), margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(text(line.propertyName || "Client"), margin + 220, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(String(line.quantity || 1), right - 178, y, { align: "right" });
    doc.text(money(line.setupPublic), right - 82, y, { align: "right" });
    doc.text(money(line.monthlyPublic, " €/mois"), right, y, { align: "right" });
    y += 34;
  });
  return y + 12;
}

export async function exportQuotePdf(quote, options = {}) {
  const clientMode = Boolean(options.clientMode);
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const page = { width: doc.internal.pageSize.getWidth(), height: doc.internal.pageSize.getHeight(), number: 1 };
  const margin = 42;
  const right = page.width - margin;
  let y = 42;

  doc.setFillColor(2, 6, 23);
  doc.roundedRect(28, 28, page.width - 56, 118, 18, 18, "F");
  doc.setFillColor(6, 78, 59);
  doc.roundedRect(page.width - 185, 28, 157, 118, 18, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(110, 231, 183);
  doc.setFontSize(9);
  doc.text("PRODECTA", margin, y + 8);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(27);
  doc.text("Devis commercial", margin, y + 43);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text("Solutions digitales immersives pour établissements physiques", margin, y + 66);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(formatDate(quote.createdAt), right - 18, y + 22, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor(187, 247, 208);
  doc.text("TVA non applicable, art. 293 B CGI", right - 18, y + 42, { align: "right" });
  y = 174;

  card(doc, margin, y, right - margin, 88, [255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(text(quote.quoteName), margin + 16, y + 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const info = [quote.client?.establishmentName && `Établissement : ${quote.client.establishmentName}`, quote.client?.name && `Contact : ${quote.client.name}`, quote.client?.email && `Email : ${quote.client.email}`, quote.client?.phone && `Téléphone : ${quote.client.phone}`, `Secteur : ${quote.sectorLabel}`].filter(Boolean).map(text);
  doc.text(info, margin + 16, y + 44);
  y += 112;

  const cw = (right - margin - 24) / 3;
  metric(doc, margin, y, cw, "Création", money(quote.pricing.setupFinalHT), "Frais de mise en place");
  metric(doc, margin + cw + 12, y, cw, "Mensuel", money(quote.pricing.monthlyFinalHT, " €/mois"), "Abonnement récurrent", [5, 150, 105]);
  metric(doc, margin + (cw + 12) * 2, y, cw, "Démarrage", money(quote.pricing.startupTotalHT), "Création + premier mois", [180, 83, 9]);
  y += 106;

  y = segment(doc, quote.pricing.segments?.shooting, "01. Shooting", "Captation intérieure et points de vue extérieurs.", y, page);
  y = segment(doc, quote.pricing.segments?.app, "02. App web / overlay", "Interface immersive et modules de conversion.", y, page);
  y = segment(doc, quote.pricing.segments?.subscription, "03. Abonnement", "Hébergement, dashboard, support et accompagnement.", y, page);

  y = ensure(doc, y, 120, page);
  card(doc, right - 250, y, 250, clientMode ? 86 : 106, [2, 6, 23], [2, 6, 23]);
  const totals = [["Frais de création", quote.pricing.setupPublicSubtotal], ...(!clientMode ? [["Remise", -quote.pricing.discount.appliedDiscountEuro]] : []), ["Prix final création", quote.pricing.setupFinalHT], ["Abonnement mensuel", quote.pricing.monthlyFinalHT, " €/mois"], ["Total de démarrage", quote.pricing.startupTotalHT]];
  let ty = y + 20;
  totals.forEach(([label, value, suffix], index) => {
    const last = index === totals.length - 1;
    doc.setFont("helvetica", last ? "bold" : "normal");
    doc.setFontSize(last ? 12 : 9);
    doc.setTextColor(last ? 110 : 203, last ? 231 : 213, last ? 183 : 225);
    doc.text(label, right - 230, ty);
    doc.setTextColor(255, 255, 255);
    doc.text(money(value, suffix || " €"), right - 18, ty, { align: "right" });
    ty += last ? 20 : 15;
  });

  footer(doc, page, page.width, page.height);
  doc.save(`${safeFileName(quote.quoteName)}.pdf`);
}

export function createPlainTextSummary(quote) {
  return [
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
  ].join("\n");
}
