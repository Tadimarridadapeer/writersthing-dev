import Link from 'next/link';

export default function ForWritersPage() {
  return (
    <div className="min-h-screen bg-white text-black overflow-hidden relative">
      {/* Dot Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-24 md:pt-20 md:pb-32">
        <h1 
          className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter text-center uppercase mb-10 md:mb-12"
          style={{ fontFamily: 'var(--font-outfit)' }}
        >
          For Writers
        </h1>
        
        <div 
          className="space-y-3 md:space-y-4 text-lg md:text-2xl text-slate-800 text-center font-normal leading-relaxed max-w-3xl mx-auto"
          style={{ fontFamily: 'var(--font-libre-baskerville)' }}
        >
          <p>Every story begins long before it&apos;s written.</p>
          <p>Some stories begin with a memory.</p>
          <p>Some begin with a question.</p>
          <p>Some begin with a heartbreak, a dream, a conversation, or a quiet thought that refuses to leave.</p>
          <p>Before every novel, every poem, every article, and every unforgettable book, there is a moment when someone decides:</p>
          
          <p className="italic font-semibold text-3xl md:text-4xl my-8 text-black" style={{ fontFamily: 'var(--font-eb-garamond)' }}>
            &quot;Maybe I should write this down.&quot;
          </p>
          
          <p>That moment changes everything.</p>
          <p>Writing isn&apos;t about having the perfect words.</p>
          <p>It&apos;s about having the courage to begin.</p>
          <p>No first draft is perfect.</p>
          <p>No bestselling author started with certainty.</p>
          <p>Every writer has faced the same blank page, the same doubt, and the same question:</p>
          
          <p className="italic font-semibold text-3xl md:text-4xl my-8 text-black" style={{ fontFamily: 'var(--font-eb-garamond)' }}>
            &quot;Will anyone ever read this?&quot;
          </p>
          
          <p>The answer has always been the same.</p>
          <p>You&apos;ll never know until you write it.</p>
          <p>Your story doesn&apos;t need permission.</p>
          <p>You don&apos;t need a publisher to tell you your voice matters.</p>
          <p>You don&apos;t need millions of followers before your words deserve readers.</p>
          <p>You don&apos;t need to wait until you think you&apos;re &quot;good enough.&quot;</p>
          <p>Stories don&apos;t become meaningful because someone approves them.</p>
          <p>They become meaningful because someone was brave enough to tell them.</p>
          <p>Someone is waiting for the story only you can write.</p>
          <p>Not because you&apos;re famous.</p>
          <p>Not because you&apos;re perfect.</p>
          <p>Because your experiences, your imagination, your perspective, and your voice have never existed before.</p>
          <p>The world has read thousands of stories.</p>
          <p>It has never read yours.</p>
          <p>Every great author was once unknown.</p>
          <p>Every bookshelf is filled with writers who once doubted themselves.</p>
          <p>They didn&apos;t know if anyone would care.</p>
          <p>They didn&apos;t know if their stories were good enough.</p>
          <p>They simply kept writing.</p>
          <p>The difference between a dream of becoming a writer and becoming one is often just one finished page.</p>

          <div className="py-16 md:py-24">
            <h2 
              className="text-4xl md:text-6xl font-black tracking-tight uppercase mb-8 text-black"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Why Writer&apos;s Thing Exists
            </h2>
            <p className="mb-4">We didn&apos;t build Writer&apos;s Thing because the world needed another publishing platform.</p>
            <p className="mb-4">We built it because writers deserve a place that believes in them before the world does.</p>
            <p className="mb-4">A place where ideas become stories.</p>
            <p className="mb-4">Stories become books.</p>
            <p className="mb-4">Books become legacies.</p>
            <p>Whether you&apos;re writing your very first paragraph or your tenth novel, this is your place to create, publish, and share your work with confidence.</p>
          </div>

          <div className="py-8">
            <h3 
              className="text-3xl md:text-5xl font-bold uppercase mb-8 text-black"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Start Before You&apos;re Ready.
            </h3>
            <p className="mb-4">There will always be another excuse.</p>
            <p className="mb-4">Another tomorrow.</p>
            <p className="mb-4">Another unfinished draft waiting in a folder.</p>
            <p className="mb-4">Don&apos;t wait for the perfect idea.</p>
            <p className="mb-4">Don&apos;t wait for the perfect time.</p>
            <p className="mb-4">The best stories aren&apos;t written by people who waited.</p>
            <p className="mb-4">They&apos;re written by people who began.</p>
            <p className="mb-4">Your next sentence could become your first chapter.</p>
            <p className="mb-4">Your first chapter could become someone&apos;s favorite book.</p>
            <p className="mb-4 font-bold text-black">All you have to do is start.</p>
            <p className="mb-8 text-2xl md:text-4xl font-bold italic text-black" style={{ fontFamily: 'var(--font-eb-garamond)' }}>
              Where unknown writers become known.
            </p>
            <p className="mb-12">The next unforgettable story starts with you.</p>

            <div className="flex justify-center mt-8">
              <Link 
                href="/login" 
                className="px-12 py-5 bg-black text-white hover:bg-zinc-900 transition-colors duration-300 uppercase tracking-[0.2em] text-sm font-semibold rounded-none text-center inline-block shadow-xl hover:shadow-2xl"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                Start Writing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
