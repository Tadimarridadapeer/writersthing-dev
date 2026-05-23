import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Book from "@/models/Book";
import User from "@/models/User";
import fs from "fs";
import path from "path";

const MOCK_DB_PATH = path.join(process.cwd(), "src/data/posts.json");

const SEED_BOOKS = [
  {
    title: "THE ART OF PROMPT",
    description: "Learn the skill of thinking clearly and asking better questions with AI. Turn simple questions into powerful prompts.",
    content: "This book is about learning a skill that will stay valuable for life: the ability to think clearly and ask better questions.",
    price: 99,
    coverImage: "/the-art-of-prompt.png",
    genre: "Education",
    language: "English",
    isPublished: true,
    type: "Book"
  },
  {
    title: "ECHOES OF THE FUTURE",
    description: "A deep dive into the next century of human evolution and artificial consciousness.",
    content: "What does it mean to be human in a world where machines can think?",
    price: 99,
    coverImage: "https://images.unsplash.com/photo-1614850523296-62c0af47596a?q=80&w=800",
    genre: "Sci-Fi",
    language: "English",
    isPublished: true,
    type: "Book"
  },
  {
    title: "THE SILENT MIRROR",
    description: "A psychological thriller that explores the boundaries of reality and identity.",
    content: "The reflection in the mirror was moving, but she was perfectly still.",
    price: 99,
    coverImage: "https://images.unsplash.com/photo-1506466010722-395aa2bef877?q=80&w=800",
    genre: "Thriller",
    language: "English",
    isPublished: true,
    type: "Book"
  },
  {
    title: "BEYOND THE HORIZON",
    description: "The untold biography of an explorer who mapped the invisible territories of the mind.",
    content: "The greatest maps are the ones we draw of our own souls.",
    price: 99,
    coverImage: "https://images.unsplash.com/photo-1492052722242-2554d0e99e3a?q=80&w=800",
    genre: "Biography",
    language: "English",
    isPublished: true,
    type: "Book"
  },
  {
    title: "DIGITAL SOLITUDE",
    description: "Finding peace in a hyper-connected world. A philosophical guide to modern living.",
    content: "Silence is the only frequency that never changes.",
    price: 99,
    coverImage: "https://images.unsplash.com/photo-1449156059431-787c5d7139b8?q=80&w=800",
    genre: "Non-Fiction",
    language: "English",
    isPublished: true,
    type: "Book"
  },
  {
    title: "MYSTERY AT THE MARGINS",
    description: "A gripping detective story set in the rainy streets of London, where every shadow hides a secret.",
    content: "The rain washed away the blood, but it couldn't wash away the truth.",
    price: 149,
    coverImage: "https://images.unsplash.com/photo-1476842634003-7dcca8f832de?q=80&w=800",
    genre: "Mystery",
    language: "English",
    isPublished: true,
    type: "Book"
  },
  {
    title: "CHRONICLES OF INDUS",
    description: "An epic historical fiction reimagining the height of the Harappan civilization.",
    content: "In the dusty streets of Harappa, a king was rising.",
    price: 199,
    coverImage: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=800",
    genre: "History",
    language: "English",
    isPublished: true,
    type: "Book"
  },
  {
    title: "NEON DREAMS",
    description: "A vibrant collection of cyberpunk poetry exploring urban decay and synthetic love.",
    content: "Electric sheep graze in fields of binary code.",
    price: 79,
    coverImage: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800",
    genre: "Poetry",
    language: "English",
    isPublished: true,
    type: "Book"
  },
  {
    title: "AMARA'S QUEST",
    description: "A fantasy novel about a young girl's journey through the Enchanted Ghats of India.",
    content: "The mountains whispered her name, a song of old magic.",
    price: 129,
    coverImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800",
    genre: "Fiction",
    language: "English",
    isPublished: true,
    type: "Book"
  },
  {
    title: "THE COSMIC WEAVER",
    description: "Theoretical physics meets Eastern philosophy in this groundbreaking scientific work.",
    content: "The universe is not just atoms, it is information woven into existence.",
    price: 249,
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800",
    genre: "Education",
    language: "English",
    isPublished: true,
    type: "Book"
  },
  {
    title: "TELUGU TALES",
    description: "A collection of short stories from the heart of Andhra, translated for global readers.",
    content: "The scent of jasmine and the sound of bells heralded the festival.",
    price: 59,
    coverImage: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=800",
    genre: "Fiction",
    language: "Telugu",
    isPublished: true,
    type: "Book"
  },
  {
    title: "HIMALAYAN HAUNTINGS",
    description: "Spine-chilling ghost stories from the remote villages of the Great Himalayas.",
    content: "The wind didn't just howl; it screamed with a human voice.",
    price: 89,
    coverImage: "https://images.unsplash.com/photo-1464274195143-93477f16acc0?q=80&w=800",
    genre: "Mystery",
    language: "Hindi",
    isPublished: true,
    type: "Book"
  },
  {
    title: "THE ART OF COOKING",
    description: "Master the fundamental techniques of modern culinary arts with over 50 base recipes.",
    content: "Cooking is 10% recipe and 90% understanding how heat works.",
    price: 299,
    coverImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800",
    genre: "Non-Fiction",
    language: "English",
    isPublished: true,
    type: "Book"
  },
  {
    title: "LAST DAYS OF ROME",
    description: "A dramatic historical account of the final months of the Roman Empire.",
    content: "The empire didn't fall; it slowly dissolved into the night.",
    price: 179,
    coverImage: "https://images.unsplash.com/photo-1512916194211-3f2b7f5f7de3?q=80&w=800",
    genre: "History",
    language: "English",
    isPublished: true,
    type: "Book"
  },
  {
    title: "QUANTUM LOVE",
    description: "A romantic comedy about two physicists who discover that entanglement isn't just for particles.",
    content: "She was the only variable he couldn't solve for.",
    price: 119,
    coverImage: "https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=800",
    genre: "Comedy",
    language: "English",
    isPublished: true,
    type: "Book"
  }
];

