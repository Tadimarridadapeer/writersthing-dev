import LearnLayout from "@/components/LearnLayout";

export default function BooksPage() {
  return (
    <LearnLayout title="Recommended Reading" readingTime="4 min read">
      <h2>Books on Storytelling</h2>
      <p>
        If you want to master structure and narrative drive, these are essential reading:
      </p>
      <ul>
        <li><strong>On Writing</strong> by Stephen King</li>
        <li><strong>Story</strong> by Robert McKee</li>
        <li><strong>Save the Cat! Writes a Novel</strong> by Jessica Brody</li>
      </ul>

      <h2>Books on Creativity</h2>
      <p>
        For overcoming blocks and understanding the creative mindset:
      </p>
      <ul>
        <li><strong>The War of Art</strong> by Steven Pressfield</li>
        <li><strong>Big Magic</strong> by Elizabeth Gilbert</li>
        <li><strong>Bird by Bird</strong> by Anne Lamott</li>
      </ul>

      <h2>Books on the Business of Writing</h2>
      <p>
        For authors who want to treat their passion as a profession:
      </p>
      <ul>
        <li><strong>Six-Figure Author</strong> by Chris Fox</li>
        <li><strong>Write to Market</strong> by Chris Fox</li>
        <li><strong>Let's Get Digital</strong> by David Gaughran</li>
      </ul>
    </LearnLayout>
  );
}
