const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const LibreTranslationProvider = require('../services/LibreTranslationProvider');

// Initialize Supabase admin client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const translator = new LibreTranslationProvider();

// Core languages to translate to immediately on publish
const CORE_LANGUAGES = ['es', 'hi', 'fr', 'de'];

router.post('/process', async (req, res) => {
  const { contentId, contentType, content, title, sourceLang, targetLangs } = req.body;

  if (!contentId || !contentType || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Return immediately to not block the frontend
  res.status(202).json({ message: 'Translation job queued.' });

  // Process in the background
  try {
    const langsToProcess = targetLangs || CORE_LANGUAGES;
    
    // Process translations sequentially to avoid rate limits (or use Promise.all if permitted)
    for (const lang of langsToProcess) {
      if (lang === sourceLang) continue; // Skip original language

      console.log(`Translating content ${contentId} to ${lang}...`);
      
      try {
        const translatedContent = await translator.translate(content, sourceLang, lang);
        let translatedTitle = title;
        if (title) {
          translatedTitle = await translator.translate(title, sourceLang, lang);
        }

        // Save to Supabase
        const { error } = await supabase
          .from('translations')
          .upsert({
            content_id: contentId,
            content_type: contentType,
            language_code: lang,
            title: translatedTitle,
            content: translatedContent,
            status: 'completed',
            updated_at: new Date().toISOString()
          }, { onConflict: 'content_id,language_code' });

        if (error) {
          console.error(`Error saving translation for ${lang}:`, error);
        } else {
          console.log(`Successfully translated and saved content ${contentId} to ${lang}`);
        }
      } catch (err) {
        console.error(`Failed to translate to ${lang}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Background translation job failed:', error);
  }
});

module.exports = router;
