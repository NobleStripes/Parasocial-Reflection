import Database from "better-sqlite3";
import { getPrivacyConfig, hashResearcherId, sanitizeNotes } from "./privacy";
import { scrubPIIText } from "../shared/piiScrubber";

export interface SessionRecord {
  id: number;
  researcherId: string;
  timestamp: string;
  dependencyScore: number;
  data: unknown;
  notes: string;
}

export interface NewSessionInput {
  researcherId: string;
  dependencyScore: number;
  data: unknown;
  notes?: string;
}

export class SessionRepository {
  private db: Database.Database;

  constructor(dbPath = "research_data.db") {
    this.db = new Database(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        researcherId TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        dependencyScore REAL,
        data TEXT,
        notes TEXT
      )
    `);
  }

  create(input: NewSessionInput): { id: number; delta: number } {
    const privacy = getPrivacyConfig();
    const persistedResearcherId = privacy.hashResearcherId ? hashResearcherId(input.researcherId) : input.researcherId;
    const sanitizedNotes = sanitizeNotes(input.notes || "", privacy.maxNotesChars);
    const persistedNotes = privacy.piiScrubberEnabled
      ? scrubPIIText(sanitizedNotes, false).redactedText
      : sanitizedNotes;

    const persistedData = privacy.storeRawData
      ? input.data
      : {
          classification: (input.data as any)?.classification,
          confidence: (input.data as any)?.confidence,
          researchData: (input.data as any)?.researchData,
          clinicalData: {
            diagnosticMarkers: (input.data as any)?.clinicalData?.diagnosticMarkers,
            griffithsScores: (input.data as any)?.clinicalData?.griffithsScores,
          },
          provenance: (input.data as any)?.provenance,
        };

    const previous = this.db
      .prepare("SELECT dependencyScore FROM sessions WHERE researcherId = ? ORDER BY timestamp DESC LIMIT 1")
      .get(persistedResearcherId) as { dependencyScore: number } | undefined;

    const delta = previous ? input.dependencyScore - previous.dependencyScore : 0;

    const result = this.db
      .prepare("INSERT INTO sessions (researcherId, dependencyScore, data, notes) VALUES (?, ?, ?, ?)")
      .run(persistedResearcherId, input.dependencyScore, JSON.stringify(persistedData), persistedNotes);

    return { id: Number(result.lastInsertRowid), delta };
  }

  listByResearcher(researcherId: string): SessionRecord[] {
    const privacy = getPrivacyConfig();
    const persistedResearcherId = privacy.hashResearcherId ? hashResearcherId(researcherId) : researcherId;

    const rows = this.db
      .prepare("SELECT * FROM sessions WHERE researcherId = ? ORDER BY timestamp DESC")
      .all(persistedResearcherId) as Array<{
        id: number;
        researcherId: string;
        timestamp: string;
        dependencyScore: number;
        data: string;
        notes: string;
      }>;

    return rows.map((row) => ({
      ...row,
      data: JSON.parse(row.data),
    }));
  }

  listAllFlat(): Array<Record<string, unknown>> {
    const rows = this.db.prepare("SELECT * FROM sessions ORDER BY timestamp DESC").all() as Array<{
      id: number;
      researcherId: string;
      timestamp: string;
      dependencyScore: number;
      data: string;
      notes: string;
    }>;

    return rows.map((row) => {
      const payload = JSON.parse(row.data) as Record<string, any>;
      const imagine = payload.clinicalData?.imagineAnalysis || {};

      return {
        sessionId: row.id,
        researcherId: row.researcherId,
        timestamp: row.timestamp,
        dependencyScore: row.dependencyScore,
        notes: row.notes,
        classification: payload.classification,
        confidence: payload.confidence,
        iadRiskLevel: payload.researchData?.iadRiskLevel,
        urgencyFlag: payload.clinicalData?.diagnosticMarkers?.urgencyFlag ? 1 : 0,
        imagineIdentity: imagine.identity,
        imagineMirroring: imagine.mirroring,
        imagineAffectiveLoop: imagine.affectiveLoop,
        model: payload.provenance?.model,
        thresholdProfileId: payload.provenance?.thresholdProfileId,
        thresholdProfileVersion: payload.provenance?.thresholdProfileVersion,
      };
    });
  }
}
