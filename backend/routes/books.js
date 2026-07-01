const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// Get all published books
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*, authors:author_id(*, users:user_id(name))')
      .eq('status', 'Published')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish a new book
router.post('/', async (req, res) => {
  try {
    const { title, content, description, price, coverImage, language, genre, pdfUrl, authorId } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    console.log("Express POST /api/books - Received request body:", req.body);
    console.log("Express POST /api/books - Authenticated User ID (authorId):", authorId);

    let userSupabase = supabase;
    if (token) {
      const { createClient } = require('@supabase/supabase-js');
      userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      });
    }

    const insertPayload = {
      title,
      description: description || (content ? content.substring(0, 160) : ''),
      category: genre || 'Fiction',
      cover_url: coverImage,
      pdf_path: pdfUrl,
      price: price || 99,
      author_id: authorId,
      status: 'Published'
    };

    console.log("Express POST /api/books - Executing Supabase insert:", insertPayload);

    const { data, error } = await userSupabase
      .from('books')
      .insert([insertPayload])
      .select();

    if (error) {
      console.error("Express POST /api/books - Supabase Insert Error:", error.message, error.details);
      return res.status(400).json({ error: error.message });
    }

    console.log("Express POST /api/books - Supabase Insert Success:", data[0]);
    res.status(201).json({ message: 'Book published', book: data[0] });
  } catch (err) {
    console.error("Express POST /api/books - Unexpected Server Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get signed URL for reading (Secure)
router.get('/read/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Auth required' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: 'Invalid session' });

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

    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (!access && book.author_id !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { data: signedData, error: signError } = await supabase.storage
      .from('pdfs')
      .createSignedUrl(book.pdf_path, 3600);

    if (signError) return res.status(500).json({ error: signError.message });
    res.json({ url: signedData.signedUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
