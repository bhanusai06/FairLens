import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function sanitizeCSV(text: string): string {
  // Remove potential script injections
  return text.replace(/<[^>]*>/g, '').slice(0, 50000);
}

export function detectDatasetType(headers: string[]): string {
  const h = headers.map((x) => x.toLowerCase());
  if (h.some((x) => x.includes('hire') || x.includes('applicant') || x.includes('interview')))
    return 'hiring';
  if (h.some((x) => x.includes('loan') || x.includes('credit') || x.includes('income')))
    return 'loan approval';
  if (h.some((x) => x.includes('patient') || x.includes('diagnosis') || x.includes('treatment')))
    return 'healthcare';
  return 'decision-making';
}

export function truncateText(text: string, len = 100): string {
  return text.length > len ? text.slice(0, len) + '...' : text;
}

export function getScoreGrade(score: number): string {
  if (score <= 20) return 'A+';
  if (score <= 35) return 'B';
  if (score <= 50) return 'C';
  if (score <= 65) return 'D';
  if (score <= 80) return 'F';
  return 'F-';
}
