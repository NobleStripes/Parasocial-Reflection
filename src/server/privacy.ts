import crypto from "node:crypto";

export interface PrivacyConfig {
  hashResearcherId: boolean;
  storeRawData: boolean;
  maxNotesChars: number;
  piiScrubberEnabled: boolean;
}

export function getPrivacyConfig(): PrivacyConfig {
  return {
    hashResearcherId: (process.env.PRIVACY_HASH_RESEARCHER_ID || "false").toLowerCase() === "true",
    storeRawData: (process.env.PRIVACY_STORE_RAW_DATA || "true").toLowerCase() === "true",
    maxNotesChars: Number(process.env.MAX_NOTES_CHARS || 2_000),
    piiScrubberEnabled: (process.env.PRIVACY_PII_SCRUBBER_ENABLED || "true").toLowerCase() === "true",
  };
}

export function hashResearcherId(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function sanitizeNotes(value: string, maxLength: number): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLength);
}
