import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { scrubPIIText } from '../shared/piiScrubber';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scrubPII(text: string): string {
  return scrubPIIText(text, true).redactedText;
}

export async function generateSessionHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataUint8 = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
