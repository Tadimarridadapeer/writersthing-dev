export interface TranslationProvider {
  name: string;
  translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<string>;
}

export class LibreTranslationProvider implements TranslationProvider {
  name = 'LibreTranslate';
  
  // You would typically point this to a local or self-hosted LibreTranslate instance
  // Using a public instance for demonstration, but note they often have strict rate limits
  private endpoint = 'https://libretranslate.de/translate';

  async translate(text: string, targetLanguage: string, sourceLanguage: string = 'en'): Promise<string> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        body: JSON.stringify({
          q: text,
          source: sourceLanguage,
          target: targetLanguage,
          format: 'html' // Preserve HTML formatting
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`LibreTranslate failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error('LibreTranslate Error:', error);
      throw error;
    }
  }
}

export class ArgosTranslationProvider implements TranslationProvider {
  name = 'ArgosTranslate';
  
  // This assumes you have an Argos Translate REST API wrapper running locally
  // (e.g. argos-translate-api running on port 5000)
  private endpoint = 'http://localhost:5000/translate';

  async translate(text: string, targetLanguage: string, sourceLanguage: string = 'en'): Promise<string> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        body: JSON.stringify({
          q: text,
          source: sourceLanguage,
          target: targetLanguage,
          format: 'html'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`ArgosTranslate failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error('ArgosTranslate Error:', error);
      throw error;
    }
  }
}

export class GoogleTranslateProvider implements TranslationProvider {
  name = 'GoogleTranslate';

  async translate(text: string, targetLanguage: string, sourceLanguage: string = 'en'): Promise<string> {
    try {
      const chunks = [];
      let currentChunk = "";
      
      const paragraphs = text.split('\n');
      for (const p of paragraphs) {
        if ((currentChunk + p).length > 1500) {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = p;
        } else {
          currentChunk += (currentChunk ? '\n' : '') + p;
        }
      }
      if (currentChunk) chunks.push(currentChunk);

      let translatedText = "";
      for (const chunk of chunks) {
        if (chunk.trim() === '') {
          translatedText += '\n';
          continue;
        }
        
        const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t`;
        const formData = new URLSearchParams();
        formData.append('q', chunk);

        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        if (!response.ok) {
          throw new Error(`GoogleTranslate failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data[0]) {
          const chunkTranslated = data[0].map((item: any) => item[0]).join('');
          translatedText += chunkTranslated + '\n';
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      return translatedText.trim();
    } catch (error) {
      console.error('GoogleTranslate Error:', error);
      throw error;
    }
  }
}

export class MyMemoryTranslationProvider implements TranslationProvider {
  name = 'MyMemoryTranslate';

  async translate(text: string, targetLanguage: string, sourceLanguage: string = 'en'): Promise<string> {
    try {
      // MyMemory has a limit of 500 chars per request for anonymous users
      // We chunk the text into <=450 char blocks separated by newlines
      const chunks = [];
      let currentChunk = "";
      
      const paragraphs = text.split('\n');
      for (const p of paragraphs) {
        if ((currentChunk + p).length > 450) {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = p;
        } else {
          currentChunk += (currentChunk ? '\n' : '') + p;
        }
      }
      if (currentChunk) chunks.push(currentChunk);

      let translatedText = "";
      for (const chunk of chunks) {
        if (chunk.trim() === '') {
          translatedText += '\n';
          continue;
        }
        
        const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${sourceLanguage}|${targetLanguage}&de=admin@writersthing.com`;
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`MyMemory failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.responseStatus !== 200) {
          throw new Error(data.responseDetails || 'MyMemory translation failed');
        }
        
        translatedText += data.responseData.translatedText + '\n';
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      return translatedText.trim();
    } catch (error) {
      console.error('MyMemory Error:', error);
      throw error;
    }
  }
}

export class MockTranslationProvider implements TranslationProvider {
  name = 'MockTranslator';

