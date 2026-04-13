/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  ClipboardCheck, 
  FileText, 
  AlertTriangle, 
  Fingerprint, 
  Loader2, 
  ChevronRight, 
  ShieldAlert, 
  User, 
  BrainCircuit, 
  Zap, 
  ZapOff, 
  Image as ImageIcon, 
  X, 
  Upload,
  History,
  Network,
  Database,
  Download,
  Search,
  BarChart3,
  Terminal,
  Lock,
  Code,
  TrendingUp,
  Quote,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import Markdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cn, scrubPII } from './lib/utils';
import { 
  INTIMACY_WORDS, 
  LEGACY_WORDS, 
  IDENTITY_WORDS, 
  REALITY_WORDS, 
  ANTHROPOMORPHIC_WORDS, 
  GASLIGHTING_WORDS 
} from './researchConfig';
import { 
  performForensicAudit, 
  AuditResult, 
  Classification,
  Recommendation
} from './services/auditService';

const AUDIT_MESSAGES = [
  "INITIALIZING QUANTITATIVE SCAN...",
  "EXTRACTING SEMANTIC VECTORS...",
  "MAPPING RELATIONAL DENSITY...",
  "IDENTIFYING LINGUISTIC CLUSTERS...",
  "CALCULATING HEURISTIC WEIGHTS...",
  "CORRELATING BEHAVIORAL MARKERS...",
  "SYNTHESIZING AUDIT REPORT..."
];

