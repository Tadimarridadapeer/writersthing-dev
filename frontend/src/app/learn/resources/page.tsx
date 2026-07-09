import LearnLayout from "@/components/LearnLayout";

export default function ResourcesPage() {
  return (
    <LearnLayout title="Writing Resources" readingTime="3 min read">
      <h2>Templates and Planners</h2>
      <p>
        Structure shouldn't stifle creativity; it should channel it. We've compiled 
        the best industry-standard templates for outlining, character creation, and 
        world-building.
      </p>
      <ul>
        <li><strong>The Save The Cat! Beat Sheet:</strong> Perfect for screenplays and fast-paced novels.</li>
        <li><strong>The Snowflake Method:</strong> Ideal for planners who want to build their story from a single sentence.</li>
        <li><strong>Character Interview Sheets:</strong> 50 questions to ask your protagonist before you begin writing.</li>
      </ul>
      <p>
        <em>Note: Downloadable PDFs and Notion templates will be available in the upcoming platform update.</em>
      </p>
    </LearnLayout>
  );
}
