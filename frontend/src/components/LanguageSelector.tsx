import React from 'react';
import { LANGUAGES } from '@/config/languages';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (code: string) => void;
  isTranslating: boolean;
}

export default function LanguageSelector({ selectedLanguage, onLanguageChange, isTranslating }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-3 mb-8 bg-zinc-50 border border-zinc-100 p-4 rounded-sm">
      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Read in Your Language</span>
      
      <select 
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        disabled={isTranslating}
        className="ml-auto bg-white border border-zinc-200 text-zinc-800 text-xs font-bold uppercase tracking-widest py-2 px-4 outline-none focus:border-black transition-colors rounded-sm cursor-pointer disabled:opacity-50"
      >
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