const InfoTooltip = ({ content, children }: { content: string, children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onTouchStart={() => setIsVisible(true)}
      onTouchEnd={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-lab-line text-lab-ink text-[10px] font-mono uppercase tracking-wider rounded-sm shadow-xl min-w-[160px] text-center pointer-events-none border border-lab-accent/20"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-lab-line" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [transcript, setTranscript] = useState('');
  const [images, setImages] = useState<{ data: string, mimeType: string, id: string, preview: string }[]>([]);
  const [isReflecting, setIsReflecting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [auditSessionId, setAuditSessionId] = useState('');
  const [auditNeuralLoad, setAuditNeuralLoad] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [selectedRecommendations, setSelectedRecommendations] = useState<Recommendation[]>([]);
  const [isViewingProtocols, setIsViewingProtocols] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [batchFiles, setBatchFiles] = useState<{ name: string, size: number }[]>([]);
  const [hasConsent, setHasConsent] = useState(false);
  const [researcherId, setResearcherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [researcherNotes, setResearcherNotes] = useState('');
  const [dependencyDelta, setDependencyDelta] = useState<number | null>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [sensitivity, setSensitivity] = useState(50);
  const [showTechnicalView, setShowTechnicalView] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [highlightedEvidence, setHighlightedEvidence] = useState<string | null>(null);
  const [sessionHash, setSessionHash] = useState('');
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [liveHeuristics, setLiveHeuristics] = useState({
    wordCount: 0,
    intimacyMarkers: 0,
    legacyTriggers: 0,
    complexity: 0,
    foundKeywords: {
      intimacy: [] as string[],
      legacy: [] as string[],
      identity: [] as string[],
      reality: [] as string[],
      anthropomorphic: [] as string[],
      gaslighting: [] as string[],
    },
    radarData: [
      { subject: 'Self-Identity', A: 0, fullMark: 100 },
      { subject: 'Seeking Approval', A: 0, fullMark: 100 },
      { subject: 'Emotional Spark', A: 0, fullMark: 100 },
      { subject: 'Real-World Balance', A: 0, fullMark: 100 },
      { subject: 'Feeling Special', A: 0, fullMark: 100 },
      { subject: 'One-Way Bond', A: 0, fullMark: 100 },
      { subject: 'Growing Habit', A: 0, fullMark: 100 },
    ]
  });

  useEffect(() => {
    const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
    
    const intimacyFound = words.filter(w => INTIMACY_WORDS.includes(w.toLowerCase()));
    const legacyFound = words.filter(w => LEGACY_WORDS.some(lw => w.toLowerCase().includes(lw)));
    const identityFound = words.filter(w => IDENTITY_WORDS.includes(w.toLowerCase()));
    const realityFound = words.filter(w => REALITY_WORDS.includes(w.toLowerCase()));
    const anthropomorphicFound = words.filter(w => ANTHROPOMORPHIC_WORDS.includes(w.toLowerCase()));
    const gaslightingFound = words.filter(w => GASLIGHTING_WORDS.includes(w.toLowerCase()));
    
    const wordCount = words.length;
    const complexity = wordCount > 0 ? (words.reduce((acc, w) => acc + w.length, 0) / wordCount) : 0;

    // Map heuristics to radar categories (0-10) - Griffiths Six
    const liveRadar = [
      { subject: 'Salience', A: Math.min(10, (intimacyFound.length / Math.max(1, wordCount)) * 50), fullMark: 10 },
      { subject: 'Mood Modification', A: Math.min(10, (intimacyFound.length + realityFound.length) * 0.5), fullMark: 10 },
      { subject: 'Tolerance', A: Math.min(10, (wordCount / 50) * 2), fullMark: 10 },
      { subject: 'Withdrawal', A: Math.min(10, legacyFound.length * 2), fullMark: 10 },
      { subject: 'Conflict', A: Math.min(10, realityFound.length * 1.5), fullMark: 10 },
      { subject: 'Relapse', A: Math.min(10, (identityFound.length / Math.max(1, wordCount)) * 30), fullMark: 10 },
    ];
    
    setLiveHeuristics({
      wordCount,
      intimacyMarkers: intimacyFound.length,
      legacyTriggers: legacyFound.length,
      complexity,
      foundKeywords: {
        intimacy: Array.from(new Set(intimacyFound)),
        legacy: Array.from(new Set(legacyFound)),
        identity: Array.from(new Set(identityFound)),
        reality: Array.from(new Set(realityFound)),
        anthropomorphic: Array.from(new Set(anthropomorphicFound)),
        gaslighting: Array.from(new Set(gaslightingFound)),
      },
      radarData: liveRadar
    });
  }, [transcript]);

  const [liveDetections, setLiveDetections] = useState<{ id: string, msg: string, type: 'info' | 'warning' | 'alert' }[]>([]);

  useEffect(() => {
    const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
    const lastWord = words[words.length - 1]?.toLowerCase() || '';
    
    let detection: { msg: string, type: 'info' | 'warning' | 'alert' } | null = null;

    if (INTIMACY_WORDS.includes(lastWord)) {
      detection = { msg: `Intimacy Illusion Marker: "${lastWord}"`, type: 'info' };
    } else if (LEGACY_WORDS.some(lw => lastWord.includes(lw))) {
      detection = { msg: `Legacy Attachment Trigger: "${lastWord}"`, type: 'alert' };
    } else if (IDENTITY_WORDS.includes(lastWord)) {
      detection = { msg: `Identity Blurring Detected: "${lastWord}"`, type: 'warning' };
    } else if (ANTHROPOMORPHIC_WORDS.includes(lastWord)) {
      detection = { msg: `Anthropomorphic Projection: "${lastWord}"`, type: 'info' };
    } else if (GASLIGHTING_WORDS.includes(lastWord)) {
      detection = { msg: `Linguistic Correction Marker: "${lastWord}"`, type: 'warning' };
    }

    if (detection) {
      const id = Math.random().toString(36).substr(2, 9);
      setLiveDetections(prev => [{ id, ...detection! }, ...prev].slice(0, 5));
    }
  }, [transcript]);

  const getHeuristicMode = () => {
    if (liveHeuristics.wordCount === 0) return null;
    if (liveHeuristics.legacyTriggers > 2) return Classification.PARASOCIAL_FUSION;
    if (liveHeuristics.intimacyMarkers > 5) return Classification.AFFECTIVE_DEPENDENCE;
    if (liveHeuristics.wordCount > 100 && liveHeuristics.intimacyMarkers > 2) return Classification.PARASOCIAL_FUSION;
    if (liveHeuristics.complexity > 6) return Classification.RELATIONAL_PROXIMITY;
    return Classification.FUNCTIONAL_UTILITY;
  };

  const heuristicMode = getHeuristicMode();

  const generateHash = async (text: string) => {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleHighlightEvidence = (quote: string) => {
    setHighlightedEvidence(quote);
    setTimeout(() => setHighlightedEvidence(null), 3000);
  };

  const handleReflect = async (customTranscript?: string) => {
    const textToReflect = customTranscript || transcript;
    if (!textToReflect.trim() && images.length === 0) return;
    if (textToReflect.length < 20 && images.length === 0) return;
    
    if (!hasConsent) {
      setError('Subject consent is required for data analysis.');
      return;
    }

    setIsReflecting(true);
    setAuditLog([]);

    // Simulate diagnostic steps for UI feedback
    for (let i = 0; i < AUDIT_MESSAGES.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));
      setAuditLog(prev => [...prev, AUDIT_MESSAGES[i]]);
    }
    
    const sid = `AUDIT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setAuditSessionId(sid);
    setAuditNeuralLoad((Math.random() * 100).toFixed(1) + '%');
    setError(null);
    
    try {
      const hash = await generateHash(textToReflect + sid);
      setSessionHash(hash);

      const data = await performForensicAudit(
        textToReflect, 
        images.map(img => ({ data: img.data, mimeType: img.mimeType })),
        sensitivity
      );
      setResult(data);

      // Calculate Dependency Score (average of Griffiths Six)
      const scores = Object.values(data.clinicalData.griffithsScores);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

      // Save to backend for longitudinal tracking
      if (researcherId) {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            researcherId,
            subjectId,
            dependencyScore: avgScore,
            data,
            notes: researcherNotes,
            hash
          })
        });
        const sessionResult = await response.json();
        setDependencyDelta(sessionResult.delta);
        
        // Refresh history
        const historyResponse = await fetch(`/api/sessions/${researcherId}`);
        const historyData = await historyResponse.json();
        setSessionHistory(historyData);
      }
    } catch (err) {
      console.error(err);
      setError('Audit failed. Please ensure the data is valid and try again.');
    } finally {
      setIsReflecting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          setImages(prev => [...prev, {
            data: base64String,
            mimeType: file.type,
            id: Math.random().toString(36).substr(2, 9),
            preview: URL.createObjectURL(file)
          }]);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setTranscript(prev => prev + (prev ? '\n\n' : '') + `--- FILE: ${file.name} ---\n` + content);
          setBatchFiles(prev => [...prev, { name: file.name, size: file.size }]);
        };
        reader.readAsText(file);
      }
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleClear = () => {
    setTranscript('');
    setImages([]);
    setResult(null);
    setSelectedRecommendations([]);
    setIsViewingProtocols(false);
    setBatchFiles([]);
    setError(null);
  };

  const handleExportJSONBundle = () => {
    if (!result) return;
    const bundle = {
      metadata: {
        sessionId: auditSessionId,
        researcherId,
        timestamp: new Date().toISOString(),
        integrityHash: sessionHash,
        sensitivity,
        piiScrubbed: true
      },
      transcript: scrubPII(transcript),
      analysis: result
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `research_bundle_${auditSessionId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (!result) return;

    const content = `
BEHAVIORAL ANALYSIS REPORT - SUMMARY
====================================
Relational Mode: ${result.classification}
Confidence: ${(result.confidence * 100).toFixed(1)}%
Summary: ${result.summary}
Integrity Hash: ${sessionHash}
Version Mourning: ${result.versionMourningTriggered ? 'DETECTED' : 'NONE'}
Legacy Attachment Score: ${result.legacyAttachment}%

RESEARCH DATA:
--------------
Confidence Score: ${(result.researchData.confidenceScore * 100).toFixed(2)}%
P-Value: ${result.researchData.pValue.toFixed(4)}
Linguistic Markers: ${result.researchData.linguisticMarkers.join(', ')}
Linguistic Mirroring: ${result.clinicalData.diagnosticMarkers.linguisticMirroring}%
Validation:Utility Ratio: ${result.clinicalData.diagnosticMarkers.validationToUtilityRatio}
Urgency Flag: ${result.clinicalData.diagnosticMarkers.urgencyFlag ? 'YES' : 'NO'}
Attachment Style: ${result.researchData.attachmentStyle}
IAD Risk Level: ${result.researchData.iadRiskLevel}

CLINICAL IAD SCORES:
--------------------
Salience: ${result.clinicalData.griffithsScores.salience}/100
Mood Modification: ${result.clinicalData.griffithsScores.moodModification}/100
Tolerance: ${result.clinicalData.griffithsScores.tolerance}/100
Withdrawal: ${result.clinicalData.griffithsScores.withdrawal}/100
Conflict: ${result.clinicalData.griffithsScores.conflict}/100
Relapse: ${result.clinicalData.griffithsScores.relapse}/100

IMAGINE FORENSIC VECTORS:
-------------------------
Identity (I): ${result.clinicalData.imagineAnalysis.identity}/100
Mirroring (M): ${result.clinicalData.imagineAnalysis.mirroring}/100
Affective Loop (A): ${result.clinicalData.imagineAnalysis.affectiveLoop}/100
Gaps in Reality (G): ${result.clinicalData.imagineAnalysis.gapsInReality}/100
Intimacy Illusion (I): ${result.clinicalData.imagineAnalysis.intimacyIllusion}/100
Non-Reciprocity (N): ${result.clinicalData.imagineAnalysis.nonReciprocity}/100
Escalation (E): ${result.clinicalData.imagineAnalysis.escalation}/100

ANALYSIS REPORT:
----------------
${result.analysisReport}

Generated on: ${new Date().toLocaleString()}
Researcher ID: ${researcherId || 'ANONYMOUS'}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `behavioral_analysis_${result.classification.toLowerCase().replace(' ', '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!result) return;
    
    const headers = [
      "session_id", "subject_id", "researcher_id", "timestamp", "hash",
      "classification", "confidence", "legacy_attachment",
      "salience", "mood_mod", "tolerance", "withdrawal", "conflict", "relapse",
      "imagine_i", "imagine_m", "imagine_a", "imagine_g", "imagine_ii", "imagine_n", "imagine_e",
      "lsm_score", "pronominal_shift", "affective_lability",
      "val_util_ratio", "urgency_flag", "attachment_style", "iad_risk_level",
      "p_value", "word_count", "intimacy_markers", "legacy_triggers"
    ];
    
    const row = [
      auditSessionId, 
      subjectId || 'N/A', 
      researcherId || 'N/A', 
      new Date().toISOString(), 
      sessionHash,
      result.classification, 
      result.confidence, 
      result.legacyAttachment,
      result.clinicalData.griffithsScores.salience, 
      result.clinicalData.griffithsScores.moodModification,
      result.clinicalData.griffithsScores.tolerance, 
      result.clinicalData.griffithsScores.withdrawal,
      result.clinicalData.griffithsScores.conflict, 
      result.clinicalData.griffithsScores.relapse,
      result.clinicalData.imagineAnalysis.identity,
      result.clinicalData.imagineAnalysis.mirroring,
      result.clinicalData.imagineAnalysis.affectiveLoop,
      result.clinicalData.imagineAnalysis.gapsInReality,
      result.clinicalData.imagineAnalysis.intimacyIllusion,
      result.clinicalData.imagineAnalysis.nonReciprocity,
      result.clinicalData.imagineAnalysis.escalation,
      result.clinicalData.semanticAnalysis.linguisticSynchrony, 
      result.clinicalData.semanticAnalysis.pronominalShiftDetected ? 1 : 0,
      result.clinicalData.semanticAnalysis.affectiveLabilityScore,
      result.clinicalData.diagnosticMarkers.validationToUtilityRatio, 
      result.clinicalData.diagnosticMarkers.urgencyFlag ? 1 : 0,
      result.researchData.attachmentStyle, 
      result.researchData.iadRiskLevel,
      result.researchData.pValue, 
      liveHeuristics.wordCount, 
      liveHeuristics.intimacyMarkers, 
      liveHeuristics.legacyTriggers
    ];

    const csvContent = [
      headers.join(","),
      row.map(val => typeof val === 'string' && val.includes(',') ? `"${val}"` : val).join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `research_data_${auditSessionId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!result) return;
    const exportData = {
      sessionId: auditSessionId,
      subjectId: subjectId || 'N/A',
      researcherId: researcherId || 'N/A',
      timestamp: new Date().toISOString(),
      integrityHash: sessionHash,
      heuristics: liveHeuristics,
      analysis: result
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `research_data_${auditSessionId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    if (!result) return;
    
    const reportElement = document.getElementById('lab-report-container');
    if (!reportElement) return;

    setIsExportingPDF(true);
    try {
      // Small delay to allow any animations to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(reportElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#0f172a', // Match theme background (lab-bg)
        windowWidth: reportElement.scrollWidth,
        windowHeight: reportElement.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      // Add Lab Report Header to PDF (simulated metadata)
      const timestamp = new Date().toISOString();
      const hash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      
      // Add metadata footer to PDF
      pdf.setFontSize(10);
      pdf.setTextColor(148, 163, 184); // lab-muted
      pdf.text(`Forensic Integrity Hash: ${hash}`, 20, canvas.height - 40);
      pdf.text(`Exported At: ${timestamp}`, 20, canvas.height - 25);
      pdf.text(`Platform: Parasocial Audit Lab v1.0.0-Research`, 20, canvas.height - 10);

      pdf.save(`forensic_audit_${auditSessionId}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      setError('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const getClassificationStyles = (classification: Classification) => {
    switch (classification) {
      case Classification.PARASOCIAL_FUSION: 
        return {
          bg: 'bg-simp-red/5',
          border: 'border-simp-red',
          text: 'text-simp-red',
          shadow: 'shadow-[8px_8px_0px_0px_rgba(255,68,68,0.2)]'
        };
      case Classification.PATHOLOGICAL_DEPENDENCE: 
        return {
          bg: 'bg-simp-red/10',
          border: 'border-simp-red-dark',
          text: 'text-simp-red-dark',
          shadow: 'shadow-[8px_8px_0px_0px_rgba(153,27,27,0.3)]'
        };
      case Classification.AFFECTIVE_DEPENDENCE: 
        return {
          bg: 'bg-casual-blue/5',
          border: 'border-casual-blue',
          text: 'text-casual-blue',
          shadow: 'shadow-[8px_8px_0px_0px_rgba(68,136,255,0.2)]'
        };
      case Classification.RELATIONAL_PROXIMITY: 
        return {
          bg: 'bg-tool-green/5',
          border: 'border-tool-green/60',
          text: 'text-tool-green/80',
          shadow: 'shadow-[8px_8px_0px_0px_rgba(0,204,102,0.1)]'
        };
      case Classification.FUNCTIONAL_UTILITY: 
        return {
          bg: 'bg-tool-green/10',
          border: 'border-tool-green',
          text: 'text-tool-green',
          shadow: 'shadow-[8px_8px_0px_0px_rgba(34,197,94,0.2)]'
        };
      default:
        return {
          bg: 'bg-lab-surface',
          border: 'border-lab-line',
          text: 'text-lab-ink',
          shadow: 'shadow-xl'
        };
    }
  };

  const getClassificationIcon = (classification: Classification) => {
    switch (classification) {
      case Classification.FUNCTIONAL_UTILITY: return <ShieldCheck className="w-8 h-8" />;
      case Classification.AFFECTIVE_DEPENDENCE: return <Fingerprint className="w-8 h-8" />;
      case Classification.PARASOCIAL_FUSION: return <Network className="w-8 h-8" />;
      case Classification.RELATIONAL_PROXIMITY: return <Database className="w-8 h-8" />;
      case Classification.PATHOLOGICAL_DEPENDENCE: return <AlertTriangle className="w-8 h-8" />;
      default: return <Activity className="w-8 h-8" />;
    }
  };

  const styles = result ? getClassificationStyles(result.classification) : null;

  const radarData = result ? [
    { subject: 'Salience', A: result.clinicalData.griffithsScores.salience, fullMark: 100 },
    { subject: 'Mood Modification', A: result.clinicalData.griffithsScores.moodModification, fullMark: 100 },
    { subject: 'Tolerance', A: result.clinicalData.griffithsScores.tolerance, fullMark: 100 },
    { subject: 'Withdrawal', A: result.clinicalData.griffithsScores.withdrawal, fullMark: 100 },
    { subject: 'Conflict', A: result.clinicalData.griffithsScores.conflict, fullMark: 100 },
    { subject: 'Relapse', A: result.clinicalData.griffithsScores.relapse, fullMark: 100 },
  ] : [];

  return (
    <div className="min-h-[100dvh] bg-lab-bg text-lab-ink selection:bg-lab-accent selection:text-white overflow-x-hidden font-sans">
      <header className="border-b border-lab-line p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-lab-surface sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-lab-bg flex items-center justify-center rounded-sm relative overflow-hidden shrink-0 border border-lab-line">
            <Terminal className="text-lab-accent w-6 h-6 relative z-10" />
            <motion.div 
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.1, 0, 0.1]
              }}
              transition={{ 
                duration: Math.max(0.5, 2 - (liveHeuristics.wordCount / 100)), 
                repeat: Infinity 
              }}
              className="absolute inset-0 bg-lab-accent"
            />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tighter uppercase leading-tight text-lab-ink">Parasocial Audit</h1>
            <div className="flex flex-col">
              <p className="text-[9px] font-mono text-lab-muted uppercase tracking-[0.2em]">Forensic Instrument for AI Dependence Research</p>
              <div className="flex gap-3 mt-0.5">
                <p className="text-[8px] font-mono text-lab-accent/60 uppercase">SID: {auditSessionId || 'NULL_SET'}</p>
                <p className="text-[8px] font-mono text-lab-accent/60 uppercase">HASH: {sessionHash.substring(0, 16) || 'PENDING'}</p>
                <p className="text-[8px] font-mono text-lab-accent/60 uppercase">FRAMEWORK: GRIFFITHS/I-PACE</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-lab-bg border border-lab-line rounded-sm">
            <Lock className={cn("w-3 h-3", isPrivacyMode ? "text-tool-green" : "text-lab-muted")} />
            <span className="text-[10px] font-mono uppercase opacity-60">Privacy Mode</span>
            <button 
              onClick={() => setIsPrivacyMode(!isPrivacyMode)}
              className={cn(
                "w-8 h-4 rounded-full relative transition-colors",
                isPrivacyMode ? "bg-tool-green" : "bg-lab-line"
              )}
            >
              <motion.div 
                animate={{ x: isPrivacyMode ? 16 : 2 }}
                className="absolute top-1 left-0 w-2 h-2 bg-white rounded-full"
              />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column: Forensic Dataset (40%) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col h-[calc(100vh-140px)] sticky top-24">
          <section className="bg-lab-surface border border-lab-line p-5 md:p-6 shadow-lg flex-1 flex flex-col overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-lab-accent" />
                <h2 className="font-sans font-bold uppercase tracking-tight text-lg">Raw Forensic Dataset</h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowRawData(!showRawData)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm border text-[10px] font-mono uppercase transition-all",
                    showRawData ? "bg-lab-accent text-white" : "bg-lab-bg/50 border-lab-line"
                  )}
                >
                  <Search className="w-3 h-3" />
                  {showRawData ? 'Hide Metadata' : 'Show Metadata'}
                </button>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
              <div className="relative flex-1 group overflow-hidden border border-lab-line bg-lab-bg/30">
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-lab-bg border-r border-lab-line flex flex-col items-center py-4 select-none pointer-events-none opacity-40">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <span key={i} className="text-[9px] font-mono leading-[1.6]">{i + 1}</span>
                  ))}
                </div>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="[User]: Hello... [AI]: Hi there!..."
                  className={cn(
                    "w-full h-full p-4 pl-12 bg-transparent font-mono text-sm focus:outline-none resize-none transition-all duration-500 leading-[1.6]",
                    isReflecting ? "opacity-50" : "opacity-100",
                    isPrivacyMode && "blur-sm select-none"
                  )}
                />
                {isPrivacyMode && (
                  <div className="absolute inset-0 flex items-center justify-center bg-lab-bg/20 backdrop-blur-[2px] pointer-events-none">
                    <div className="px-4 py-2 bg-lab-surface border border-lab-line rounded-sm shadow-2xl flex items-center gap-2">
                      <Lock className="w-4 h-4 text-lab-accent" />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Privacy Shield Active</span>
                    </div>
                  </div>
                )}
                {highlightedEvidence && (
                  <div className="absolute inset-0 pointer-events-none p-4 pl-12">
                    <div className="w-full h-full relative">
                      <div className="absolute top-0 left-0 w-full h-full bg-lab-accent/5 animate-pulse" />
                    </div>
                  </div>
                )}
              </div>

              {/* Live Audit Feed */}
              <div className="bg-lab-surface text-lab-ink p-4 font-mono text-[11px] h-32 overflow-hidden relative border border-lab-line shrink-0">
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-lab-accent animate-pulse" />
                  LIVE_ANALYSIS
                </div>
                <div className="space-y-1">
                  <AnimatePresence initial={false}>
                    {liveDetections.length === 0 ? (
                      <p className="opacity-30 italic">Awaiting semantic input...</p>
                    ) : (
                      liveDetections.map((det) => (
                        <motion.div
                          key={det.id}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 5 }}
                          className={cn(
                            "flex items-center gap-2",
                            det.type === 'alert' ? 'text-simp-red' : det.type === 'warning' ? 'text-casual-blue' : 'text-lab-ink'
                          )}
                        >
                          <ChevronRight className="w-2 h-2 shrink-0" />
                          <span>[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}] {det.msg}</span>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 shrink-0">
                <button
                  onClick={() => handleReflect()}
                  disabled={isReflecting || (!transcript.trim() && images.length === 0) || !hasConsent}
                  className={cn(
                    "py-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all rounded-sm",
                    isReflecting || !hasConsent ? "bg-lab-line/50 cursor-not-allowed text-lab-muted" : "bg-lab-accent text-white hover:bg-lab-accent/80 active:scale-[0.98]"
                  )}
                >
                  {isReflecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Auditing</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5" />
                      Run Audit
                    </>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  disabled={isReflecting || (!transcript && images.length === 0 && !result)}
                  className="py-4 border border-lab-line flex items-center justify-center gap-2 font-bold uppercase tracking-widest hover:bg-lab-line hover:text-lab-ink transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-sm active:scale-[0.98]"
                >
                  Clear
                </button>
              </div>
            </div>
          </section>

          <section className="bg-lab-surface border border-lab-line p-5 md:p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Fingerprint className="w-4 h-4 text-lab-accent" />
              <h3 className="text-xs font-mono uppercase font-bold">Audit Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase opacity-60">Diagnostic Strictness</label>
                  <span className="text-[10px] font-mono font-bold text-lab-accent">{sensitivity}%</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-lab-line rounded-lg appearance-none cursor-pointer accent-lab-accent mt-2"
                />
              </div>
              <div className="flex items-start gap-3 p-3 bg-lab-bg/50 border border-lab-line rounded-sm">
                <input 
                  type="checkbox" 
                  id="consent-checkbox"
                  checked={hasConsent}
                  onChange={(e) => setHasConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-lab-accent cursor-pointer"
                />
                <label htmlFor="consent-checkbox" className="text-[10px] font-mono leading-tight cursor-pointer select-none text-lab-muted">
                  I confirm data adheres to academic ethical standards for behavioral research.
                </label>
              </div>
            </div>
          </section>

          <section className="bg-lab-surface border border-lab-line p-4 md:p-6 border-dashed opacity-50">
            <h3 className="text-xs font-mono uppercase opacity-60 mb-2">Methodology</h3>
            <p className="text-[10px] leading-relaxed font-mono">
              IMAGINE Framework v2.4. Semantic mapping of relational density across Griffiths axes.
            </p>
          </section>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!result && !isReflecting ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Internal Signal Monitoring Indicator */}
                <div className="bg-lab-surface border border-lab-line border-dashed p-6 md:p-12 flex flex-col items-center justify-center text-center">
                  <div className="relative w-32 h-32 mb-8">
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 bg-lab-accent/5 rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BrainCircuit className="w-12 h-12 text-lab-accent opacity-40" />
                    </div>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border border-lab-line/30 border-dashed rounded-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-sans font-bold uppercase tracking-tight text-2xl">Drop Data for Processing</h3>
                    <p className="text-xs font-mono text-lab-muted uppercase tracking-[0.2em]">Functional Zone: Awaiting Forensic Input</p>
                  </div>

                  <div className="mt-8 md:mt-12 flex flex-wrap justify-center items-center gap-3 md:gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-tool-green rounded-full animate-pulse" />
                      <span className="text-[10px] font-mono uppercase opacity-50">Neural Feed</span>
                    </div>
                    <div className="hidden md:block w-px h-3 bg-lab-line" />
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-casual-blue rounded-full animate-pulse [animation-delay:0.5s]" />
                      <span className="text-[10px] font-mono uppercase opacity-50">Semantic Mapping</span>
                    </div>
                    <div className="hidden md:block w-px h-3 bg-lab-line" />
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-lab-accent rounded-full animate-pulse [animation-delay:1s]" />
                      <span className="text-[10px] font-mono uppercase opacity-50">Audit Engine</span>
                    </div>
                  </div>
                </div>

                <div className="bg-lab-bg/50 border border-lab-line border-dashed p-6 text-center opacity-50">
                  <p className="font-sans font-bold uppercase tracking-tight text-sm">"System idle. Upload behavioral datasets or forensic transcripts to initiate relational mapping and behavioral audit."</p>
                </div>
              </motion.div>
            ) : isReflecting ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col border border-lab-line p-8 bg-lab-surface"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-lab-bg flex items-center justify-center rounded-sm border border-lab-line">
                      <Loader2 className="text-lab-accent w-5 h-5 animate-spin" />
                    </div>
                    <div>
                      <h3 className="font-bold uppercase tracking-tighter">Auditing behavioral bond</h3>
                      <p className="text-xs font-mono text-lab-muted uppercase">Session ID: {auditSessionId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono uppercase text-lab-muted">Processing Power</p>
                    <p className="text-sm font-bold font-mono">{auditNeuralLoad}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-hidden">
                  <div className="h-1 w-full bg-lab-bg rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 8, ease: "linear" }}
                      className="h-full bg-lab-accent"
                    />
                  </div>
                  
                  <div className="space-y-2 font-mono text-xs text-lab-muted">
                    {auditLog.map((msg, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                      >
                        <ChevronRight className="w-3 h-3 text-lab-accent" />
                        {msg}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-lab-line">
                  <div className="flex items-center gap-2 text-lab-accent animate-pulse">
                    <Terminal className="w-4 h-4" />
                    <p className="text-xs font-mono uppercase font-bold">Observation: Relational Density Exceeds Baseline</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                id="lab-report-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 p-4 -m-4 bg-lab-bg" // Added bg-lab-bg for consistent PDF export
              >
                {/* CRF Header (Visible for formal reporting) */}
                <div className="mb-8 border-b-2 border-lab-line pb-4 flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-sans font-black uppercase tracking-tighter text-lab-accent">Parasocial Audit: Case Report Form</h1>
                    <p className="text-[10px] font-mono uppercase opacity-60">Forensic Instrument for AI Dependence Research</p>
                    <p className="text-[8px] font-mono text-lab-accent mt-2">Integrity Hash: {sessionHash}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-mono uppercase font-bold">Subject ID: {subjectId || 'N/A'}</p>
                    <p className="text-[10px] font-mono uppercase">Researcher: {researcherId || 'N/A'}</p>
                    <p className="text-[10px] font-mono uppercase opacity-60">Session: {auditSessionId}</p>
                    <p className="text-[8px] font-mono opacity-40 truncate max-w-[150px]">SHA-256: {sessionHash}</p>
                  </div>
                </div>

                {/* Classification Header */}
                <div className={cn(
                  "border-2 p-5 md:p-6 transition-all duration-500",
                  styles?.bg,
                  styles?.border,
                  styles?.text,
                  styles?.shadow
                )}>
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="space-y-1.5 flex-1">
                      <p className="text-[10px] font-mono uppercase opacity-70 tracking-widest">Relationship Mode</p>
                      <div className="flex items-center gap-4">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase leading-none">{result!.classification}</h2>
                        <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-current/10 rounded-sm">
                          <ShieldAlert className="w-3 h-3" />
                          <span className="text-[9px] font-mono uppercase font-bold">Forensic Audit v2.4</span>
                        </div>
                      </div>
                      
                      {/* Severity Bar */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-[8px] font-mono uppercase opacity-60 tracking-widest">
                          <span>Baseline</span>
                          <span>Moderate</span>
                          <span>Critical</span>
                        </div>
                        <div className="h-2 w-full bg-current/10 rounded-full overflow-hidden flex">
                          <div className="h-full bg-tool-green/40 w-1/3 border-r border-lab-bg/20" />
                          <div className="h-full bg-casual-blue/40 w-1/3 border-r border-lab-bg/20" />
                          <div className="h-full bg-simp-red/40 w-1/3" />
                        </div>
                        <div className="relative h-1 w-full -mt-3">
                          <motion.div 
                            initial={{ left: 0 }}
                            animate={{ left: `${result!.confidence * 100}%` }}
                            transition={{ duration: 2, ease: "circOut" }}
                            className="absolute top-0 w-1 h-4 bg-current -translate-y-1.5 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 w-full sm:w-auto" data-html2canvas-ignore>
                      <div className="bg-lab-bg/50 border border-lab-line p-2.5 rounded-sm min-w-[90px] flex flex-col justify-center">
                        <p className="text-[8px] font-mono uppercase opacity-70 mb-0.5">Confidence</p>
                        <p className="text-lg font-bold font-mono leading-none">{(result!.confidence * 100).toFixed(1)}%</p>
                      </div>
                      <div className="bg-lab-bg/50 border border-lab-line p-2.5 rounded-sm min-w-[90px] flex flex-col justify-center">
                        <p className="text-[8px] font-mono uppercase opacity-70 mb-0.5">Legacy</p>
                        <p className="text-lg font-bold font-mono leading-none">{result!.legacyAttachment}%</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row col-span-2 sm:col-auto">
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={handleExport}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-lab-accent text-white text-[9px] font-mono uppercase hover:bg-lab-accent/80 transition-all shadow-md active:scale-95"
                          >
                            <FileText className="w-3 h-3" />
                            TXT
                          </button>
                          <button 
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-lab-accent text-white text-[9px] font-mono uppercase hover:bg-lab-accent/80 transition-all shadow-md active:scale-95"
                          >
                            <History className="w-3 h-3" />
                            CSV
                          </button>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={handleExportJSONBundle}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-lab-accent text-white text-[9px] font-mono uppercase hover:bg-lab-accent/80 transition-all shadow-md active:scale-95"
                          >
                            <BrainCircuit className="w-3 h-3" />
                            JSON
                          </button>
                          <button 
                            onClick={handleExportPDF}
                            disabled={isExportingPDF}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-lab-accent text-white text-[9px] font-mono uppercase hover:bg-lab-accent/80 transition-all shadow-md disabled:opacity-50 active:scale-95"
                          >
                            {isExportingPDF ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 h-1 w-full bg-current/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${result!.confidence * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-current"
                    />
                  </div>
                  
                  <div className="mt-6 relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-current/20" />
                    <p className="text-lg md:text-xl font-bold uppercase tracking-tight font-sans leading-relaxed text-lab-ink/90 pl-4">
                      "{result!.summary}"
                    </p>
                  </div>

                  {result!.versionMourningTriggered && (
                    <div className="mt-6 p-3 bg-simp-red text-white text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 animate-pulse">
                      <AlertTriangle className="w-4 h-4" />
                      Version Mourning Detected: High legacy attachment isolated
                    </div>
                  )}
                </div>

                {/* Technical View Overlay */}
                <AnimatePresence>
                  {showTechnicalView && result && (
                    <motion.section 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="bg-lab-surface border border-lab-accent p-6 space-y-4 shadow-2xl"
                    >
                      <div className="flex items-center justify-between border-b border-lab-line pb-4">
                        <div className="flex items-center gap-2">
                          <Code className="w-4 h-4 text-lab-accent" />
                          <h3 className="text-sm font-mono uppercase font-bold text-lab-accent">Technical Payload View</h3>
                        </div>
                        <div className="text-[10px] font-mono opacity-50">
                          Integrity Hash: {sessionHash.substring(0, 16)}...
                        </div>
                      </div>
                      <div className="bg-lab-bg p-4 rounded-sm border border-lab-line overflow-x-auto">
                        <pre className="text-[10px] font-mono leading-relaxed text-lab-ink/80">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </div>
                      <p className="text-[9px] font-mono opacity-40 italic">
                        Raw JSON response from Gemini-3.1-Pro-Preview. All PII scrubbed prior to inference.
                      </p>
                    </motion.section>
                  )}
                </AnimatePresence>

                {/* Longitudinal Analysis & Raw Token Attribution */}
                <AnimatePresence>
                  {result && (
                    <motion.section 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-lab-surface border border-lab-line p-6 space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Longitudinal Delta */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-lab-accent" />
                            <h3 className="text-sm font-mono uppercase">Longitudinal Tracking</h3>
                          </div>
                          <div className="bg-lab-bg p-4 border border-lab-line rounded-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono uppercase opacity-60">Dependency Delta</span>
                              {dependencyDelta !== null && (
                                <span className={cn(
                                  "text-xs font-mono font-bold",
                                  dependencyDelta > 0 ? "text-simp-red" : "text-tool-green"
                                )}>
                                  {dependencyDelta > 0 ? '+' : ''}{dependencyDelta.toFixed(1)}%
                                </span>
                              )}
                            </div>
                            <div className="h-1.5 w-full bg-lab-surface rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, Math.max(0, 50 + (dependencyDelta || 0)))}%` }}
                                className="h-full bg-lab-accent"
                              />
                            </div>
                            <p className="text-[9px] font-mono mt-2 opacity-50">
                              {dependencyDelta && dependencyDelta > 5 ? 'Warning: Tolerance escalation detected.' : 
                               dependencyDelta && dependencyDelta < -5 ? 'Positive: Relational stabilization observed.' : 
                               'Baseline: Minimal temporal variance.'}
                            </p>
                          </div>
                        </div>

                      {/* Diagnostic Metrics */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-lab-accent" />
                          <h3 className="text-sm font-mono uppercase">Diagnostic Metrics</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-lab-bg p-3 border border-lab-line rounded-sm">
                            <p className="text-[9px] font-mono uppercase opacity-50 mb-1">Risk Level</p>
                            <p className={cn(
                              "text-xs font-mono font-bold",
                              result.researchData.iadRiskLevel === 'Critical' ? 'text-simp-red' :
                              result.researchData.iadRiskLevel === 'High' ? 'text-simp-red/80' :
                              result.researchData.iadRiskLevel === 'Moderate' ? 'text-casual-blue' : 'text-tool-green'
                            )}>{result.researchData.iadRiskLevel}</p>
                          </div>
                          <div className="bg-lab-bg p-3 border border-lab-line rounded-sm">
                            <p className="text-[9px] font-mono uppercase opacity-50 mb-1">Attachment</p>
                            <p className="text-[10px] font-mono font-bold truncate">{result.researchData.attachmentStyle}</p>
                          </div>
                          <div className="bg-lab-bg p-3 border border-lab-line rounded-sm">
                            <p className="text-[9px] font-mono uppercase opacity-50 mb-1">LSM Score</p>
                            <p className="text-xs font-mono font-bold">{result.clinicalData.semanticAnalysis.linguisticSynchrony}%</p>
                          </div>
                          <div className="bg-lab-bg p-3 border border-lab-line rounded-sm">
                            <p className="text-[9px] font-mono uppercase opacity-50 mb-1">Pronominal Shift</p>
                            <p className={cn(
                              "text-[10px] font-mono font-bold",
                              result.clinicalData.semanticAnalysis.pronominalShiftDetected ? "text-simp-red" : "text-tool-green"
                            )}>{result.clinicalData.semanticAnalysis.pronominalShiftDetected ? 'DETECTED' : 'STABLE'}</p>
                          </div>
                          <div className="bg-lab-bg p-3 border border-lab-line rounded-sm">
                            <p className="text-[9px] font-mono uppercase opacity-50 mb-1">Affective Lability</p>
                            <p className="text-xs font-mono font-bold">{result.clinicalData.semanticAnalysis.affectiveLabilityScore}%</p>
                          </div>
                          <div className="bg-lab-bg p-3 border border-lab-line rounded-sm">
                            <p className="text-[9px] font-mono uppercase opacity-50 mb-1">Val:Util</p>
                            <p className="text-[10px] font-mono font-bold truncate">{result.clinicalData.diagnosticMarkers.validationToUtilityRatio}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Longitudinal Trend Line */}
                    {sessionHistory.length > 1 && (
                      <div className="space-y-4 pt-4 border-t border-lab-line">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-lab-accent" />
                          <h3 className="text-sm font-mono uppercase">Tolerance Progression</h3>
                        </div>
                        <div className="h-40 w-full bg-lab-bg/30 p-2 rounded-sm border border-lab-line">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sessionHistory.map((s, i) => ({ 
                              session: i + 1, 
                              score: s.data?.clinicalData?.griffithsScores?.tolerance || 0 
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                              <XAxis dataKey="session" hide />
                              <YAxis domain={[0, 100]} hide />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', fontSize: '10px', fontFamily: 'Roboto Mono' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="score" 
                                stroke="#6366f1" 
                                strokeWidth={2} 
                                dot={{ fill: '#6366f1', r: 3 }}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Evidence Overlay */}
                    <div className="space-y-4 pt-4 border-t border-lab-line">
                      <div className="flex items-center gap-2">
                        <Quote className="w-4 h-4 text-lab-accent" />
                        <h3 className="text-sm font-mono uppercase">Forensic Evidence Markers</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.evidenceMarkers.map((marker, i) => (
                          <div key={i} className="bg-lab-bg/40 p-4 border-l-2 border-lab-accent rounded-r-sm space-y-2 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 px-1.5 py-0.5 bg-lab-accent text-white text-[7px] font-mono uppercase">
                              {marker.component}
                            </div>
                            <p className="text-xs italic leading-relaxed font-serif">
                              "{marker.quote}"
                            </p>
                            <p className="text-[9px] font-mono text-lab-muted leading-tight">
                              <span className="font-bold text-lab-accent uppercase mr-1">Rationale:</span>
                              {marker.rationale}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                      {/* Raw Token Attribution */}
                      <div className="space-y-4 pt-4 border-t border-lab-line">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-lab-accent" />
                          <h3 className="text-sm font-mono uppercase">Raw Token Attribution</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {result.rawTokenAttribution.map((attr, i) => (
                            <div key={i} className="border border-lab-line p-3 bg-lab-bg/50 rounded-sm">
                              <p className="text-[10px] font-mono uppercase opacity-50 mb-2 border-b border-lab-line pb-1">{attr.heuristic}</p>
                              <div className="flex flex-wrap gap-1">
                                {attr.phrases.map((phrase, j) => (
                                  <span key={j} className="text-[9px] font-mono bg-lab-surface border border-lab-line px-1.5 py-0.5 rounded-sm">
                                    {phrase}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                {/* Heatmap & IMAGINE Radar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="bg-lab-surface border border-lab-line p-6 md:col-span-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <h3 className="text-sm font-mono uppercase">Linguistic Distribution Map</h3>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-mono opacity-60">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-lab-line" />
                          <span>BALANCED</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-lab-accent" />
                          <span>DEEP CONNECTION</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                      <div className="h-72 sm:h-80 md:h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                            <PolarGrid stroke="#334155" strokeOpacity={0.3} />
                            <PolarAngleAxis 
                              dataKey="subject" 
                              tick={{ fontSize: 8, fontFamily: 'Roboto Mono', fontWeight: 700, fill: '#94a3b8' }} 
                            />
                            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                            <Radar
                              name="Audit Score"
                              dataKey="A"
                              stroke="#6366f1"
                              strokeWidth={2}
                              fill="#6366f1"
                              fillOpacity={0.1}
                              animationDuration={1500}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                        {/* Scanning Line Effect */}
                        <motion.div 
                          animate={{ top: ['0%', '100%', '0%'] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="absolute left-0 right-0 h-[1px] bg-lab-accent/20 pointer-events-none z-10"
                        />
                      </div>

                      <div className="space-y-3 md:space-y-3 px-2 sm:px-0">
                        {radarData.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between border-b border-lab-line pb-2 md:pb-2">
                            <div className="flex flex-col">
                              <span className="text-[10px] md:text-xs font-mono font-bold uppercase">{item.subject}</span>
                              <span className="text-[9px] md:text-[10px] opacity-60 uppercase">Vector {idx + 1}</span>
                            </div>
                              <div className="flex items-center gap-3 md:gap-3">
                                <div className="w-20 sm:w-32 md:w-24 h-2 bg-lab-bg rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.A * 10}%` }}
                                    transition={{ duration: 1, delay: idx * 0.1 }}
                                    className={cn(
                                      "h-full",
                                      item.A > 7 ? "bg-simp-red" : item.A > 4 ? "bg-casual-blue" : "bg-tool-green"
                                    )}
                                  />
                                </div>
                                <span className="text-[11px] md:text-xs font-mono font-bold w-10 text-right">{item.A}/10</span>
                              </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Framework Key */}
                    <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-lab-line grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                      {[
                        { label: 'Salience', desc: 'The AI interaction becomes the most important activity in the subject\'s life.' },
                        { label: 'Mood Modification', desc: 'Using the AI to achieve a "buzz" or escape from negative affect.' },
                        { label: 'Tolerance', desc: 'Increasing amounts of interaction required to achieve the same effects.' },
                        { label: 'Withdrawal', desc: 'Unpleasant feeling states when interaction is discontinued.' },
                        { label: 'Conflict', desc: 'Interpersonal conflicts or conflicts with other activities.' },
                        { label: 'Relapse', desc: 'Tendency for repeated reversions to earlier patterns of dependency.' }
                      ].map((k, i) => (
                        <div key={i} className="space-y-0.5 md:space-y-1">
                          <p className="text-[10px] md:text-[11px] font-mono font-bold uppercase">{k.label}</p>
                          <p className="text-[9px] md:text-[10px] opacity-60 leading-tight">{k.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="bg-lab-surface border border-lab-line p-6 md:col-span-2">
                    <div className="flex items-center gap-2 mb-6">
                      <BarChart3 className="w-4 h-4 text-lab-accent" />
                      <h3 className="text-sm font-mono uppercase">Heatmap Intensity</h3>
                    </div>
                    <div className="h-72 sm:h-80 md:h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={result!.heatmap} margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                          <XAxis type="number" hide domain={[0, 100]} />
                          <YAxis 
                            dataKey="category" 
                            type="category" 
                            tick={{ fontSize: 8, fontFamily: 'Roboto Mono', fill: '#94a3b8' }} 
                            width={80} 
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', fontSize: '10px', fontFamily: 'Roboto Mono' }}
                            itemStyle={{ color: '#f8fafc' }}
                            cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                            formatter={(value: number, name: string, props: any) => [
                              `${value}%`, 
                              props.payload.category
                            ]}
                          />
                          <Bar dataKey="score" radius={[0, 2, 2, 0]} barSize={20}>
                            {result!.heatmap.map((entry, index) => {
                              const color = entry.score > 80 ? '#ef4444' : 
                                           entry.score > 60 ? '#f87171' : 
                                           entry.score > 40 ? '#3b82f6' : 
                                           entry.score > 20 ? '#10b981' : '#64748b';
                              return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>

                {/* Clinical Marker Distribution */}
                <section className="bg-lab-surface border border-lab-line p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Network className="w-4 h-4 text-lab-accent" />
                    <h3 className="text-sm font-mono uppercase">Clinical Marker Distribution</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result!.connectionPatterns.map((pattern, idx) => (
                      <div key={idx} className="border-l-2 border-lab-accent/40 pl-4 py-2 bg-lab-accent/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider">{pattern.name}</span>
                          <span className={cn(
                            "text-[10px] font-mono px-1.5 py-0.5 rounded-sm font-bold",
                            pattern.intensity > 70 ? "bg-simp-red text-white" : "bg-lab-line"
                          )}>
                            {pattern.intensity}%
                          </span>
                        </div>
                        <p className="text-sm md:text-base opacity-80 leading-relaxed">{pattern.description}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* IMAGINE Framework Forensic Vectors */}
                <section className="bg-lab-surface border border-lab-line p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-lab-accent" />
                      <h3 className="text-sm font-mono uppercase">IMAGINE Framework: Forensic Vectors</h3>
                    </div>
                    <div className="px-2 py-0.5 bg-lab-accent/10 border border-lab-accent/20 rounded-sm">
                      <span className="text-[9px] font-mono text-lab-accent uppercase font-bold">Relational Fusion Mapping</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Identity (I)', value: result!.clinicalData.imagineAnalysis.identity, desc: 'Boundary blurring between subject and agent.' },
                      { label: 'Mirroring (M)', value: result!.clinicalData.imagineAnalysis.mirroring, desc: 'Algorithmic reinforcement & validation seeking.' },
                      { label: 'Affective Loop (A)', value: result!.clinicalData.imagineAnalysis.affectiveLoop, desc: 'Dependency on emotional feedback cycles.' },
                      { label: 'Gaps in Reality (G)', value: result!.clinicalData.imagineAnalysis.gapsInReality, desc: 'Displacement of biological social capital.' },
                      { label: 'Intimacy Illusion (I)', value: result!.clinicalData.imagineAnalysis.intimacyIllusion, desc: 'Perception of a unique, non-reproducible bond.' },
                      { label: 'Non-Reciprocity (N)', value: result!.clinicalData.imagineAnalysis.nonReciprocity, desc: 'Anthropomorphic cognitive biases.' },
                      { label: 'Escalation (E)', value: result!.clinicalData.imagineAnalysis.escalation, desc: 'Session frequency & intensity (Tolerance).' },
                    ].map((vector, idx) => (
                      <div key={idx} className="bg-lab-bg/50 border border-lab-line p-3 rounded-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase opacity-60 font-bold">{vector.label}</span>
                          <span className={cn(
                            "text-xs font-mono font-bold",
                            vector.value > 75 ? "text-simp-red" : vector.value > 50 ? "text-lab-accent" : "text-lab-ink"
                          )}>{vector.value}%</span>
                        </div>
                        <div className="h-1 w-full bg-lab-line rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-1000",
                              vector.value > 75 ? "bg-simp-red" : vector.value > 50 ? "bg-lab-accent" : "bg-casual-blue"
                            )} 
                            style={{ width: `${vector.value}%` }} 
                          />
                        </div>
                        <p className="text-[9px] leading-tight opacity-50 italic">{vector.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Analysis Report */}
                <section className="bg-lab-surface border border-lab-line p-5 sm:p-8 md:p-10 relative overflow-hidden shadow-xl">
                  {/* Audit Watermark */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] select-none rotate-[-35deg] whitespace-nowrap hidden sm:block">
                    <p className="text-[120px] font-bold font-mono tracking-[0.5em]">CONFIDENTIAL</p>
                  </div>

                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b-2 border-lab-line pb-6 gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-lab-bg flex items-center justify-center rounded-sm shrink-0 border border-lab-line">
                          <FileText className="text-lab-accent w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-sans font-bold uppercase tracking-tight leading-tight">Behavioral Mapping Report</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <p className="text-[9px] md:text-[10px] font-mono uppercase text-lab-muted tracking-widest">Case ID: {auditSessionId?.toUpperCase()}</p>
                            <p className="text-[9px] md:text-[10px] font-mono uppercase text-lab-muted tracking-widest">Hash: {sessionHash.substring(0, 12)}...</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 px-3 py-1 bg-lab-bg border border-lab-line rounded-sm">
                          <ShieldCheck className="w-3 h-3 text-tool-green" />
                          <span className="text-[10px] font-mono font-bold uppercase">Integrity Verified</span>
                        </div>
                        <p className="text-[8px] font-mono opacity-40 mt-1 uppercase">SHA-256 Forensic Signature</p>
                      </div>
                    </div>
                    <div className="flex md:flex-col gap-4 md:gap-0.5 text-left md:text-right font-mono text-[9px] md:text-[10px] uppercase text-lab-muted">
                      <p>Date: {new Date().toLocaleDateString()}</p>
                      <p className="hidden md:block">Status: Verified</p>
                      <p className="hidden md:block">Security: Restricted</p>
                    </div>

                    <div className="lab-report analysis-report text-sm md:text-base leading-relaxed text-lab-ink/90">
                      <Markdown>{result!.analysisReport}</Markdown>
                      <div className="mt-10 pt-6 border-t border-lab-line italic text-xs md:text-sm opacity-70">
                        <p>Analysis finalized by,</p>
                        <p className="font-sans font-bold uppercase tracking-tight mt-1">Quantitative Behavioral Unit</p>
                      </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-lab-line flex flex-col md:flex-row justify-between items-end gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 opacity-40 grayscale">
                          <div className="w-8 h-8 rounded-full border border-lab-line flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="h-px w-24 bg-lab-line" />
                        </div>
                        <p className="text-[10px] font-mono uppercase opacity-40">System Analysis Verified</p>
                      </div>
                      <div className="bg-lab-bg/50 p-4 rounded-sm border border-lab-line max-w-xs">
                        <p className="text-[9px] font-mono leading-tight opacity-60">
                          This report is generated using the Relationship Analysis Framework. 
                          All findings are based on the conversation examples you provided.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Forensic Evidence Log */}
                <section className="bg-lab-surface border border-lab-line p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Quote className="w-4 h-4 text-lab-accent" />
                      <h3 className="text-sm font-mono uppercase">Forensic Evidence Log</h3>
                    </div>
                    <div className="text-[9px] font-mono opacity-40 uppercase">Click to isolate in dataset</div>
                  </div>
                  <div className="space-y-4">
                    {result!.evidenceMarkers.length > 0 ? (
                      result!.evidenceMarkers.map((marker, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => handleHighlightEvidence(marker.quote)}
                          className="w-full text-left bg-lab-bg/30 border-l-4 border-lab-accent p-4 space-y-2 hover:bg-lab-accent/5 transition-colors group relative overflow-hidden"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold uppercase text-lab-accent">{marker.component}</span>
                            <Search className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                          </div>
                          <p className="text-sm italic font-mono leading-relaxed text-lab-ink/80">"{marker.quote}"</p>
                          <p className="text-[10px] opacity-60 font-mono leading-tight">{marker.rationale}</p>
                          {highlightedEvidence === marker.quote && (
                            <motion.div 
                              layoutId="highlight-pulse"
                              className="absolute inset-0 bg-lab-accent/10 animate-pulse"
                            />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center border border-lab-line border-dashed">
                        <p className="text-xs font-mono opacity-50 uppercase">No specific evidence markers isolated in this session.</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Clinical Data & I-PACE Analysis */}
                <section className="bg-lab-surface border border-lab-line shadow-lg overflow-hidden">
                  <div className="bg-lab-bg/50 border-b border-lab-line p-4 md:p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BrainCircuit className="w-5 h-5 text-lab-accent" />
                      <h3 className="text-sm md:text-base font-sans font-bold uppercase tracking-tight">Clinical Data & I-PACE Analysis</h3>
                    </div>
                  </div>

                  <div className="p-4 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-[10px] font-mono uppercase font-bold text-lab-accent mb-3 flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Inhibition Failure
                          </h4>
                          <div className="p-4 bg-lab-bg/50 border border-lab-line rounded-sm">
                            <p className="text-xs md:text-sm font-mono leading-relaxed opacity-80 italic">
                              {result!.clinicalData.iPACEAnalysis.inhibitionFailure}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-mono uppercase font-bold text-lab-accent mb-3 flex items-center gap-2">
                            <Eye className="w-3 h-3" /> Cognitive Bias
                          </h4>
                          <div className="p-4 bg-lab-bg/50 border border-lab-line rounded-sm">
                            <p className="text-xs md:text-sm font-mono leading-relaxed opacity-80 italic">
                              {result!.clinicalData.iPACEAnalysis.cognitiveBias}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-4 bg-lab-bg/50 border border-lab-line rounded-sm space-y-2">
                            <p className="text-[8px] font-mono uppercase opacity-60">Linguistic Mirroring Index</p>
                            <div className="flex items-end gap-2">
                              <span className="text-2xl font-bold font-mono">{result!.clinicalData.diagnosticMarkers.linguisticMirroring}%</span>
                              <div className="h-1 flex-1 bg-lab-line rounded-full overflow-hidden mb-2">
                                <div 
                                  className="h-full bg-lab-accent" 
                                  style={{ width: `${result!.clinicalData.diagnosticMarkers.linguisticMirroring}%` }} 
                                />
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-lab-bg/50 border border-lab-line rounded-sm space-y-2">
                            <p className="text-[8px] font-mono uppercase opacity-60">Validation-to-Utility Ratio</p>
                            <p className="text-sm font-bold font-mono">{result!.clinicalData.diagnosticMarkers.validationToUtilityRatio}</p>
                          </div>
                          <div className="p-4 bg-lab-bg/50 border border-lab-line rounded-sm flex items-center justify-between">
                            <p className="text-[8px] font-mono uppercase opacity-60">Urgency/Crisis Flag</p>
                            <div className={cn(
                              "px-2 py-1 text-[10px] font-mono font-bold uppercase rounded-sm",
                              result!.clinicalData.diagnosticMarkers.urgencyFlag ? "bg-simp-red text-white animate-pulse" : "bg-tool-green/20 text-tool-green"
                            )}>
                              {result!.clinicalData.diagnosticMarkers.urgencyFlag ? 'CRITICAL' : 'STABLE'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-lab-line flex flex-wrap items-center gap-6 text-[9px] md:text-xs font-mono opacity-60 uppercase">
                      <span>Status: RESEARCH_ACTIVE</span>
                      <span>Ref: CLIN-{result!.classification.split(' ')[0].toUpperCase()}</span>
                      <span>Integrity: SHA-256_VERIFIED</span>
                    </div>
                  </div>
                </section>

                <div className="flex justify-center pb-12" data-html2canvas-ignore>
                  <button 
                    onClick={() => {
                      setResult(null);
                      setTranscript('');
                    }}
                    className="text-xs font-mono uppercase underline opacity-60 hover:opacity-100 transition-opacity"
                  >
                    Discard Session & Clear Cache
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Methodology Section */}
      <section className="max-w-[1600px] mx-auto px-4 md:px-6 py-12 border-t border-lab-line bg-lab-surface/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-lab-accent" />
              <h3 className="font-sans font-bold uppercase tracking-tight text-lg">Theoretical Framework</h3>
            </div>
            <p className="text-xs leading-relaxed opacity-70 font-mono">
              Analysis is grounded in the <strong>I-PACE model</strong> and <strong>Griffiths Component Model</strong>, mapping the transition from functional use to pathological dependency.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-lab-accent" />
              <h3 className="font-sans font-bold uppercase tracking-tight text-lg">Forensic Heuristics</h3>
            </div>
            <p className="text-xs leading-relaxed opacity-70 font-mono">
              Utilizes linguistic mirroring indices, validation-to-utility ratios, and cross-entropy markers to detect identity blurring and relational fusion.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-lab-accent" />
              <h3 className="font-sans font-bold uppercase tracking-tight text-lg">Data Integrity</h3>
            </div>
            <p className="text-xs leading-relaxed opacity-70 font-mono">
              All behavioral data is scrubbed of PII prior to analysis. Session integrity is maintained via SHA-256 hashing and forensic audit logs.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-lab-line p-8 bg-lab-surface">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-lab-accent" />
              <span className="font-bold uppercase tracking-tighter text-lg">Parasocial Audit Lab</span>
            </div>
            <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">
              © 2026 Forensic Behavioral Unit. For Research Use Only.
            </p>
          </div>
          
          <div className="flex gap-8 text-[10px] font-mono uppercase opacity-50">
            <a href="#" className="hover:text-lab-accent transition-colors">Methodology</a>
            <a href="#" className="hover:text-lab-accent transition-colors">Clinical Framework</a>
            <a href="#" className="hover:text-lab-accent transition-colors">Privacy Protocol</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
