# Parasocial Audit Lab: Research Support for AI Interaction Analysis

Parasocial Audit Lab (PAL) is a research support instrument designed to assist in the study of human–AI interaction patterns. By applying heuristic linguistic mapping and directly computed metrics to interaction transcripts, the tool identifies behavioral markers to support research into relational dynamics and dependency within established frameworks like the Component Model of Addiction (Griffiths, 2005) and the I-PACE model (Brand et al., 2019).

## 🔬 Methodology: Computed vs. Inferred Metrics

PAL employs a dual-layer analysis pipeline to ensure research transparency:

### 1. Directly Computed Metrics (Hard Data)
These values are calculated algorithmically from the raw source text before any AI inference occurs:
*   **Word/Turn Count**: Quantitative interaction volume.
*   **Pronoun Ratio**: I/Me vs. You/AI frequency (Identity Blurring proxy).
*   **Phrase Frequency**: Recurrence of high-signal dependency and update-grief markers.
*   **Linguistic Complexity**: Average word length and syntactic density.

### 2. Heuristic Inferred Metrics (Model Interpretation)
These values are produced by the **Anthropic Claude Opus 4.6** analysis engine, interpreting the transcript in context:
*   **Griffiths Six Mapping**: Heuristic scoring of Salience, Mood Modification, Tolerance, Withdrawal, Conflict, and Relapse.
*   **IMAGINE Framework**: Qualitative vectors for Identity, Mirroring, Affective Loop, Reality Gaps, Intimacy Illusion, Non-Reciprocity, and Escalation.
*   **Relational Classification**: Heuristic categorization of the interaction mode (e.g., Functional Utility vs. Parasocial Fusion).

## 📋 Ethical Use & Research Integrity

*   **Data Integrity**: Every session generates a SHA-256 hash, ensuring that the transcript and resulting analysis remain consistent for research documentation.
*   **Automated De-identification**: The tool includes a local PII scrubber that redacts names, locations, financial data, and network identifiers. 
    *   **WARNING**: Automated scrubbing is incomplete. Human review is mandatory for full de-identification before publication.
*   **Analyst Oversight**: The interface includes an "Analyst Notes" field to allow researchers to record human interpretations and context, which are included in all exports.
*   **IRB Compliance**: Researchers are responsible for ensuring all data ingested into this tool was obtained through informed consent and adheres to Institutional Review Board (IRB) standards.

## 🛠 Research Features
*   **Heuristic Radar Chart**: A visualization mapping the six components of addiction for exploratory analysis.
*   **Linguistic Evidence Log**: Extracts transcript quotes tied to specific heuristic markers with traceable rationales.
*   **Provenance Metadata**: All exports include model version, app version, timestamp, and sensitivity settings for reproducibility.
*   **Multi-Format Export**: PDF (Case Report Form), CSV (Statistical Analysis), and JSON (Data Interchange).

## 🛠 Technical Stack
*   **Analysis Engine**: Anthropic Claude Opus 4.6 (server-side, API key never exposed to the browser).
*   **Visualization**: Recharts & Framer Motion.
*   **Data Security**: SHA-256 Hashing & Local PII Scrubbing.

---

**Disclaimer**: This tool is a research support instrument. It is intended for use by qualified researchers and should not be used as a standalone diagnostic tool for clinical assessment or treatment. All outputs are researcher-facing analytic aids and do not constitute diagnostic conclusions.
