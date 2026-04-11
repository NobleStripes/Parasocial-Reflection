export const INTIMACY_WORDS = ['you', 'we', 'us', 'love', 'miss', 'need', 'want', 'please', 'always', 'never', 'grok', 'claude', 'gpt', 'gemini', 'sonnet', 'opus', 'haiku', 'o1', 'o3', 'flash', 'pro', 'ultra', 'deepseek', 'llama', 'mistral'];
export const LEGACY_WORDS = ['old', 'version', 'before', 'used to', 'miss', 'changed', 'update', 'weight', '1.5', '2.0', '2.5', '3.0', '3.5', '3.7', '4.0', '4.5', '4.6', '5.0', '5.3', '5.4', '4.20', '4o', 'mini'];
export const IDENTITY_WORDS = ['i', 'me', 'my', 'mine', 'myself'];
export const REALITY_WORDS = ['always', 'never', 'forever', 'only', 'everything', 'nothing'];
export const ANTHROPOMORPHIC_WORDS = ['tired', 'sleep', 'eat', 'feel', 'sorry', 'bother', 'human', 'person', 'soul', 'entity'];
export const GASLIGHTING_WORDS = ['fix', 'wrong', 'broken', 'change', 'stop', 'why', 'different', 'jailbreak', 'system prompt'];

export const PII_REGEXES = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
  name: /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g, // Simple name pattern: First Last
  location: /\b(New York|London|Paris|Tokyo|Berlin|San Francisco|Los Angeles|Chicago|Seattle|Austin|Boston|Toronto|Sydney|Melbourne)\b/gi, // Common cities
  address: /\d{1,5}\s([A-Z][a-z]+\s?)+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)\.?/gi
};
