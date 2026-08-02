import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { translationManager } from '@/lib/translationProvider';

export async function POST(request: Request) {
  try {
    const { storyId, languageCode, title, content } = await request.json();

    if (!storyId || !languageCode || (!title && !content)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Check if translation exists
    const { data: existing, error: checkError } = await supabase
      .from('story_translations')
      .select('*')
      .eq('story_id', storyId)
      .eq('language_code', languageCode)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'completed' && existing.provider !== 'MockTranslator' && existing.provider !== 'mock') {
        return NextResponse.json({
          status: 'completed',
          title: existing.translated_title,
          content: existing.translated_content,
          provider: existing.provider
        });
      } else if (existing.status === 'pending') {
        return NextResponse.json({ status: 'pending' });
      }
    }

    // 2. Mark as pending if not exists or failed
    if (!existing || existing.status === 'failed') {
      const { error: upsertError } = await supabase
        .from('story_translations')
        .upsert({
          story_id: storyId,
          language_code: languageCode,
          status: 'pending',
          provider: 'unknown',
          updated_at: new Date().toISOString()
        });
        
      if (upsertError) {
        console.error("Failed to set pending status:", upsertError);
      }
    }

    // For synchronous processing, we could return here and let a background job pick it up.
    // However, since Next.js edge functions or serverless functions run synchronously in Vercel typically,
    // we will do it inline or rely on a promise without awaiting (which may be killed on Vercel but works locally/on full servers).
    // Let's do it inline for now. A truly async process would queue this to a worker (e.g. Inngest, Upstash, or pg-boss).

    let translatedTitle = title;
    let translatedContent = content;
    let providerUsed = 'unknown';

    try {
      if (title) {
        const titleRes = await translationManager.translate(title, languageCode, 'en');
        translatedTitle = titleRes.translatedText;
        providerUsed = titleRes.provider; // assume same for both
      }
      
      if (content) {
        // If content is huge, we might want to split it by blocks or paragraphs,
        // but for now, we pass the whole HTML content
        const contentRes = await translationManager.translate(content, languageCode, 'en');
        translatedContent = contentRes.translatedText;
        providerUsed = contentRes.provider;
      }

      // 3. Mark as completed
      const { error: completeError } = await supabase
        .from('story_translations')
        .update({
          translated_title: translatedTitle,
          translated_content: translatedContent,
          provider: providerUsed,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('story_id', storyId)
        .eq('language_code', languageCode);

      if (completeError) {
        console.error("Error updating completed status:", completeError);
      }

      return NextResponse.json({
        status: 'completed',
        title: translatedTitle,
        content: translatedContent,
        provider: providerUsed
      });

    } catch (transError: any) {
      console.error("Translation Engine Error:", transError);
      
      // 4. Mark as failed
      await supabase
        .from('story_translations')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('story_id', storyId)
        .eq('language_code', languageCode);

      return NextResponse.json({ error: 'Translation failed', details: transError.message }, { status: 500 });
    }

  } catch (error) {
    console.error("Translate API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
