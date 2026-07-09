import Link from "next/link";
import { 
  Feather, 
  BookOpen, 
  Users, 
  Book, 
  Landmark, 
  GraduationCap, 
  Gift,
  Info,
  Mail,
  Briefcase,
  Newspaper,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { useState } from "react";


const InstagramIcon = ({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth}
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const LinkedinIcon = ({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth}
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="w-full bg-white text-black border-t border-zinc-100 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 mb-24">
          
          {/* Left Column - Brand & Newsletter */}
          <div className="lg:col-span-5 flex flex-col">
            <Link href="/" className="mb-6 flex items-center gap-1 group">
              <span className="text-3xl font-black tracking-tighter uppercase" style={{ fontFamily: 'var(--font-outfit)' }}>
                WRITERSTHING
              </span>
              <span className="text-3xl font-light transform group-hover:rotate-45 transition-transform duration-300">✦</span>
            </Link>
            
            <p className="text-zinc-600 text-[15px] leading-relaxed max-w-sm mb-12">
              The ultimate destination for the next generation of storytellers. Turning unknown writers into icons.
            </p>

            <div className="mb-8">
              <h4 className="font-bold text-sm mb-4">Stay inspired. Never miss an update.</h4>
              {subscribed ? (
                <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-md animate-fade-in">
                  <p className="font-bold text-sm">You&apos;re in.</p>
                  <p className="text-zinc-500 text-sm">Welcome to Writer&apos;s Thing.</p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 px-4 py-3 border border-zinc-200 rounded-md text-sm focus:outline-none focus:border-black transition-colors"
                  />
                  <button 
                    type="submit"
                    className="px-6 py-3 bg-black text-white text-sm font-semibold rounded-md hover:bg-zinc-800 transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/the_writersthing?igsh=b3pjdWozODduZ3Jh" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 hover:border-zinc-300 transition-all text-black">
                <InstagramIcon className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a href="https://www.linkedin.com/company/writers-thing/" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 hover:border-zinc-300 transition-all text-black">
                <LinkedinIcon className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a href="https://whatsapp.com/channel/0029VbCCMcBIiRouZwg8FH27" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 hover:border-zinc-300 transition-all text-black">
                <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Right Columns - Links */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8">
            
            {/* Platform */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 flex flex-col gap-3">
                PLATFORM
                <div className="w-6 h-[1px] bg-black" />
              </h4>
              <ul className="flex flex-col gap-5">
                <li>
                  <Link href="/community" className="flex items-center gap-3 text-[14px] text-zinc-600 hover:text-black transition-colors group">
                    <Users size={16} className="text-zinc-400 group-hover:text-black transition-colors" />
                    Community
                  </Link>
                </li>
                <li>
                  <Link href="/city-libraries" className="flex items-center gap-3 text-[14px] text-zinc-600 hover:text-black transition-colors group">
                    <Landmark size={16} className="text-zinc-400 group-hover:text-black transition-colors" />
                    <span>City Libraries</span>
                    <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full border border-zinc-200 text-zinc-500 whitespace-nowrap">Coming Soon</span>
                  </Link>
                </li>
                <li>
                  <Link href="/learn" className="flex items-center gap-3 text-[14px] text-zinc-600 hover:text-black transition-colors group">
                    <GraduationCap size={16} className="text-zinc-400 group-hover:text-black transition-colors" />
                    Learn & Grow
                  </Link>
                </li>
                <li>
                  <Link href="/faqs" className="flex items-center gap-3 text-[14px] text-zinc-600 hover:text-black transition-colors group">
                    <Info size={16} className="text-zinc-400 group-hover:text-black transition-colors" />
                    FAQs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 flex flex-col gap-3">
                COMPANY
                <div className="w-6 h-[1px] bg-black" />
              </h4>
              <ul className="flex flex-col gap-5">
                <li>
                  <Link href="/about" className="flex items-center gap-3 text-[14px] text-zinc-600 hover:text-black transition-colors group">
                    <Info size={16} className="text-zinc-400 group-hover:text-black transition-colors" />
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="flex items-center gap-3 text-[14px] text-zinc-600 hover:text-black transition-colors group">
                    <Mail size={16} className="text-zinc-400 group-hover:text-black transition-colors" />
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="flex items-center gap-3 text-[14px] text-zinc-600 hover:text-black transition-colors group">
                    <Briefcase size={16} className="text-zinc-400 group-hover:text-black transition-colors" />
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/press" className="flex items-center gap-3 text-[14px] text-zinc-600 hover:text-black transition-colors group">
                    <Newspaper size={16} className="text-zinc-400 group-hover:text-black transition-colors" />
                    Press
                  </Link>
                </li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 flex flex-col gap-3">
                CONNECT
                <div className="w-6 h-[1px] bg-black" />
              </h4>
              <ul className="flex flex-col gap-5">

                <li>
                  <a href="https://www.instagram.com/the_writersthing?igsh=b3pjdWozODduZ3Jh" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[14px] text-zinc-600 hover:text-black transition-colors group">
                    <InstagramIcon className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors" strokeWidth={2} />
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="https://www.linkedin.com/company/writers-thing/" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[14px] text-zinc-600 hover:text-black transition-colors group">
                    <LinkedinIcon className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors" strokeWidth={2} />
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="https://whatsapp.com/channel/0029VbCCMcBIiRouZwg8FH27" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[14px] text-zinc-600 hover:text-black transition-colors group">
                    <MessageCircle size={16} className="text-zinc-400 group-hover:text-black transition-colors" />
                    WhatsApp Community
                  </a>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Promo Card */}
        <div className="w-full bg-white border border-zinc-200 rounded-xl p-8 md:p-12 mb-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center flex-shrink-0 text-white relative">
              <Feather size={24} />
              {/* Optional tiny decorative mark as seen in the image */}
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-black rounded-full" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold leading-tight">
                For Writers.<br />By Writers.
              </h3>
            </div>
          </div>
          
          <div className="flex-1 max-w-xl md:border-l border-zinc-200 md:pl-8">
            <p className="text-zinc-600 text-sm md:text-[15px] leading-relaxed">
              Every story deserves to be written, read, and remembered. This is your space to create, share, and leave a legacy.
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <Link 
              href="/write" 
              className="px-8 py-4 bg-black text-white text-sm font-semibold rounded-md hover:bg-zinc-800 transition-colors flex items-center gap-2 group"
            >
              Start Writing
              <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-zinc-200 gap-6">
          <p className="text-zinc-500 text-[13px]">© 2026 Writer&apos;s Thing. Built for the unknown.</p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-[13px] text-zinc-500">
            <Link href="/terms" className="hover:text-black transition-colors">Terms of Use</Link>
            <div className="w-px h-4 bg-zinc-300" />
            <Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
