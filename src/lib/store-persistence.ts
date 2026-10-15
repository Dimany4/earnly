import type { Persisted } from "./store";
import { APP_STAGES } from "./types";
import type { AiPrefs, Application, Notif } from "./types";

const VERSION = 1;
const NOTIF_KINDS = ["application", "match", "payment", "deadline", "review", "verification", "ai"] as const;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function oneOf<T extends string>(value: unknown, choices: readonly T[]): value is T {
  return choices.some((choice) => choice === value);
}

function prefs(value: unknown): AiPrefs | null {
  if (!record(value) || !strings(value.skills) || !strings(value.kinds) ||
      !strings(value.tasks) || typeof value.radius !== "string" || !finite(value.minPay) ||
      !oneOf(value.payType, ["any", "hourly", "fixed"] as const) || !strings(value.availability)) return null;
  return {
    skills: value.skills, kinds: value.kinds, tasks: value.tasks, radius: value.radius,
    minPay: value.minPay, payType: value.payType, availability: value.availability,
  };
}

function application(value: unknown): Application | null {
  if (!record(value) || typeof value.id !== "string" || typeof value.opportunityId !== "string" ||
      !oneOf(value.stage, APP_STAGES) || !finite(value.updatedDaysAgo) ||
      (value.note !== undefined && typeof value.note !== "string") ||
      (value.demoEscrow !== undefined && typeof value.demoEscrow !== "boolean")) return null;
  return {
    id: value.id, opportunityId: value.opportunityId, stage: value.stage,
    updatedDaysAgo: value.updatedDaysAgo,
    ...(value.note !== undefined ? { note: value.note } : {}),
    ...(value.demoEscrow !== undefined ? { demoEscrow: value.demoEscrow } : {}),
  };
}

function notification(value: unknown): Notif | null {
  if (!record(value) || typeof value.id !== "string" || !oneOf(value.kind, NOTIF_KINDS) ||
      typeof value.title !== "string" || typeof value.body !== "string" ||
      typeof value.ago !== "string" || typeof value.unread !== "boolean") return null;
  return {
    id: value.id, kind: value.kind, title: value.title, body: value.body,
    ago: value.ago, unread: value.unread,
  };
}

function entries<T>(value: unknown, parse: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) return null;
  const result: T[] = [];
  for (const item of value) {
    const parsed = parse(item);
    if (parsed === null) return null;
    result.push(parsed);
  }
  return result;
}

function normalize(value: unknown, defaults: Persisted): Persisted {
  const data = record(value) ? value : {};
  return {
    signedIn: typeof data.signedIn === "boolean" ? data.signedIn : defaults.signedIn,
    authMethod: data.authMethod === null || oneOf(data.authMethod, ["google", "email"] as const)
      ? data.authMethod : defaults.authMethod,
    verification: oneOf(data.verification, ["required", "pending", "verified", "failed"] as const)
      ? data.verification : defaults.verification,
    onboarded: typeof data.onboarded === "boolean" ? data.onboarded : defaults.onboarded,
    prefs: prefs(data.prefs) ?? defaults.prefs,
    aiPrefs: prefs(data.aiPrefs) ?? defaults.aiPrefs,
    saved: strings(data.saved) ? data.saved : defaults.saved,
    applications: entries(data.applications, application) ?? defaults.applications,
    notifications: entries(data.notifications, notification) ?? defaults.notifications,
    theme: oneOf(data.theme, ["dark", "light"] as const) ? data.theme : defaults.theme,
  };
}

/** Legacy v0 was a raw state object; missing aiPrefs inherits its saved prefs. */
function migrateLegacy(data: Record<string, unknown>): Record<string, unknown> {
  return Object.hasOwn(data, "aiPrefs") ? data : { ...data, aiPrefs: data.prefs };
}

export function readPersisted(raw: string | null, defaults: Persisted): Persisted {
  if (raw === null) return defaults;
  try {
    const payload: unknown = JSON.parse(raw);
    if (!record(payload)) return defaults;
    if (!Object.hasOwn(payload, "v")) return normalize(migrateLegacy(payload), defaults);
    if (payload.v !== VERSION || !record(payload.data)) return defaults;
    return normalize(payload.data, defaults);
  } catch {
    return defaults;
  }
}

export function serializePersisted(state: Persisted): string {
  return JSON.stringify({ v: VERSION, data: normalize(state, state) });
}
