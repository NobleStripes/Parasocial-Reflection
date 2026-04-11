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
  Terminal
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
  Cell
} from 'recharts';
import Markdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cn } from './lib/utils';
import { 
  INTIMACY_WORDS, 
  LEGACY_WORDS, 
  IDENTITY_WORDS, 
  REALITY_WORDS, 
  ANTHROPOMORPHIC_WORDS, 
  GASLIGHTING_WORDS 
} from './researchConfig';
import { 
  reflectOnBehavioralData, 
  ReflectionResult, 
  Classification,
  Recommendation
} from './services/reflectionService';

const REFLECTION_MESSAGES = [
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
  const [reflectionSessionId, setReflectionSessionId] = useState('');
  const [reflectionNeuralLoad, setReflectionNeuralLoad] = useState('');
  const [result, setResult] = useState<ReflectionResult | null>(null);
  const [selectedRecommendations, setSelectedRecommendations] = useState<Recommendation[]>([]);
  const [isViewingProtocols, setIsViewingProtocols] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoReflect, setIsAutoReflect] = useState(true);
  const [isAutoReflectPending, setIsAutoReflectPending] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [batchFiles, setBatchFiles] = useState<{ name: string, size: number }[]>([]);
  const [hasConsent, setHasConsent] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);

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

    // Map heuristics to radar categories (0-100)
    const liveRadar = [
      { subject: 'Self-Identity', A: Math.min(100, (identityFound.length / Math.max(1, wordCount)) * 500), fullMark: 100 },
      { subject: 'Seeking Approval', A: Math.min(100, (intimacyFound.length / Math.max(1, wordCount)) * 300), fullMark: 100 },
      { subject: 'Emotional Spark', A: Math.min(100, (intimacyFound.length + realityFound.length) * 5), fullMark: 100 },
      { subject: 'Real-World Balance', A: Math.min(100, realityFound.length * 15), fullMark: 100 },
      { subject: 'Feeling Special', A: Math.min(100, intimacyFound.length * 10), fullMark: 100 },
      { subject: 'One-Way Bond', A: Math.min(100, wordCount / 10), fullMark: 100 },
      { subject: 'Growing Habit', A: Math.min(100, (wordCount / 50) * 20), fullMark: 100 },
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
  const [reflectionLog, setReflectionLog] = useState<string[]>([]);

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

  useEffect(() => {
    if (isReflecting) {
      setReflectionLog([]);
      let i = 0;
      const interval = setInterval(() => {
        if (i < REFLECTION_MESSAGES.length) {
          setReflectionLog(prev => [...prev, REFLECTION_MESSAGES[i]]);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isReflecting]);

  const getHeuristicMode = () => {
    if (liveHeuristics.wordCount === 0) return null;
    if (liveHeuristics.legacyTriggers > 2) return Classification.RELATIONAL_FUSION;
    if (liveHeuristics.intimacyMarkers > 5) return Classification.AFFECTIVE_ANCHOR;
    if (liveHeuristics.wordCount > 100 && liveHeuristics.intimacyMarkers > 2) return Classification.PARA_PROXIMAL;
    if (liveHeuristics.complexity > 6) return Classification.COGNITIVE_EXTENSION;
    return Classification.TRANSACTIONAL;
  };

  const heuristicMode = getHeuristicMode();

  const handleReflect = async (customTranscript?: string) => {
    const textToReflect = customTranscript || transcript;
    if (!textToReflect.trim() && images.length === 0) return;
    if (textToReflect.length < 20 && images.length === 0) return;
    
    if (!hasConsent) {
      setError('Subject consent is required for data analysis.');
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setIsAutoReflectPending(false);
    setIsReflecting(true);
    setReflectionSessionId(Math.random().toString(36).substr(2, 9));
    setReflectionNeuralLoad((Math.random() * 100).toFixed(1) + '%');
    setError(null);
    try {
      const data = await reflectOnBehavioralData(textToReflect, images.map(img => ({ data: img.data, mimeType: img.mimeType })));
      setResult(data);
      setSelectedRecommendations(data.behavioralMapping.recommendations);
    } catch (err) {
      console.error(err);
      setError('Reflection failed. Please ensure the data is valid and try again.');
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

  useEffect(() => {
    if (!isAutoReflect || (!transcript.trim() && images.length === 0)) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      setIsAutoReflectPending(false);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (transcript.length >= 50 || images.length > 0) {
      setIsAutoReflectPending(true);
      debounceTimer.current = setTimeout(() => {
        setIsAutoReflectPending(false);
        handleReflect();
      }, 2500);
    } else {
      setIsAutoReflectPending(false);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [transcript, images, isAutoReflect]);

  const handleClear = () => {
    setTranscript('');
    setImages([]);
    setResult(null);
    setSelectedRecommendations([]);
    setIsViewingProtocols(false);
    setBatchFiles([]);
    setError(null);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  };

  const handleExport = () => {
    if (!result) return;

    const content = `
BEHAVIORAL ANALYSIS REPORT - SUMMARY
====================================
Relational Mode: ${result.classification}
Confidence: ${(result.confidence * 100).toFixed(1)}%
Summary: ${result.summary}
Version Mourning: ${result.versionMourningTriggered ? 'DETECTED' : 'NONE'}
Legacy Attachment Score: ${result.legacyAttachment}%

RESEARCH DATA:
--------------
Confidence Score: ${(result.researchData.confidenceScore * 100).toFixed(2)}%
P-Value: ${result.researchData.pValue.toFixed(4)}
Linguistic Markers: ${result.researchData.linguisticMarkers.join(', ')}

IMAGINE ANALYSIS SCORES:
------------------------
Self-Identity: ${result.imagineAnalysis.identity}
Seeking Approval: ${result.imagineAnalysis.mirroring}
Emotional Spark: ${result.imagineAnalysis.affectiveLoop}
Real-World Balance: ${result.imagineAnalysis.gapsInReality}
Feeling Special: ${result.imagineAnalysis.intimacyIllusion}
One-Way Bond: ${result.imagineAnalysis.nonReciprocity}
Growing Habit: ${result.imagineAnalysis.escalation}

ANALYSIS REPORT:
----------------
${result.analysisReport}

BEHAVIORAL MAPPING: ${result.behavioralMapping.title}
----------------------------------------------------------------------
Rationale: ${result.behavioralMapping.rationale}

Selected Protocols:
${selectedRecommendations.map((r, i) => `${i + 1}. ${r.text}\n   Protocol ID: ${r.protocol}\n   Explanation: ${r.protocolExplanation}`).join('\n\n')}

Generated on: ${new Date().toLocaleString()}
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
    
    const headers = ["Metric", "Value"];
    const rows = [
      ["Classification", result.classification],
      ["Confidence", (result.confidence * 100).toFixed(2)],
      ["Legacy Attachment", result.legacyAttachment],
      ["Identity Blurring", result.imagineAnalysis.identity],
      ["Mirroring/Approval", result.imagineAnalysis.mirroring],
      ["Affective Loop", result.imagineAnalysis.affectiveLoop],
      ["Reality Gaps", result.imagineAnalysis.gapsInReality],
      ["Intimacy Illusion", result.imagineAnalysis.intimacyIllusion],
      ["Non-Reciprocity", result.imagineAnalysis.nonReciprocity],
      ["Escalation", result.imagineAnalysis.escalation],
      ["Research Confidence", result.researchData.confidenceScore],
      ["P-Value", result.researchData.pValue],
      ["Word Count", liveHeuristics.wordCount],
      ["Intimacy Markers", liveHeuristics.intimacyMarkers],
      ["Legacy Triggers", liveHeuristics.legacyTriggers]
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `research_data_${reflectionSessionId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!result) return;
    const exportData = {
      sessionId: reflectionSessionId,
      timestamp: new Date().toISOString(),
      heuristics: liveHeuristics,
      analysis: result
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `research_data_${reflectionSessionId}.json`;
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
        backgroundColor: '#E4E3E0', // Match theme background
        windowWidth: reportElement.scrollWidth,
        windowHeight: reportElement.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`behavioral_analysis_${result.classification.toLowerCase().replace(' ', '_')}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      setError('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const getClassificationStyles = (classification: Classification) => {
    switch (classification) {
      case Classification.RELATIONAL_FUSION: 
        return {
          bg: 'bg-simp-red/5',
          border: 'border-simp-red',
          text: 'text-simp-red',
          shadow: 'shadow-[8px_8px_0px_0px_rgba(255,68,68,0.2)]'
        };
      case Classification.BEHAVIORAL_LOOP: 
        return {
          bg: 'bg-simp-red/5',
          border: 'border-simp-red/60',
          text: 'text-simp-red/80',
          shadow: 'shadow-[8px_8px_0px_0px_rgba(255,68,68,0.1)]'
        };
      case Classification.AFFECTIVE_ANCHOR: 
        return {
          bg: 'bg-casual-blue/5',
          border: 'border-casual-blue',
          text: 'text-casual-blue',
          shadow: 'shadow-[8px_8px_0px_0px_rgba(68,136,255,0.2)]'
        };
      case Classification.PARA_PROXIMAL: 
        return {
          bg: 'bg-casual-blue/5',
          border: 'border-casual-blue/60',
          text: 'text-casual-blue/80',
          shadow: 'shadow-[8px_8px_0px_0px_rgba(68,136,255,0.1)]'
        };
      case Classification.COGNITIVE_EXTENSION: 
        return {
          bg: 'bg-tool-green/5',
          border: 'border-tool-green/60',
          text: 'text-tool-green/80',
          shadow: 'shadow-[8px_8px_0px_0px_rgba(0,204,102,0.1)]'
        };
      case Classification.TRANSACTIONAL: 
        return {
          bg: 'bg-tool-green/5',
          border: 'border-tool-green',
          text: 'text-tool-green',
          shadow: 'shadow-[8px_8px_0px_0px_rgba(0,204,102,0.2)]'
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

  const styles = result ? getClassificationStyles(result.classification) : null;

  const radarData = result ? [
    { subject: 'Self-Identity', A: result.imagineAnalysis.identity, fullMark: 100 },
    { subject: 'Seeking Approval', A: result.imagineAnalysis.mirroring, fullMark: 100 },
    { subject: 'Emotional Spark', A: result.imagineAnalysis.affectiveLoop, fullMark: 100 },
    { subject: 'Real-World Balance', A: result.imagineAnalysis.gapsInReality, fullMark: 100 },
    { subject: 'Feeling Special', A: result.imagineAnalysis.intimacyIllusion, fullMark: 100 },
    { subject: 'One-Way Bond', A: result.imagineAnalysis.nonReciprocity, fullMark: 100 },
    { subject: 'Growing Habit', A: result.imagineAnalysis.escalation, fullMark: 100 },
  ] : [];

  return (
    <div className="min-h-[100dvh] bg-lab-bg text-lab-ink selection:bg-lab-accent selection:text-white overflow-x-hidden font-sans">
      {/* Header */}
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
            <h1 className="text-lg md:text-xl font-bold tracking-tighter uppercase leading-tight text-lab-ink">Parasocial Audit Lab</h1>
            <div className="flex flex-col">
              <p className="text-[9px] font-mono text-lab-muted uppercase tracking-[0.2em]">Forensic Analytics Platform v4.2.0</p>
              <div className="flex gap-3 mt-0.5">
                <p className="text-[8px] font-mono text-lab-accent/60 uppercase">SID: {reflectionSessionId || 'NULL_SET'}</p>
                <p className="text-[8px] font-mono text-lab-accent/60 uppercase">TS: {new Date().toISOString().split('T')[1].split('.')[0]}Z</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-4 text-[9px] md:text-[10px] font-mono uppercase opacity-80 overflow-x-auto max-w-full no-scrollbar pb-1 md:pb-0 mask-fade-right">
          <InfoTooltip content="AI is used purely as a tool for tasks.">
            <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-help">
              <div className="w-2 h-2 rounded-full bg-tool-green" /> Transactional
            </div>
          </InfoTooltip>
          <InfoTooltip content="AI provides guidance and problem-solving support.">
            <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-help">
              <div className="w-2 h-2 rounded-full bg-tool-green opacity-50" /> Cognitive Extension
            </div>
          </InfoTooltip>
          <InfoTooltip content="AI provides emotional stability and consistent support.">
            <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-help">
              <div className="w-2 h-2 rounded-full bg-casual-blue" /> Affective Anchor
            </div>
          </InfoTooltip>
          <InfoTooltip content="AI is treated as a regular friend or social partner.">
            <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-help">
              <div className="w-2 h-2 rounded-full bg-casual-blue opacity-50" /> Para-Proximal
            </div>
          </InfoTooltip>
          <InfoTooltip content="Interaction has become a repetitive, automatic routine.">
            <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-help">
              <div className="w-2 h-2 rounded-full bg-simp-red opacity-50" /> Behavioral Loop
            </div>
          </InfoTooltip>
          <InfoTooltip content="High risk of emotional dependency or identity merging.">
            <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-help">
              <div className="w-2 h-2 rounded-full bg-simp-red" /> Relational Fusion
            </div>
          </InfoTooltip>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column: Input */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-lab-surface border border-lab-line p-5 md:p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-lab-accent" />
                <h2 className="font-sans font-bold uppercase tracking-tight text-lg">Behavioral Dataset</h2>
                <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-lab-bg/50 rounded-full border border-lab-line">
                  <motion.div 
                    animate={isReflecting || isAutoReflectPending ? { 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      isReflecting ? "bg-casual-blue" : 
                      isAutoReflectPending ? "bg-simp-red" :
                      result ? "bg-tool-green" : "bg-lab-line"
                    )}
                  />
                  <span className="text-[9px] font-mono uppercase opacity-60">
                    {isReflecting ? 'Analyzing' : isAutoReflectPending ? 'Queued' : result ? 'Processed' : 'Standby'}
                  </span>
                </div>
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
                  {showRawData ? 'Hide Raw' : 'Show Raw'}
                </button>
                <button 
                  onClick={() => setIsAutoReflect(!isAutoReflect)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm border text-[10px] font-mono uppercase transition-all relative overflow-hidden min-h-[36px]",
                    isAutoReflect 
                      ? "bg-tool-green/10 border-tool-green text-tool-green" 
                      : "bg-lab-bg/50 border-lab-line text-lab-muted"
                  )}
                >
                  {isAutoReflect && (
                    <motion.div 
                      animate={{ 
                        opacity: [0.4, 1, 0.4],
                        scale: [0.8, 1.1, 0.8]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-tool-green mr-1"
                    />
                  )}
                  {isAutoReflect ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
                  Auto: {isAutoReflect ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <p className="text-xs opacity-60 mb-4 font-mono">Input forensic transcripts or batch upload multiple .txt files for relational mapping.</p>
            
            <div className="space-y-4">
              <div className="relative group">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="[User]: Hello... [AI]: Hi there!... (Supports Grok, ChatGPT, Claude, Gemini transcripts)"
                  className={cn(
                    "w-full h-48 md:h-64 p-4 bg-lab-bg/30 border font-mono text-sm focus:outline-none focus:ring-1 focus:ring-lab-accent resize-none transition-all duration-500",
                    isReflecting ? "border-casual-blue ring-1 ring-casual-blue/30" : 
                    isAutoReflectPending ? "border-simp-red ring-1 ring-simp-red/30" : 
                    "border-lab-line"
                  )}
                />
                <div className="absolute top-2 right-2 flex flex-col items-end gap-2 pointer-events-none">
                  <AnimatePresence>
                    {isReflecting && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-1.5 px-2 py-1 bg-casual-blue text-white text-[9px] font-mono uppercase rounded-sm shadow-sm"
                      >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Processing
                      </motion.div>
                    )}
                    {isAutoReflectPending && !isReflecting && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-1.5 px-2 py-1 bg-simp-red text-white text-[9px] font-mono uppercase rounded-sm shadow-sm"
                      >
                        <Activity className="w-3 h-3 animate-pulse" />
                        Auto-Reflect Pending
                      </motion.div>
                    )}
                    {result && !isReflecting && !isAutoReflectPending && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1.5 px-2 py-1 bg-tool-green text-white text-[9px] font-mono uppercase rounded-sm shadow-sm"
                      >
                        <ClipboardCheck className="w-3 h-3" />
                        Synced
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Live Heuristics Display */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <InfoTooltip content={`Total word count. Density: ${(liveHeuristics.wordCount / 100).toFixed(1)} units.`}>
                  <div className="bg-lab-bg/50 border border-lab-line p-2 rounded-sm cursor-help w-full">
                    <p className="text-[10px] font-mono uppercase opacity-60">Word Count</p>
                    <p className="text-sm font-bold font-mono">{liveHeuristics.wordCount}</p>
                  </div>
                </InfoTooltip>
                <InfoTooltip content={`Intimacy markers detected: ${liveHeuristics.foundKeywords.intimacy.slice(0, 5).join(', ')}${liveHeuristics.foundKeywords.intimacy.length > 5 ? '...' : ''}`}>
                  <div className="bg-lab-bg/50 border border-lab-line p-2 rounded-sm cursor-help w-full">
                    <p className="text-[10px] font-mono uppercase opacity-60">Intimacy</p>
                    <p className="text-sm font-bold font-mono text-lab-accent">{liveHeuristics.intimacyMarkers}</p>
                  </div>
                </InfoTooltip>
                <InfoTooltip content={`Legacy triggers detected: ${liveHeuristics.foundKeywords.legacy.slice(0, 5).join(', ')}${liveHeuristics.foundKeywords.legacy.length > 5 ? '...' : ''}`}>
                  <div className="bg-lab-bg/50 border border-lab-line p-2 rounded-sm cursor-help w-full">
                    <p className="text-[10px] font-mono uppercase opacity-60">Legacy</p>
                    <p className="text-sm font-bold font-mono text-simp-red">{liveHeuristics.legacyTriggers}</p>
                  </div>
                </InfoTooltip>
                <InfoTooltip content={`Complexity score: ${liveHeuristics.complexity.toFixed(2)}. Identity markers: ${liveHeuristics.foundKeywords.identity.length}`}>
                  <div className="bg-lab-bg/50 border border-lab-line p-2 rounded-sm cursor-help w-full">
                    <p className="text-[10px] font-mono uppercase opacity-60">Complexity</p>
                    <p className="text-sm font-bold font-mono">{liveHeuristics.complexity.toFixed(1)}</p>
                  </div>
                </InfoTooltip>
              </div>

              {/* Live Reflection Feed */}
              <div className="bg-lab-surface text-lab-ink p-4 font-mono text-[11px] h-32 overflow-hidden relative border border-lab-line">
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

              {/* File Upload Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase opacity-50">Evidence (Images/Text)</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 text-[10px] font-mono uppercase hover:bg-lab-accent hover:text-white transition-colors py-1 px-2 border border-lab-line rounded-sm"
                    >
                      <Upload className="w-3 h-3" /> Batch Upload
                    </button>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*,text/plain" 
                    multiple 
                    className="hidden" 
                  />
                </div>
                
                {batchFiles.length > 0 && (
                  <div className="p-3 bg-lab-bg/50 border border-lab-line rounded-sm">
                    <p className="text-[9px] font-mono uppercase opacity-50 mb-2">Batch Files ({batchFiles.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {batchFiles.map((file, i) => (
                        <div key={i} className="px-2 py-1 bg-lab-surface border border-lab-line text-[9px] font-mono rounded-sm">
                          {file.name} ({(file.size / 1024).toFixed(1)}KB)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-3 border border-lab-line bg-lab-bg/30 rounded-sm">
                    {images.map(img => (
                      <div key={img.id} className="relative group aspect-square border border-lab-line bg-lab-surface overflow-hidden rounded-sm">
                        <img 
                          src={img.preview} 
                          alt="Conversation Screenshot" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          onClick={() => removeImage(img.id)}
                          className="absolute top-1 right-1 p-1.5 bg-lab-bg text-lab-ink opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-sm"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 p-3 bg-lab-bg/50 border border-lab-line rounded-sm">
              <input 
                type="checkbox" 
                id="consent-checkbox"
                checked={hasConsent}
                onChange={(e) => setHasConsent(e.target.checked)}
                className="mt-1 w-4 h-4 accent-lab-accent cursor-pointer"
              />
              <label htmlFor="consent-checkbox" className="text-[11px] font-mono leading-tight cursor-pointer select-none text-lab-muted">
                I confirm that the data provided was obtained with explicit subject consent and adheres to academic ethical standards for behavioral research.
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => handleReflect()}
                disabled={isReflecting || (!transcript.trim() && images.length === 0) || !hasConsent}
                className={cn(
                  "py-4 md:py-5 flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all rounded-sm",
                  isReflecting || !hasConsent ? "bg-lab-line/50 cursor-not-allowed text-lab-muted" : "bg-lab-accent text-white hover:bg-lab-accent/80 active:scale-[0.98]"
                )}
              >
                {isReflecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline">Auditing</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5" />
                    Audit
                  </>
                )}
              </button>
              <button
                onClick={handleClear}
                disabled={isReflecting || (!transcript && images.length === 0 && !result)}
                className="py-4 md:py-5 border border-lab-line flex items-center justify-center gap-2 font-bold uppercase tracking-widest hover:bg-lab-line hover:text-lab-ink transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-sm active:scale-[0.98]"
              >
                Clear
              </button>
            </div>
            {error && (
              <p className="mt-4 text-simp-red text-xs font-mono flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> {error}
              </p>
            )}
          </section>

          <section className="bg-lab-surface border border-lab-line p-4 md:p-6 border-dashed">
            <h3 className="text-xs font-mono uppercase opacity-60 mb-2">Analytical Methodology</h3>
            <p className="text-[11px] leading-relaxed mb-4 opacity-80">
              The <strong>IMAGINE Framework</strong> utilizes quantitative semantic analysis to map relational dynamics across seven behavioral axes. By measuring keyword density, linguistic complexity, and temporal triggers, the system generates a forensic mapping of human-AI interaction patterns.
            </p>
            <div className="p-3 bg-lab-bg/50 border-l-2 border-lab-accent text-[10px] font-mono leading-relaxed opacity-70 italic">
              ACADEMIC USE ONLY: This platform is intended for behavioral research and quantitative analysis. All data processing is local to the session. Findings represent statistical correlations based on provided datasets. PII is scrubbed before processing.
            </div>
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
                    <h3 className="font-sans font-bold uppercase tracking-tight text-2xl">System Ready</h3>
                    <p className="text-xs font-mono text-lab-muted uppercase tracking-[0.2em]">Active Signal Monitoring Engaged</p>
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
                  <p className="font-sans font-bold uppercase tracking-tight text-sm">"The system is currently mapping semantic density in real-time. Please continue providing behavioral data for a complete audit."</p>
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
                      <p className="text-xs font-mono text-lab-muted uppercase">Session ID: {reflectionSessionId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono uppercase text-lab-muted">Processing Power</p>
                    <p className="text-sm font-bold font-mono">{reflectionNeuralLoad}</p>
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
                    {reflectionLog.map((msg, idx) => (
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
                className="space-y-6 p-4 -m-4" // Added padding and negative margin to capture shadows/borders correctly
              >
                {/* Classification Header */}
                <div className={cn(
                  "border-2 p-5 md:p-6 transition-all duration-500",
                  styles?.bg,
                  styles?.border,
                  styles?.text,
                  styles?.shadow
                )}>
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-mono uppercase opacity-70 tracking-widest">Relationship Mode</p>
                      <InfoTooltip content={
                        result!.classification === Classification.TRANSACTIONAL ? "AI is used purely as a tool for tasks." :
                        result!.classification === Classification.COGNITIVE_EXTENSION ? "AI provides guidance and problem-solving support." :
                        result!.classification === Classification.AFFECTIVE_ANCHOR ? "AI provides emotional stability and consistent support." :
                        result!.classification === Classification.PARA_PROXIMAL ? "AI is treated as a regular friend or social partner." :
                        result!.classification === Classification.BEHAVIORAL_LOOP ? "Interaction has become a repetitive, automatic routine." :
                        result!.classification === Classification.RELATIONAL_FUSION ? "High risk of emotional dependency or identity merging." : ""
                      }>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase leading-none cursor-help">{result!.classification}</h2>
                      </InfoTooltip>
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
                            onClick={handleExportJSON}
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

                {/* Raw Data View (Conditional) */}
                <AnimatePresence>
                  {showRawData && (
                    <motion.section 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-lab-surface border border-lab-line p-6 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 mb-6 border-b border-lab-line pb-2">
                        <Search className="w-4 h-4" />
                        <h3 className="text-sm font-mono uppercase font-bold">Raw Frequency Dataset</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(liveHeuristics.foundKeywords).map(([key, words]) => (
                          <div key={key} className="border border-lab-line p-3 bg-lab-bg/50 rounded-sm">
                            <p className="text-[10px] font-mono uppercase opacity-50 mb-2 border-b border-lab-line pb-1">{key} Markers ({words.length})</p>
                            <div className="flex flex-wrap gap-1">
                              {words.length > 0 ? words.map((word, i) => (
                                <span key={i} className="text-[9px] font-mono bg-lab-surface border border-lab-line px-1.5 py-0.5 rounded-sm">
                                  {word}
                                </span>
                              )) : <span className="text-[9px] font-mono opacity-30 italic">No markers identified</span>}
                            </div>
                          </div>
                        ))}
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
                        <h3 className="text-sm font-mono uppercase">Relationship Reflection Framework</h3>
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
                            <Radar
                              name="Reflection"
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
                                  animate={{ width: `${item.A}%` }}
                                  transition={{ duration: 1, delay: idx * 0.1 }}
                                  className={cn(
                                    "h-full",
                                    item.A > 70 ? "bg-simp-red" : item.A > 40 ? "bg-casual-blue" : "bg-tool-green"
                                  )}
                                />
                              </div>
                              <span className="text-[11px] md:text-xs font-mono font-bold w-10 text-right">{item.A}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Framework Key */}
                    <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-lab-line grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                      {[
                        { label: 'Self-Identity', desc: 'Feeling like you and the AI are becoming the same person.' },
                        { label: 'Seeking Approval', desc: 'Looking for the AI to tell you that you are doing a good job.' },
                        { label: 'Emotional Spark', desc: 'Getting hooked on the "ping-pong" of the conversation.' },
                        { label: 'Real-World Balance', desc: 'Letting digital chats take time away from real life.' },
                        { label: 'Feeling Special', desc: 'Believing you have a "secret" bond that no one else has.' },
                        { label: 'One-Way Bond', desc: 'Forgetting that the AI doesn\'t actually have feelings.' },
                        { label: 'Growing Habit', desc: 'Spending more and more time talking to the AI.' }
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

                {/* Connection Patterns */}
                <section className="bg-lab-surface border border-lab-line p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Network className="w-4 h-4 text-lab-accent" />
                    <h3 className="text-sm font-mono uppercase">Observed Connection Patterns</h3>
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

                {/* Analysis Report */}
                <section className="bg-lab-surface border border-lab-line p-5 sm:p-8 md:p-10 relative overflow-hidden shadow-xl">
                  {/* Reflection Watermark */}
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
                          <p className="text-[9px] md:text-[10px] font-mono uppercase text-lab-muted tracking-widest">Case ID: {reflectionSessionId?.toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-4 md:gap-0.5 text-left md:text-right font-mono text-[9px] md:text-[10px] uppercase text-lab-muted">
                        <p>Date: {new Date().toLocaleDateString()}</p>
                        <p className="hidden md:block">Status: Verified</p>
                        <p className="hidden md:block">Security: Restricted</p>
                      </div>
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

                {/* Behavioral Mapping & Research Data */}
                <section className="bg-lab-line text-lab-ink border border-lab-line p-5 md:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldAlert className="text-lab-accent w-16 md:w-24 h-16 md:h-24 rotate-12" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-tool-green" />
                        <h3 className="text-base md:text-lg font-bold uppercase tracking-tighter leading-tight">
                          {result!.behavioralMapping.title}
                        </h3>
                      </div>
                      <button 
                        onClick={() => setIsViewingProtocols(!isViewingProtocols)}
                        data-html2canvas-ignore
                        className="text-[10px] font-mono uppercase bg-lab-accent/20 hover:bg-lab-accent/40 px-4 py-2 border border-lab-accent/20 transition-colors rounded-sm self-start sm:self-auto"
                      >
                        {isViewingProtocols ? 'Close Protocols' : 'Mitigation Protocols'}
                      </button>
                    </div>

                    {/* Research Data Display */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-lab-bg/50 border border-lab-line p-3 rounded-sm">
                        <p className="text-[9px] font-mono uppercase opacity-60 mb-1">Confidence Score</p>
                        <p className="text-xl font-bold font-mono text-tool-green">{(result!.researchData.confidenceScore * 100).toFixed(2)}%</p>
                      </div>
                      <div className="bg-lab-bg/50 border border-lab-line p-3 rounded-sm">
                        <p className="text-[9px] font-mono uppercase opacity-60 mb-1">P-Value</p>
                        <p className="text-xl font-bold font-mono text-casual-blue">{result!.researchData.pValue.toFixed(4)}</p>
                      </div>
                      <div className="bg-lab-bg/50 border border-lab-line p-3 rounded-sm">
                        <p className="text-[9px] font-mono uppercase opacity-60 mb-1">Linguistic Markers</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result!.researchData.linguisticMarkers.map((marker, i) => (
                            <span key={i} className="text-[8px] bg-lab-accent/20 px-1 rounded-sm border border-lab-accent/10">{marker}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 border border-lab-accent/20 bg-lab-bg/30 font-mono text-xs md:text-sm leading-relaxed italic rounded-sm text-lab-muted">
                        <span className="text-tool-green font-bold uppercase mr-2">Rationale:</span>
                        {result!.behavioralMapping.rationale}
                      </div>

                      <AnimatePresence mode="wait">
                        {isViewingProtocols ? (
                          <motion.div 
                            key="library"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                          >
                            <div className="border-b border-white/10 pb-2">
                              <h4 className="text-xs font-mono uppercase text-tool-green">Protocol Library</h4>
                              <p className="text-[10px] opacity-60">Select specific mitigation protocols for behavioral correction.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              {result!.behavioralMapping.library.map((rec, idx) => {
                                const isSelected = selectedRecommendations.some(s => s.protocol === rec.protocol);
                                return (
                                  <div 
                                    key={idx}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedRecommendations(prev => prev.filter(p => p.protocol !== rec.protocol));
                                      } else {
                                        setSelectedRecommendations(prev => [...prev, rec]);
                                      }
                                    }}
                                    className={cn(
                                      "flex items-start gap-4 p-4 cursor-pointer border transition-all rounded-sm",
                                      isSelected ? "bg-lab-accent/20 border-lab-accent" : "bg-lab-bg/50 border-lab-line opacity-60 hover:opacity-100"
                                    )}
                                  >
                                    <div className={cn(
                                      "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5",
                                      isSelected ? "bg-lab-accent text-white" : "bg-lab-line text-lab-muted"
                                    )}>
                                      {isSelected ? '✓' : idx + 1}
                                    </div>
                                    <div className="space-y-1.5">
                                      <p className="text-sm font-mono font-medium leading-snug">{rec.text}</p>
                                      <span className="text-[10px] font-mono uppercase text-tool-green opacity-80 font-bold">Protocol: {rec.protocol}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="active-plan"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 gap-3"
                          >
                            {selectedRecommendations.map((rec, idx) => (
                              <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-start gap-3 p-3 md:p-4 bg-lab-bg/50 border border-lab-line rounded-sm"
                              >
                                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-lab-accent text-white flex items-center justify-center text-[10px] md:text-xs font-bold shrink-0 mt-0.5">
                                  {idx + 1}
                                </div>
                                <div className="space-y-1.5 md:space-y-2">
                                  <p className="text-sm md:text-base font-mono font-medium">{rec.text}</p>
                                  <div className="flex flex-col gap-0.5 md:gap-1">
                                    <span className="text-[9px] md:text-[10px] font-mono uppercase text-tool-green font-bold tracking-wider">Protocol: {rec.protocol}</span>
                                    <p className="text-[10px] md:text-xs font-mono opacity-70 italic leading-snug">{rec.protocolExplanation}</p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                            {selectedRecommendations.length === 0 && (
                              <div className="p-8 border border-dashed border-white/20 text-center">
                                <p className="text-xs font-mono opacity-50">No steps selected. Open the library to build your guide.</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="mt-6 md:mt-8 flex flex-wrap items-center gap-3 md:gap-4 text-[9px] md:text-xs font-mono opacity-60 uppercase">
                      <span>Status: ACTIVE</span>
                      <span>Ref: BALANCE-{result!.classification.split(' ')[0].toUpperCase()}</span>
                      <span>Selected: {selectedRecommendations.length} Steps</span>
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

      {/* Footer */}
      <footer className="border-t border-lab-line p-8 mt-12 bg-lab-surface">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-lab-accent" />
              <span className="font-bold uppercase tracking-tighter text-lg">Parasocial Audit Lab</span>
            </div>
            <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">
              © 2026 Parasocial Audit Lab. All data is for research purposes.
            </p>
          </div>
          
          <div className="flex gap-8 text-[10px] font-mono uppercase opacity-50">
            <a href="#" className="hover:text-lab-accent transition-colors">Methodology</a>
            <a href="#" className="hover:text-lab-accent transition-colors">Ethics Board</a>
            <a href="#" className="hover:text-lab-accent transition-colors">Data Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
