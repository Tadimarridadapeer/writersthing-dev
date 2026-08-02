export interface DictionaryResult {
  word: string;
  partOfSpeech: string;
  definition: string;
  synonyms?: string[];
  example?: string;
  phonetic?: string;
}

export interface DictionaryProvider {
  fetchDefinition(word: string, context?: string): Promise<DictionaryResult | null>;
}

export class FreeDictionaryProvider implements DictionaryProvider {
  async fetchDefinition(word: string, context?: string): Promise<DictionaryResult | null> {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        const wordStr = entry.word;
        const phonetic = entry.phonetic || (entry.phonetics && entry.phonetics.find((p: any) => p.text)?.text) || "";
        
        // Find the first meaningful meaning
        const meaning = entry.meanings?.[0];
        if (meaning) {
          const partOfSpeech = meaning.partOfSpeech || "";
          const defObj = meaning.definitions?.[0];
          
          if (defObj) {
            const definition = defObj.definition || "";
            const example = defObj.example || "";
            const synonyms = defObj.synonyms || meaning.synonyms || [];

            return {
              word: wordStr,
              partOfSpeech,
              definition,
              example,
              phonetic,
              synonyms: synonyms.slice(0, 5),
            };
          }
        }
      }
      return null;
    } catch (err) {
      console.error("FreeDictionaryProvider error:", err);
      return null;
    }
  }
}

// In the future, this can be swapped with GeminiProvider
// export class GeminiDictionaryProvider implements DictionaryProvider { ... }

export const getDictionaryProvider = (): DictionaryProvider => {
  return new FreeDictionaryProvider();
};
