import { Database } from "lucide-react";

interface HistoryPanelProps {
  history: Array<Record<string, unknown>>;
}

export function HistoryPanel({ history }: HistoryPanelProps) {
  return (
    <section className="panel history-panel">
      <h2>
        <Database size={18} /> Session History
      </h2>

      {history.length === 0 && <p className="empty">No stored sessions for this researcher.</p>}

      {history.length > 0 && (
        <ul className="history-list">
          {history.slice(0, 12).map((item, index) => (
            <li key={String(item.id || index)}>
              <div>
                <strong>{String(item.timestamp || "unknown")}</strong>
                <p>{String(item.notes || "No notes")}</p>
              </div>
              <span>{String(item.dependencyScore || 0)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
