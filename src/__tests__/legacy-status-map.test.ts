import { describe, it, expect } from "vitest";

// Replicate the LEGACY_STATUS_MAP and resolution logic from /api/orders/route.ts
const LEGACY_STATUS_MAP: Record<string, string> = {
  PENDING:    "COMMANDE_A_TRAITER",
  PROCESSING: "COMMANDE_A_PREPARER",
  SHIPPED:    "ARCHIVES",
  DELIVERED:  "ARCHIVES",
  CANCELLED:  "ARCHIVES",
  REFUNDED:   "ARCHIVES",
};

function resolveStatus(rawStatus: string | undefined): string {
  const raw = rawStatus ?? "COMMANDE_A_TRAITER";
  return LEGACY_STATUS_MAP[raw] ?? raw;
}

describe("LEGACY_STATUS_MAP — English→French webhook status conversion", () => {
  it("maps PENDING → COMMANDE_A_TRAITER", () => {
    expect(resolveStatus("PENDING")).toBe("COMMANDE_A_TRAITER");
  });

  it("maps PROCESSING → COMMANDE_A_PREPARER", () => {
    expect(resolveStatus("PROCESSING")).toBe("COMMANDE_A_PREPARER");
  });

  it("maps SHIPPED → ARCHIVES", () => {
    expect(resolveStatus("SHIPPED")).toBe("ARCHIVES");
  });

  it("maps DELIVERED → ARCHIVES", () => {
    expect(resolveStatus("DELIVERED")).toBe("ARCHIVES");
  });

  it("maps CANCELLED → ARCHIVES", () => {
    expect(resolveStatus("CANCELLED")).toBe("ARCHIVES");
  });

  it("maps REFUNDED → ARCHIVES", () => {
    expect(resolveStatus("REFUNDED")).toBe("ARCHIVES");
  });

  it("passes through French values unchanged", () => {
    const frenchStatuses = [
      "COMMANDE_A_TRAITER",
      "COMMANDE_EN_ATTENTE",
      "COMMANDE_A_PREPARER",
      "MAQUETTE_A_FAIRE",
      "PRT_A_FAIRE",
      "EN_ATTENTE_VALIDATION",
      "EN_COURS_IMPRESSION",
      "PRESSAGE_A_FAIRE",
      "CLIENT_A_CONTACTER",
      "CLIENT_PREVENU",
      "ARCHIVES",
    ];
    for (const s of frenchStatuses) {
      expect(resolveStatus(s)).toBe(s);
    }
  });

  it("defaults to COMMANDE_A_TRAITER when status is undefined", () => {
    expect(resolveStatus(undefined)).toBe("COMMANDE_A_TRAITER");
  });

  it("passes through unknown values unchanged (let DB cast fail gracefully)", () => {
    expect(resolveStatus("SOME_UNKNOWN_VALUE")).toBe("SOME_UNKNOWN_VALUE");
  });
});

// ── Bearer token auth (Authorization: Bearer <token>) ─────────────────────────
// Replicate the Bearer branch of verifyWebhookSecret from /api/orders/route.ts
function verifyBearer(secret: string, authHeader: string | null): boolean {
  if (!authHeader) return false;
  const spaceIdx = authHeader.indexOf(" ");
  const scheme = spaceIdx !== -1 ? authHeader.slice(0, spaceIdx).toLowerCase() : "";
  const token = spaceIdx !== -1 ? authHeader.slice(spaceIdx + 1) : "";
  return scheme === "bearer" && token === secret;
}

describe("verifyWebhookSecret — Bearer token support (used by oldastudio)", () => {
  it("accepts valid Bearer token", () => {
    expect(verifyBearer("mysecret", "Bearer mysecret")).toBe(true);
  });

  it("rejects wrong Bearer token", () => {
    expect(verifyBearer("mysecret", "Bearer wrongtoken")).toBe(false);
  });

  it("rejects non-Bearer scheme", () => {
    expect(verifyBearer("mysecret", "Basic mysecret")).toBe(false);
  });

  it("rejects missing Authorization header", () => {
    expect(verifyBearer("mysecret", null)).toBe(false);
  });

  it("is case-insensitive for the Bearer scheme keyword", () => {
    expect(verifyBearer("mysecret", "bearer mysecret")).toBe(true);
    expect(verifyBearer("mysecret", "BEARER mysecret")).toBe(true);
  });

  it("is case-sensitive for the token value", () => {
    expect(verifyBearer("MySecret", "Bearer mysecret")).toBe(false);
    expect(verifyBearer("mysecret", "Bearer MySecret")).toBe(false);
  });
});
