/**
 * Global Constants
 */

export const RESEARCHER_DISCLAIMER = "ACADEMIC USE ONLY: This platform is designed for quantitative behavioral analysis. Data processed here is subject to research ethics protocols. By using this tool, you confirm that you have obtained necessary consent for data analysis.";

export const PII_REGEXES = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
  name: /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g, // Simple name pattern: First Last
  location: /\b(New York|London|Paris|Tokyo|Berlin|San Francisco|Los Angeles|Chicago|Seattle|Austin|Boston|Toronto|Sydney|Melbourne)\b/gi, // Common cities
  address: /\d{1,5}\s([A-Z][a-z]+\s?)+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)\.?/gi
};
