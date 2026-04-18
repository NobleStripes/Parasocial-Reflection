import { AlertCircle, FileUp, FlaskConical, Save, Send } from "lucide-react";

interface IntakePanelProps {
  transcript: string;
  setTranscript: (value: string) => void;
  researcherId: string;
  setResearcherId: (value: string) => void;
  sensitivity: number;
  setSensitivity: (value: number) => void;
  notes: string;
  setNotes: (value: string) => void;
  providers: string[];
  error: string | null;
  isRunning: boolean;
  isSaving: boolean;
  hasResult: boolean;
  onRunAudit: () => void;
  onSaveSession: () => void;
}

export function IntakePanel({
  transcript,
  setTranscript,
  researcherId,
  setResearcherId,
  sensitivity,
  setSensitivity,
  notes,
  setNotes,
  providers,
  error,
  isRunning,
  isSaving,
  hasResult,
  onRunAudit,
  onSaveSession,
}: IntakePanelProps) {
  return (
    <section className="panel input-panel">
      <h2>
        <FlaskConical size={18} /> Study Intake
      </h2>

      <label>
        Researcher ID
        <input value={researcherId} onChange={(event) => setResearcherId(event.target.value)} />
      </label>

      <label>
        Sensitivity: {sensitivity}
        <input
          type="range"
          min={0}
          max={100}
          value={sensitivity}
          onChange={(event) => setSensitivity(Number(event.target.value))}
        />
      </label>

      <label>
        Transcript
        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          rows={10}
          placeholder="Paste transcript..."
        />
      </label>

      <label>
        Analyst Notes
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Optional notes" />
      </label>

      <div className="actions">
        <button onClick={onRunAudit} disabled={isRunning} className="btn btn-primary">
          <Send size={16} /> {isRunning ? "Analyzing..." : "Run Audit"}
        </button>
        <button onClick={onSaveSession} disabled={!hasResult || isSaving} className="btn btn-quiet">
          <Save size={16} /> {isSaving ? "Saving..." : "Save Session"}
        </button>
        <button onClick={() => window.open("/api/export/json", "_blank")} className="btn btn-quiet">
          <FileUp size={16} /> Export JSON
        </button>
      </div>

      <div className="meta-block">
        <p>Available providers: {providers.join(", ") || "local"}</p>
      </div>

      {error && (
        <div className="error">
          <AlertCircle size={16} /> {error}
        </div>
      )}
    </section>
  );
}
