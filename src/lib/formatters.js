export function eur(value, suffix = " €") {
  if (!Number.isFinite(value)) return "—";
  return (
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value) + suffix
  );
}

export function pct(value) {
  if (!Number.isFinite(value)) return "—";
  return (
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value) + " %"
  );
}

export function formatDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

export function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function safeFileName(value, fallback = "devis-prodecta") {
  const normalized = String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}
