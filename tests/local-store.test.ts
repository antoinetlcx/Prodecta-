import { beforeEach, describe, expect, it } from "vitest";
import {
  clearProdectaData,
  exportProdectaData,
  loadLocalValue,
  safeJsonParse,
  saveLocalValue,
  STORAGE_KEYS
} from "@/lib/local-store";

describe("local store helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns fallback on invalid JSON", () => {
    expect(safeJsonParse("{bad", { ok: true })).toEqual({ ok: true });
  });

  it("saves, loads, exports and clears local data", () => {
    saveLocalValue(STORAGE_KEYS.liveNotes, ["note"]);
    expect(loadLocalValue(STORAGE_KEYS.liveNotes, [])).toEqual(["note"]);

    const exported = exportProdectaData();
    expect(exported).toContain("prodecta:live-notes");
    expect(exported).toContain("note");

    clearProdectaData();
    expect(loadLocalValue(STORAGE_KEYS.liveNotes, [])).toEqual([]);
  });
});
