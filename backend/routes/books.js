const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { validateBook } = require('../lib/validation');
const { UnauthorizedError, ForbiddenError, NotFoundError } = require('../lib/errors');

// In-memory cache for published books
let booksCache = null;
let cacheResetTime = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

function clearBooksCache() {
  console.log("Express Books Cache Invalidated!");
  booksCache = null;
  cacheResetTime = 0;
}

// Get all published books
router.get('/', async (req, res, next) => {
  try {
    const now = Date.now();
    if (booksCache && now < cacheResetTime) {
      console.log("Express GET /api/books - Cache HIT");
      return res.json(booksCache);
    }

    console.log("Express GET /api/books - Cache MISS (Fetching from DB)");
    const { data, error } = await supabase
      .from('books')
      .select('*, authors:author_id(*, users:user_id(name))')
      .eq('status', 'Published')
      .order('created_at', { ascending: false });

    if (error) return next(error);

    // Set cache values
    booksCache = data;
    cacheResetTime = now + CACHE_DURATION;

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Publish a new book
router.post('/', validateBook, async (req, res, next) => {
  try {
    const { title, content, description, price, coverImage, language, genre, pdfUrl } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    console.log("Express POST /api/books - Received request body:", req.body);

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    // Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    console.log("Express POST /api/books - Authenticated User ID:", user.id);
 
    // Retrieve the author profile corresponding to the authenticated user ID
    const { data: authorRecord, error: authorError } = await supabase
      .from('authors')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
 
    if (authorError || !authorRecord) {
      console.error("Express POST /api/books - Author lookup failed:", authorError?.message);
      throw new ForbiddenError('Author profile record missing. Please create an author profile.');
    }
 
    const insertPayload = {
      title,
      description: description || (content ? content.substring(0, 160) : ''),
      category: genre || 'Fiction',
      cover_url: coverImage,
      pdf_path: pdfUrl,
      price: price || 99,
      author_id: authorRecord.id, // Securely bind to verified author profile ID
      status: 'Published'
    };
 
    console.log("Express POST /api/books - Executing Supabase insert:", insertPayload);
 
    // Perform insert using service-role client to bypass RLS constraint safely (security is handled by server-side lookup)
    const { data, error } = await supabase
      .from('books')
      .insert([insertPayload])
      .select();

    if (error) {
      console.error("Express POST /api/books - Supabase Insert Error:", error.message, error.details);
      return next(error);
    }

    // Invalidate cache since a new book is published
    clearBooksCache();

    console.log("Express POST /api/books - Supabase Insert Success:", data[0]);
    res.status(201).json({ message: 'Book published', book: data[0] });
  } catch (err) {
    next(err);
  }
});

// Get signed URL for reading (Secure)
router.get('/read/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) throw new UnauthorizedError('Auth required');

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new UnauthorizedError('Invalid session');

    // Verify ownership
    const { data: access } = await supabase
      .from('library')
      .select('*')
      .eq('user_id', user.id)
      .eq('book_id', id)
      .single();

    const { data: book } = await supabase
      .from('books')
      .select('pdf_path, author_id')
      .eq('id', id)
      .single();

    if (!book) throw new NotFoundError('Book not found');
    if (!access && book.author_id !== user.id) {
      throw new ForbiddenError('Access denied');
    }

    const { data: signedData, error: signError } = await supabase.storage
      .from('pdfs')
      .createSignedUrl(book.pdf_path, 3600);

    if (signError) return next(signError);
    res.json({ url: signedData.signedUrl });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