  async translate(text: string, targetLanguage: string, sourceLanguage: string = 'en'): Promise<string> {
    // Artificial delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate translation by replacing common letters or prepending a label
    // If it's HTML, we should be careful not to break tags
    if (text.includes('<')) {
      return `<div style="border-left: 4px solid #10b981; padding-left: 1rem; margin-bottom: 1rem;">
        <span style="font-size: 10px; font-weight: 900; color: #10b981; text-transform: uppercase; letter-spacing: 0.2em;">
          Translated to ${targetLanguage} (Mock Provider)
        </span>
      </div>\n${text}`;
    }
    
    return `[Translated to ${targetLanguage}]: ${text}`;
  }
}

export class SarvamTranslationProvider implements TranslationProvider {
  name = 'SarvamAI';

  async translate(text: string, targetLanguage: string, sourceLanguage: string = 'en'): Promise<string> {
    try {
      const apiKey = process.env.SARVAM_API_KEY || 'sk_3rmpzh6h_egmlijJ7zxTPjj2Cs18Mthrb';
      if (!apiKey) throw new Error('SARVAM_API_KEY is missing');

      const sl = sourceLanguage.includes('-') ? sourceLanguage : `${sourceLanguage}-IN`;
      const tl = targetLanguage.includes('-') ? targetLanguage : `${targetLanguage}-IN`;

      // Sarvam AI has a strict 2000 character limit per request.
      const chunks: string[] = [];
      let currentChunk = "";
      
      const paragraphs = text.split('\n');
      for (const p of paragraphs) {
        if (p.length > 1000) {
          // Paragraph is too large. Split by sentences.
          const sentences = p.split(/(?<=\.|\?|\!)\s/);
          for (const sentence of sentences) {
            let remainingSentence = sentence;
            while (remainingSentence.length > 0) {
              const slice = remainingSentence.substring(0, 1000);
              remainingSentence = remainingSentence.substring(1000);
              if ((currentChunk + slice).length > 1000) {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = slice;
              } else {
                currentChunk += (currentChunk ? ' ' : '') + slice;
              }
            }
          }
        } else {
          // Normal sized paragraph
          if ((currentChunk + p).length > 1000) {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = p;
          } else {
            currentChunk += (currentChunk ? '\n' : '') + p;
          }
        }
      }
      if (currentChunk) chunks.push(currentChunk);

      let translatedText = "";
      for (const chunk of chunks) {
        if (chunk.trim() === '') {
          translatedText += '\n';
          continue;
        }
        
        const endpoint = 'https://api.sarvam.ai/translate';
        const response = await fetch(endpoint, {
          method: 'POST',
          body: JSON.stringify({
            input: chunk,
            source_language_code: sl,
            target_language_code: tl,
            speaker_gender: 'Male',
            mode: 'formal',
            model: 'sarvam-translate:v1'
          }),
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': apiKey
          }
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(`Sarvam AI failed with status: ${response.status} - ${errData.error?.message || errData.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        if (data && data.translated_text) {
          translatedText += data.translated_text + '\n';
        }
        
        // Small delay to prevent rate limit
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      return translatedText.trim();
    } catch (error: any) {
      console.error('Sarvam AI Error:', error);
      throw new Error(error.message || 'Sarvam AI failed');
    }
  }
}

export class TranslationManager {
  private providers: TranslationProvider[];

  constructor() {
    // Primary: Sarvam AI
    this.providers = [
      new SarvamTranslationProvider()
    ];
  }

  async translate(text: string, targetLanguage: string, sourceLanguage: string = 'en'): Promise<{ translatedText: string, provider: string }> {
    for (const provider of this.providers) {
      try {
        const translatedText = await provider.translate(text, targetLanguage, sourceLanguage);
        if (translatedText) {
          return { translatedText, provider: provider.name };
        }
      } catch (error) {
        console.warn(`${provider.name} failed. Trying next provider...`);
      }
    }
    
    throw new Error('All translation providers failed.');
  }
}

export const translationManager = new TranslationManager();
