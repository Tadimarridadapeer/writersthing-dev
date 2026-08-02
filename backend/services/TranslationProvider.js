class TranslationProvider {
  /**
   * Translates the given content into the target language.
   * @param {string} content - The text to translate.
   * @param {string} sourceLang - The source language code (e.g., 'en', 'auto').
   * @param {string} targetLang - The target language code (e.g., 'es').
   * @param {object} options - Additional options like a custom dictionary.
   * @returns {Promise<string>} The translated text.
   */
  async translate(content, sourceLang, targetLang, options = {}) {
    throw new Error('Not implemented');
  }
}

module.exports = TranslationProvider;
