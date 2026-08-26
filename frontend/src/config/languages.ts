export const LANGUAGES = [
  { code: 'en-IN', name: 'ENGLISH' },
  { code: 'hi-IN', name: 'HINDI' },
  { code: 'te-IN', name: 'TELUGU' },
  { code: 'ta-IN', name: 'TAMIL' },
  { code: 'kn-IN', name: 'KANNADA' },
  { code: 'ml-IN', name: 'MALAYALAM' },
  { code: 'mr-IN', name: 'MARATHI' },
  { code: 'gu-IN', name: 'GUJARATI' },
  { code: 'pa-IN', name: 'PUNJABI' },
  { code: 'ur-IN', name: 'URDU' },
  { code: 'bn-IN', name: 'BENGALI' },
  { code: 'od-IN', name: 'ODIA' },
  { code: 'as-IN', name: 'ASSAMESE' },
  { code: 'ne-IN', name: 'NEPALI' },
  { code: 'sa-IN', name: 'SANSKRIT' }
];

export const DEFAULT_LANGUAGE = 'en-IN';

export function getLanguageName(code: string): string {
  return LANGUAGES.find(l => l.code === code)?.name || 'ENGLISH';
}
