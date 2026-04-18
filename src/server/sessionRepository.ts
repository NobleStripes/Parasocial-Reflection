import Database from "better-sqlite3";

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
    const previous = this.db
      .prepare("SELECT dependencyScore FROM sessions WHERE researcherId = ? ORDER BY timestamp DESC LIMIT 1")
      .get(input.researcherId) as { dependencyScore: number } | undefined;

    const delta = previous ? input.dependencyScore - previous.dependencyScore : 0;

    const result = this.db
      .prepare("INSERT INTO sessions (researcherId, dependencyScore, data, notes) VALUES (?, ?, ?, ?)")
      .run(input.researcherId, input.dependencyScore, JSON.stringify(input.data), input.notes || "");

    return { id: Number(result.lastInsertRowid), delta };
  }

  listByResearcher(researcherId: string): SessionRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM sessions WHERE researcherId = ? ORDER BY timestamp DESC")
      .all(researcherId) as Array<{
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
      };
    });
  }
}
