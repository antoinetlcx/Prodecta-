const STORAGE_KEY = "prodecta.quotes.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function createQuoteId() {
  return `quote_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function loadQuotes() {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Impossible de charger les devis sauvegardés", error);
    return [];
  }
}

export function persistQuotes(quotes) {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
    return true;
  } catch (error) {
    console.warn("Impossible d’enregistrer les devis", error);
    return false;
  }
}

export function upsertQuote(quotes, quote) {
  const withoutExisting = quotes.filter((item) => item.id !== quote.id);
  return [quote, ...withoutExisting].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function removeQuote(quotes, quoteId) {
  return quotes.filter((quote) => quote.id !== quoteId);
}
