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
    saveLocalValue(STORAGE_KEYS.tasks, [{ id: "task-1", title: "Relancer" }]);
    expect(loadLocalValue(STORAGE_KEYS.tasks, [])).toEqual([{ id: "task-1", title: "Relancer" }]);

    const exported = exportProdectaData();
    expect(exported).toContain("prodecta:tasks");
    expect(exported).toContain("Relancer");

    clearProdectaData();
    expect(loadLocalValue(STORAGE_KEYS.tasks, [])).toEqual([]);
  });
});
