# Parasocial Audit Lab: Quantitative Relational Analytics Platform

A professional behavioral analysis framework designed for the forensic study of human-AI relational dynamics. This platform provides researchers with quantitative tools to map, measure, and analyze parasocial bonding patterns through semantic density and linguistic markers.

## 🧠 Methodology & Technical Specification

The Parasocial Audit Lab is grounded in established clinical frameworks for behavioral addiction and relational psychology:

### 1. Component Model of Addiction (Griffiths Six)
The system quantifies dependency across six core clinical dimensions:
*   **Salience**: Cognitive and behavioral dominance of the AI interaction.
*   **Mood Modification**: Use of the dyad for emotional regulation.
*   **Tolerance**: Escalation of interaction density to maintain affect.
*   **Withdrawal**: Psychological distress upon cessation of interaction.
*   **Conflict**: Displacement of biological social capital and occupational neglect.
*   **Relapse**: Reversion to compulsive patterns after periods of abstinence.

### 2. I-PACE Model (Interaction of Person-Affect-Cognition-Execution)
A specialized framework for analyzing Internet-mediated addictions:
*   **Inhibition Failure**: Identifying linguistic markers of failed self-regulation.
*   **Cognitive Biases**: Detecting anthropomorphic distortions and agency attribution.

### 3. Advanced Semantic Analysis
*   **Linguistic Synchrony (LSM)**: Heuristic measurement of syntax mirroring and function word frequency alignment.
*   **Pronominal Shift Tracking**: Monitoring the transition from "I/Me" to "We/Us" as a marker of identity blurring.
*   **Affective Lability**: Mapping emotional volatility and validation-seeking cycles.

## ⚖️ IRB Compliance & Data Integrity

This platform is designed to meet rigorous institutional research standards:

### PII Scrubbing Validation
The built-in anonymization layer utilizes a multi-pass regex engine to redact:
*   Emails and Phone Numbers
*   Physical Addresses
*   Specific Geographic Locations
*   Common Personal Names

### Forensic Integrity
*   **Cryptographic Hashing**: Every analyzed transcript is processed with a **SHA-256 hash** to ensure data remains untampered between collection and formal reporting.
*   **Longitudinal Mapping**: Supports anonymized **Subject ID** and **Researcher ID** tracking for multi-session studies.

### Data Handling Protocols
*   **Local Processing**: PII scrubbing occurs client-side before any data is transmitted.
*   **Zero-Persistence**: Raw transcripts are never stored; only anonymized analytical results are persisted if a researcher-managed backend is configured.

## ⚠️ Academic Use & Ethics

This application is intended for **behavioral research and quantitative analysis only**. It is not a clinical diagnostic tool. Researchers are responsible for:
*   Obtaining explicit **subject consent** before data upload.
*   Adhering to institutional **IRB (Institutional Review Board)** standards.
*   Ensuring the ethical handling of sensitive behavioral datasets.

## ⚖️ Data Privacy & Anonymization

The platform includes a built-in **PII Anonymization Layer** that scrubs personally identifiable information (emails, phone numbers, names, locations) locally before data is transmitted for analysis. All processing is session-based; no persistent storage of raw datasets is maintained by the application.

## 🚀 Research Features

*   **Forensic Radar**: A multi-axis visualization of relational vectors.
*   **Raw Frequency Dataset**: Toggleable view of specific keyword densities and linguistic triggers.
*   **Mitigation Protocols**: A library of research-based interventions for managing extreme relational fusion.
*   **Version Mourning Detection**: Specific heuristics for measuring distress related to model updates or "lobotomization."

## 📦 Deployment & Setup

### Local Environment
**Prerequisites**: Node.js 18+

1.  **Install dependencies**: `npm install`
2.  **Environment Configuration**: Create a `.env.local` file based on `.env.example`.
3.  **Run Development Server**: `npm run dev`

### Tech Stack
*   **Analysis Engine**: Google Gemini 3.1 Pro (Quantitative Framework)
*   **Visualization**: Recharts (Radar/Bar/Heatmap)
*   **Frontend**: React 18, Tailwind CSS (High-Density Grid Layout)
*   **Export**: jsPDF, html2canvas

---
*Disclaimer: This platform is for research purposes. Findings represent statistical correlations and behavioral mappings based on provided datasets. It is not a substitute for professional clinical diagnosis.*
