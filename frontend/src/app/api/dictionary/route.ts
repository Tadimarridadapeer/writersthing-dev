import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDictionaryProvider } from '@/lib/dictionaryProvider';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');
  const context = searchParams.get('context');

  if (!word || word.trim() === '') {
    return NextResponse.json({ error: 'Word is required' }, { status: 400 });
  }

  const cleanWord = word.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (cleanWord.length === 0) {
    return NextResponse.json({ error: 'Invalid word' }, { status: 400 });
  }

  try {
    // 1. Check Cache
    const { data: cached, error: cacheError } = await supabase
      .from('dictionary_cache')
      .select('*')
      .eq('word', cleanWord)
      .eq('language', 'en')
      .maybeSingle();

    if (cached) {
      return NextResponse.json({
        word: cached.word,
        partOfSpeech: cached.part_of_speech,
        definition: cached.definition,
        contextDefinition: cached.context_definition,
        synonyms: cached.synonyms || [],
        example: cached.example,
        source: cached.source,
      });
    }

    // 2. Not in cache, use Provider
    const provider = getDictionaryProvider();
    const result = await provider.fetchDefinition(cleanWord, context || undefined);

    if (!result) {
      return NextResponse.json({ error: 'Definition not found' }, { status: 404 });
    }

    // 3. Save to cache
    const { error: insertError } = await supabase
      .from('dictionary_cache')
      .insert({
        word: cleanWord,
        language: 'en',
        part_of_speech: result.partOfSpeech,
        definition: result.definition,
        context_definition: null, // Contextual meaning would come from Gemini/OpenAI when swapped
        synonyms: result.synonyms || [],
        example: result.example || null,
        source: 'FreeDictionaryAPI'
      });

    if (insertError) {
      console.warn("Failed to cache dictionary result:", insertError);
    }

    // 4. Return result
    return NextResponse.json({
      word: result.word,
      partOfSpeech: result.partOfSpeech,
      definition: result.definition,
      phonetic: result.phonetic,
      synonyms: result.synonyms,
      example: result.example,
      source: 'FreeDictionaryAPI'
    });

  } catch (error) {
    console.error("Dictionary API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
