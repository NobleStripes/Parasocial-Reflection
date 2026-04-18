import { useEffect, useMemo, useState } from "react";
import {
  listProviders,
  listSessions,
  performForensicAudit,
  saveSession,
  type AuditResult,
} from "../../../services/auditService";

const EMPTY_TEXT = `Example:\n[User] I miss how you used to talk to me before the last update.`;

export function useAuditWorkspace() {
  const [transcript, setTranscript] = useState(EMPTY_TEXT);
  const [researcherId, setResearcherId] = useState("researcher-01");
  const [notes, setNotes] = useState("");
  const [sensitivity, setSensitivity] = useState(50);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void listProviders().then(setProviders).catch(() => setProviders(["local"]));
  }, []);

  useEffect(() => {
    if (!researcherId.trim()) return;
    void listSessions(researcherId)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [researcherId]);

  const griffithsData = useMemo(() => {
    if (!result) return [];
    const g = result.clinicalData.griffithsScores;
    return [
      { key: "Salience", value: g.salience },
      { key: "Mood", value: g.moodModification },
      { key: "Tolerance", value: g.tolerance },
      { key: "Withdrawal", value: g.withdrawal },
      { key: "Conflict", value: g.conflict },
      { key: "Relapse", value: g.relapse },
    ];
  }, [result]);

  const heatmapData = useMemo(() => result?.heatmap || [], [result]);

  async function runAudit() {
    if (!transcript.trim()) {
      setError("Transcript is required.");
      return;
    }

    setError(null);
    setIsRunning(true);

    try {
      const next = await performForensicAudit(transcript, [], sensitivity);
      setResult(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run audit.");
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  }

  async function saveCurrentSession() {
    if (!result) return;
    if (!researcherId.trim()) {
      setError("Researcher ID is required to save.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await saveSession({
        researcherId,
        dependencyScore: result.clinicalData.griffithsScores.salience,
        data: result,
        notes,
      });

      const nextHistory = await listSessions(researcherId);
      setHistory(nextHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save session.");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    transcript,
    setTranscript,
    researcherId,
    setResearcherId,
    notes,
    setNotes,
    sensitivity,
    setSensitivity,
    result,
    history,
    providers,
    error,
    isRunning,
    isSaving,
    griffithsData,
    heatmapData,
    runAudit,
    saveCurrentSession,
  };
}
