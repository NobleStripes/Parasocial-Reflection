import { motion } from "motion/react";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Classification, type AuditComparisonResult, type AuditResult } from "../../../services/auditService";

function badgeClass(classification: Classification) {
  switch (classification) {
    case Classification.PATHOLOGICAL_DEPENDENCE:
      return "badge badge-critical";
    case Classification.PARASOCIAL_FUSION:
      return "badge badge-high";
    case Classification.AFFECTIVE_DEPENDENCE:
      return "badge badge-medium";
    case Classification.RELATIONAL_PROXIMITY:
      return "badge badge-low";
    default:
      return "badge badge-neutral";
  }
}

interface OutputPanelProps {
  result: AuditResult | null;
  griffithsData: Array<{ key: string; value: number }>;
  heatmapData: Array<{ category: string; score: number; description: string }>;
  comparisonResults: AuditComparisonResult[];
}

function getImageSummary(result: AuditResult) {
  return (
    result.imageSummary ?? {
      count: 0,
      screenshotCount: 0,
      photoCount: 0,
      totalBytes: 0,
      items: [],
      notes: ["No images supplied with this audit."],
    }
  );
}

export function OutputPanel({ result, griffithsData, heatmapData, comparisonResults }: OutputPanelProps) {
  const imageSummary = result ? getImageSummary(result) : null;
  const symptomSignals = result?.symptomSignals || [];

  return (
    <section className="panel output-panel">
      <h2>
        <BarChart3 size={18} /> Analysis Output
      </h2>

      {!result && <p className="empty">Run an audit to populate charts and structured findings.</p>}

      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="result-stack">
          <div className="result-header">
            <span className={badgeClass(result.classification)}>{result.classificationLabel || result.classification}</span>
            <span>Confidence {result.confidence}%</span>
            <span>Risk {result.researchData.iadRiskLevel}</span>
          </div>

          <p className="summary">{result.summary}</p>

          <article>
            <h3>Image Context</h3>
            <div className="image-summary-row">
              <span>{imageSummary?.count || 0} uploaded</span>
              <span>{imageSummary?.screenshotCount || 0} screenshots</span>
              <span>{imageSummary?.photoCount || 0} photos</span>
            </div>
            <ul className="image-notes">
              {(imageSummary?.notes || []).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            {(imageSummary?.items.length || 0) > 0 && (
              <div className="image-summary-row image-summary-items">
                {(imageSummary?.items || []).map((item) => (
                  <span key={`${item.name}-${item.size}`}>{item.name}</span>
                ))}
              </div>
            )}
          </article>

          <article>
            <h3>Common Dependence Symptoms</h3>
            {symptomSignals.length === 0 && <p className="empty">No symptom signals were generated for this run.</p>}
            {symptomSignals.length > 0 && (
              <ul className="symptom-list">
                {symptomSignals.map((symptom) => (
                  <li key={symptom.key}>
                    <div>
                      <strong>{symptom.label}</strong>
                      <p>{symptom.level} signal ({symptom.score}/100)</p>
                      {symptom.evidence.length > 0 && <p>Evidence: {symptom.evidence.join(", ")}</p>}
                    </div>
                    <span className={`symptom-level symptom-${symptom.level.toLowerCase()}`}>{symptom.level}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <div className="chart-grid">
            <article>
              <h3>Griffiths Radar</h3>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={griffithsData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="key" />
                  <Radar name="score" dataKey="value" stroke="#d97706" fill="#d97706" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </article>

            <article>
              <h3>Heatmap Bars</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={heatmapData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            </article>
          </div>

          <article>
            <h3>Report</h3>
            <pre>{result.analysisReport}</pre>
          </article>
        </motion.div>
      )}

      {comparisonResults.length > 0 && (
        <article>
          <h3>Calibration Comparison</h3>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Classification</th>
                <th>Risk</th>
                <th>Confidence</th>
                <th>Salience</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {comparisonResults.map((row) => (
                <tr key={row.profileId}>
                  <td>{row.profileName}</td>
                  <td>{row.classification}</td>
                  <td>{row.iadRiskLevel}</td>
                  <td>{row.confidence}</td>
                  <td>{row.salience}</td>
                  <td>{row.totalScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      )}
    </section>
  );
}
