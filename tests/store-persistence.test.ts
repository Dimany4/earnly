import { describe, expect, it } from "vitest";
import { readPersisted, serializePersisted } from "@/lib/store-persistence";
import type { Persisted } from "@/lib/store";

const defaults: Persisted = {
  signedIn: true, authMethod: "google", verification: "required", onboarded: true,
  prefs: {
    skills: ["Writing"], kinds: ["task"], tasks: ["Editing"], radius: "Remote",
    minPay: 50, payType: "fixed", availability: ["Weekends"],
  },
  aiPrefs: {
    skills: ["React"], kinds: ["job"], tasks: [], radius: "Anywhere",
    minPay: 25, payType: "any", availability: [],
  },
  saved: ["opportunity-1"],
  applications: [{ id: "a1", opportunityId: "opportunity-1", stage: "Applied", updatedDaysAgo: 0, note: "", demoEscrow: false }],
  notifications: [{ id: "n1", kind: "match", title: "A match", body: "Details", ago: "Now", unread: false }],
  theme: "light",
};

describe("versioned prototype persistence", () => {
  it("writes the version and round-trips false, null, empty arrays and optional fields", () => {
    const state: Persisted = {
      ...defaults, signedIn: false, onboarded: false, authMethod: null, saved: [], theme: "dark",
      prefs: { ...defaults.prefs, skills: [], minPay: 0 },
    };
    const raw = serializePersisted(state);
    expect(JSON.parse(raw)).toEqual({ v: 1, data: state });
    expect(readPersisted(raw, defaults)).toEqual(state);
    expect(readPersisted(serializePersisted({ ...state, applications: [], notifications: [] }), defaults))
      .toEqual({ ...state, applications: [], notifications: [] });
  });

  it("migrates raw v0 data and carries legacy prefs into missing aiPrefs", () => {
    const legacy = { ...defaults, theme: "dark", aiPrefs: undefined, removed: "stale" };
    const migrated = readPersisted(JSON.stringify(legacy), defaults);
    expect(migrated).toEqual({ ...defaults, theme: "dark", aiPrefs: defaults.prefs });
    expect(JSON.parse(serializePersisted(migrated))).toEqual({ v: 1, data: migrated });
    expect(legacy.aiPrefs).toBeUndefined();
  });

  it("keeps an existing legacy aiPrefs instead of replacing it with prefs", () => {
    expect(readPersisted(JSON.stringify(defaults), defaults)).toEqual(defaults);
  });

  it.each([null, "", "{", "null", "[]", "42", "true", '"text"'])("falls back for unreadable/non-object data: %s", (raw) => {
    expect(readPersisted(raw, defaults)).toEqual(defaults);
  });

  it.each([0, 2, -1, 1.5, "1", null, false])("rejects unsupported or malformed version %s", (v) => {
    expect(readPersisted(JSON.stringify({ v, data: { ...defaults, theme: "dark" } }), defaults)).toEqual(defaults);
  });

  it.each([{ data: null }, { data: [] }, { data: "state" }, { data: 5 }])("rejects a malformed v1 data object: $data", ({ data }) => {
    expect(readPersisted(JSON.stringify({ v: 1, data }), defaults)).toEqual(defaults);
  });

  it("defaults malformed known fields without discarding an unrelated valid field", () => {
    const data = {
      ...defaults, theme: "dark", signedIn: "yes", onboarded: 1, authMethod: "other", verification: "other",
      saved: null, prefs: { ...defaults.prefs, skills: null }, aiPrefs: { ...defaults.aiPrefs, minPay: "25" },
      applications: [{ ...defaults.applications[0], stage: "Unknown" }],
      notifications: [{ ...defaults.notifications[0], unread: "false" }],
    };
    expect(readPersisted(JSON.stringify({ v: 1, data }), defaults)).toEqual({ ...defaults, theme: "dark" });
  });

  it.each([
    { applications: null }, { applications: [null] },
    { applications: [{ ...defaults.applications[0], note: null }] },
    { applications: [{ ...defaults.applications[0], demoEscrow: 0 }] },
  ])("rejects malformed application collections: $applications", ({ applications }) => {
      const state = readPersisted(JSON.stringify({ v: 1, data: { applications } }), defaults);
      expect(state.applications).toEqual(defaults.applications);
    });

  it("strips retired fields from the state and every nested record on read and write", () => {
    const noisy = {
      ...defaults, retired: "old", prefs: { ...defaults.prefs, retired: "old" },
      aiPrefs: { ...defaults.aiPrefs, retired: "old" },
      applications: defaults.applications.map((item) => ({ ...item, retired: "old" })),
      notifications: defaults.notifications.map((item) => ({ ...item, retired: "old" })),
    };
    expect(readPersisted(JSON.stringify({ v: 1, data: noisy }), defaults)).toEqual(defaults);
    expect(JSON.parse(serializePersisted(noisy))).toEqual({ v: 1, data: defaults });
  });
});
