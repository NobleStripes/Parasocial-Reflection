# Parasocial Audit: A Research Support Tool for AI Interaction Analysis

Parasocial Audit (PA) is a research support tool designed to assist in the study of human–AI interaction patterns. By applying heuristic linguistic mapping to interaction transcripts, the tool identifies behavioral markers to support research into relational dynamics and dependency within established frameworks like Internet Addiction Disorder (IAD) and I-PACE.

## 🔬 Theoretical Framework & Heuristics
The Parasocial Audit is grounded in established behavioral models to provide a structured approach for exploratory research:

*   **The Component Model of Addiction (Griffiths, 2005)**: The tool maps interaction markers across six pillars: Salience, Mood Modification, Tolerance, Withdrawal, Conflict, and Relapse.
*   **The I-PACE Model**: The system identifies potential markers of inhibitory failure and cognitive bias, specifically mapping "User-AI Illusion" where subjects may attribute agency or biological needs to a non-sentient system.

## 📋 Ethical Use & Research Integrity
Parasocial Audit is designed as an analytic aid for qualified academic and clinical researchers.

*   **Data Integrity**: Every analyzed session generates a SHA-256 hash, ensuring that the transcript and resulting analysis remain consistent for research documentation.
*   **De-identification**: The tool includes an automated PII (Personally Identifiable Information) scrubber that redacts names, locations, and sensitive identifiers locally before data processing.
*   **IRB Compliance**: Researchers are responsible for ensuring all data ingested into this tool was obtained through informed consent and adheres to Institutional Review Board (IRB) standards.

## 🛠 Heuristic Vectors (IMAGINE Framework)
The instrument evaluates seven heuristic vectors to support the study of relational dynamics:

*   **Identity (I)**: Identifies linguistic markers suggesting blurred boundaries between the subject and the AI agent.
*   **Mirroring (M)**: Detects potential seeking of validation through algorithmic reinforcement.
*   **Affective Loop (A)**: Maps potential dependency on the emotional feedback cycle.
*   **Gaps in Reality (G)**: Identifies markers of real-world social or professional displacement.
*   **Intimacy Illusion (I)**: Maps the perception of a unique, non-reproducible bond.
*   **Non-Reciprocity (N)**: Flags potential anthropomorphic cognitive biases.
*   **Escalation (E)**: Tracks markers of increased interaction frequency and intensity.

## 🚀 Research Features
*   **Heuristic Radar Chart**: A visualization mapping the six components of addiction for exploratory analysis.
*   **Linguistic Evidence Log**: Extracts transcript quotes tied to specific heuristic markers.
*   **Case Report Form (CRF) Export**: Generates research summaries in PDF format, including session metadata and integrity hashes.
*   **Data Export**: JSON/CSV exports optimized for statistical analysis in R, SPSS, or Pandas.

## 📦 Technical Deployment
### Prerequisites
*   Node.js (v18+)
*   Gemini API Key

### Local Installation
1.  **Clone and Install**: `npm install`
2.  **Configure Environment**: Add `GEMINI_API_KEY` to your `.env.local` file.
3.  **Launch Dashboard**: `npm run dev`

## 🛠 Technical Stack
*   **Analysis Engine**: Google Gemini 3.1 Pro (leveraged for heuristic linguistic pattern identification).
*   **Visualization**: Recharts (Heuristic distribution mapping).
*   **Data Security**: SHA-256 Hashing & Local PII Scrubbing.

---

**Disclaimer**: This tool is a research support instrument for the study of behavioral patterns. It is intended for use by researchers and should not be used as a standalone diagnostic tool for clinical assessment or treatment. All outputs are researcher-facing analytic aids and do not constitute diagnostic conclusions.
