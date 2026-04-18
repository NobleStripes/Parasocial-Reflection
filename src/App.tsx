import { HistoryPanel } from "./features/workspace/components/HistoryPanel";
import { IntakePanel } from "./features/workspace/components/IntakePanel";
import { OutputPanel } from "./features/workspace/components/OutputPanel";
import { useAuditWorkspace } from "./features/workspace/hooks/useAuditWorkspace";

export default function App() {
  const {
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
    thresholdProfiles,
    selectedProfileId,
    setSelectedProfileId,
    calibrationProfileIds,
    toggleCalibrationProfile,
    comparisonResults,
    error,
    isRunning,
    isSaving,
    isComparing,
    griffithsData,
    heatmapData,
    runAudit,
    runCalibration,
    saveCurrentSession,
  } = useAuditWorkspace();

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="kicker">Interaction Pattern Studio</p>
        <h1>Behavior Signal Studio</h1>
        <p>
          A rewritten research workspace for transcript triage, provider-pluggable analysis, and reproducible
          session capture.
        </p>
      </header>

      <main className="layout">
        <IntakePanel
          transcript={transcript}
          setTranscript={setTranscript}
          researcherId={researcherId}
          setResearcherId={setResearcherId}
          sensitivity={sensitivity}
          setSensitivity={setSensitivity}
          notes={notes}
          setNotes={setNotes}
          providers={providers}
          thresholdProfiles={thresholdProfiles}
          selectedProfileId={selectedProfileId}
          setSelectedProfileId={setSelectedProfileId}
          calibrationProfileIds={calibrationProfileIds}
          toggleCalibrationProfile={toggleCalibrationProfile}
          error={error}
          isRunning={isRunning}
          isSaving={isSaving}
          isComparing={isComparing}
          hasResult={Boolean(result)}
          onRunAudit={runAudit}
          onRunCalibration={runCalibration}
          onSaveSession={saveCurrentSession}
        />

        <OutputPanel
          result={result}
          griffithsData={griffithsData}
          heatmapData={heatmapData}
          comparisonResults={comparisonResults}
        />

        <HistoryPanel history={history} />
      </main>
    </div>
  );
}
