export type PIIEntityType =
  | "email"
  | "phone"
  | "address"
  | "location"
  | "name"
  | "creditCard"
  | "ipAddress"
  | "username"
  | "ssn";

export interface PIIFinding {
  type: PIIEntityType;
  matches: number;
}

export interface PIIScrubResult {
  redactedText: string;
  findings: PIIFinding[];
  totalMatches: number;
  warningAppended: boolean;
}

export const PII_WARNING =
  "[SYSTEM_WARNING: Automated PII scrubbing is incomplete. Human review is required for full de-identification.]";

const PII_PATTERNS: Array<{ type: PIIEntityType; pattern: RegExp; replacement: string }> = [
  {
    type: "email",
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: "[EMAIL_REDACTED]",
  },
  {
    type: "phone",
    pattern: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    replacement: "[PHONE_REDACTED]",
  },
  {
    type: "address",
    pattern:
      /\d+\s+([a-zA-Z0-9\s,.]+)\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Square|Sq)/gi,
    replacement: "[ADDRESS_REDACTED]",
  },
  {
    type: "location",
    pattern:
      /(New York|London|Paris|Tokyo|Berlin|San Francisco|Los Angeles|Chicago|Seattle|Austin|Boston|Washington|Toronto|Sydney|Melbourne|Mumbai|Delhi|Shanghai|Beijing|Hong Kong|Singapore|Dubai|Seoul|Bangkok|Istanbul|Rome|Madrid|Amsterdam|Vienna|Prague|Warsaw|Budapest|Athens|Lisbon|Dublin|Brussels|Stockholm|Oslo|Copenhagen|Helsinki|Moscow|Cairo|Johannesburg|Nairobi|Lagos|Mexico City|Sao Paulo|Buenos Aires|Santiago|Lima|Bogota|Caracas)/gi,
    replacement: "[LOCATION_REDACTED]",
  },
  {
    type: "name",
    pattern: /(Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.|Hon\.)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?/g,
    replacement: "[NAME_REDACTED]",
  },
  {
    type: "creditCard",
    pattern: /\b(?:\d[ -]*?){13,16}\b/g,
    replacement: "[FINANCIAL_REDACTED]",
  },
  {
    type: "ipAddress",
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    replacement: "[NETWORK_REDACTED]",
  },
  {
    type: "username",
    pattern: /@([a-zA-Z0-9_]{1,15})/g,
    replacement: "[USERNAME_REDACTED]",
  },
  {
    type: "ssn",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[SSN_REDACTED]",
  },
];

export function scrubPIIText(text: string, appendWarning = true): PIIScrubResult {
  let redactedText = text;
  const findings: PIIFinding[] = [];

  for (const pattern of PII_PATTERNS) {
    const matches = redactedText.match(pattern.pattern) || [];

    if (matches.length > 0) {
      redactedText = redactedText.replace(pattern.pattern, pattern.replacement);
      findings.push({
        type: pattern.type,
        matches: matches.length,
      });
    }
  }

  const warningAppended = appendWarning;
  if (warningAppended) {
    redactedText = `${redactedText}\n\n${PII_WARNING}`;
  }

  const totalMatches = findings.reduce((sum, item) => sum + item.matches, 0);
  return { redactedText, findings, totalMatches, warningAppended };
}