export async function GET() {
  try {
    // 1. Seed Local Mock DB (posts.json)
    if (!fs.existsSync(path.dirname(MOCK_DB_PATH))) {
      fs.mkdirSync(path.dirname(MOCK_DB_PATH), { recursive: true });
    }
    
    const existingPosts = fs.existsSync(MOCK_DB_PATH) 
      ? JSON.parse(fs.readFileSync(MOCK_DB_PATH, "utf-8")) 
      : [];
    
    const newPosts = SEED_BOOKS.map((book, i) => ({
      ...book,
      _id: `seed-${Date.now()}-${i}`,
      createdAt: new Date().toISOString(),
      author: { name: "Writersthing Author" }
    }));

    // Simple de-duplication for mock DB
    const combinedPosts = [...existingPosts];
    newPosts.forEach(post => {
      if (!combinedPosts.find(p => p.title === post.title)) {
        combinedPosts.push(post);
      }
    });

    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(combinedPosts, null, 2));

    // 2. Seed MongoDB
    try {
      const conn = await dbConnect();
      if (!conn) {
        return NextResponse.json({ message: "Mock DB seeded! MongoDB failed (connection returned null)." });
      }
      let author = await User.findOne({ email: "tadimarri@example.com" });
      if (!author) {
        author = await User.create({
          name: "TADIMARRI DADAPEER",
          email: "tadimarri@example.com",
          password: "password123",
          role: "Author"
        });
      }

      for (const book of SEED_BOOKS) {
        const exists = await Book.findOne({ title: book.title });
        if (!exists) {
          await Book.create({ ...book, author: author._id });
        }
      }
      return NextResponse.json({ message: "Mock DB and MongoDB seeded successfully!" });
    } catch (dbError) {
      return NextResponse.json({ message: "Mock DB seeded! MongoDB failed (likely not connected)." });
    }

  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
