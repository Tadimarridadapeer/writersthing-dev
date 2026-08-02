const TranslationProvider = require('./TranslationProvider');
const axios = require('axios');

class LibreTranslationProvider extends TranslationProvider {
  constructor() {
    super();
    // Defaulting to the public Argos Open Tech instance. 
    // In production, you would run your own LibreTranslate instance.
    this.apiUrl = process.env.LIBRE_TRANSLATE_URL || 'https://translate.argosopentech.com/translate';
  }

  async translate(content, sourceLang, targetLang, options = {}) {
    if (!content) return content;
    
    // For automatic detection, LibreTranslate expects 'auto'
    const source = sourceLang || 'auto';
    
    try {
      // If the content is too large, you might need to chunk it.
      // For this implementation, we will send the whole content.
      const response = await axios.post(
        this.apiUrl,
        {
          q: content,
          source: source,
          target: targetLang,
          format: 'text',
          api_key: process.env.LIBRE_TRANSLATE_API_KEY || ''
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000 // translations can take a bit
        }
      );

      if (response.data && response.data.translatedText) {
        return response.data.translatedText;
      }
      
      throw new Error('Unexpected response format from LibreTranslate');
    } catch (error) {
      console.error(`Translation failed for ${targetLang}:`, error.message);
      if (error.response && error.response.data) {
         console.error(error.response.data);
      }
      throw error;
    }
  }
}

module.exports = LibreTranslationProvider;
