"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, BookOpen, FileText, PenTool, Zap, GraduationCap, Heart, Edit3, Star, Library } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const INTERESTS = [
  "Artificial Intelligence", "Technology", "Programming", "Data Science", 
  "Business", "Entrepreneurship", "Self Help", "Psychology", 
  "Finance", "Design", "History", "Science", 
  "Health", "Fitness", "Romance", "Mystery", 
  "Thriller", "Fantasy", "Horror", "Biography", 
  "Philosophy", "Poetry", "Education", "Comics", 
  "Travel", "Cooking"
];

const CONTENT_TYPES = [
  { id: "Books", icon: <BookOpen size={24} /> },
  { id: "Articles", icon: <FileText size={24} /> },
  { id: "Blogs", icon: <PenTool size={24} /> },
  { id: "Short Reads", icon: <Zap size={24} /> },
  { id: "Learning Series", icon: <GraduationCap size={24} /> },
  { id: "Stories", icon: <Heart size={24} /> },
  { id: "Writing Tips", icon: <Edit3 size={24} /> },
  { id: "Book Recommendations", icon: <Star size={24} /> }
];

const GOALS = [
  "Read more books",
  "Learn new skills",
  "Improve my knowledge",
  "Learn AI",
  "Discover new writers",
  "Publish my own books",
  "Write blogs",
  "Become an author",
  "Build a reading habit",
  "Get daily inspiration",
  "Support independent writers"
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleContentToggle = (type: string) => {
    setSelectedContentTypes(prev => 
      prev.includes(type) ? prev.filter(i => i !== type) : [...prev, type]
    );
  };

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(i => i !== goal) : [...prev, goal]
    );
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSaveAndExplore = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests: selectedInterests,
          contentTypes: selectedContentTypes,
          goals: selectedGoals
        })
      });

      if (!res.ok) throw new Error("Failed to save preferences");
      
      // Update local storage to reflect onboarding completed
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.onboarding_completed = true;
        localStorage.setItem("user", JSON.stringify(parsed));
      }

      router.push("/marketplace");
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">Loading...</div>;
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#FDFDFD] flex flex-col items-center pt-8 md:pt-16 px-6 pb-6 md:pb-12">
      {/* Brand Header */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-10">
        <Link href="/">
          <img src="/logo.png" alt="Writersthing" className="h-8 md:h-12 w-auto object-contain transition-transform hover:scale-105" style={{ filter: 'grayscale(100%)' }} />
        </Link>
      </div>

      <div className="w-full max-w-4xl mx-auto mt-16 md:mt-20 relative flex-grow flex flex-col min-h-0">
        {step < 4 && (
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-black' : 'bg-zinc-200'} transition-colors duration-500`} />
            ))}
            <span className="text-[10px] md:text-xs font-bold text-zinc-400 ml-4 whitespace-nowrap">STEP {step} OF 3</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-grow flex flex-col h-full min-h-0"
            >
              <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight uppercase mb-2">What do you enjoy reading?</h1>
              <p className="text-zinc-500 text-sm md:text-lg font-medium italic mb-6">Choose at least 3 interests to personalize your experience.</p>
              
              <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-4 custom-scrollbar">
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {INTERESTS.map(interest => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => handleInterestToggle(interest)}
                        className={`px-4 py-2 md:px-5 md:py-3 rounded-full text-xs md:text-sm font-bold transition-all border-2 flex items-center gap-2
                          ${isSelected ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}
                      >
                        {isSelected && <Check size={16} />}
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-auto pt-6 flex justify-end shrink-0">
                <button
                  onClick={handleNext}
                  disabled={selectedInterests.length < 3}
                  className="bg-black text-white px-8 py-3 md:px-10 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-900 transition-colors"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-grow flex flex-col h-full min-h-0"
            >
              <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight uppercase mb-2">What would you like to discover?</h1>
              <p className="text-zinc-500 text-sm md:text-lg font-medium italic mb-6">Choose the content you'd love to see in your feed.</p>
              
              <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-4 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {CONTENT_TYPES.map(type => {
                    const isSelected = selectedContentTypes.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleContentToggle(type.id)}
                        className={`p-4 md:p-6 rounded-2xl flex flex-col items-center justify-center gap-3 md:gap-4 border-2 transition-all text-center
                          ${isSelected ? 'border-black bg-black text-white shadow-xl scale-[1.02]' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'}`}
                      >
                        <div className={`${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                          {type.icon}
                        </div>
                        <span className="font-bold text-xs md:text-sm">{type.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-auto pt-6 flex justify-between items-center shrink-0">
                <button onClick={handleBack} className="text-xs md:text-sm font-bold text-zinc-500 hover:text-black transition-colors">
                  Go Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={selectedContentTypes.length === 0}
                  className="bg-black text-white px-8 py-3 md:px-10 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-900 transition-colors"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-grow flex flex-col h-full min-h-0"
            >
              <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight uppercase mb-2">Why are you joining Writer's Thing?</h1>
              <p className="text-zinc-500 text-sm md:text-lg font-medium italic mb-6">Help us personalize your experience.</p>
              
              <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-4 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {GOALS.map(goal => {
                    const isSelected = selectedGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        onClick={() => handleGoalToggle(goal)}
                        className={`p-4 md:p-5 rounded-xl flex items-center gap-3 md:gap-4 border-2 transition-all text-left
                          ${isSelected ? 'border-black bg-zinc-50' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
                      >
                        <div className={`w-5 h-5 md:w-6 md:h-6 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-black border-black' : 'border-zinc-300'}`}>
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>
                        <span className={`font-bold text-xs md:text-sm ${isSelected ? 'text-black' : 'text-zinc-600'}`}>{goal}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-auto pt-6 flex justify-between items-center shrink-0">
                <button onClick={handleBack} className="text-xs md:text-sm font-bold text-zinc-500 hover:text-black transition-colors">
                  Go Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={selectedGoals.length === 0}
                  className="bg-black text-white px-8 py-3 md:px-10 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-900 transition-colors"
                >
                  Finish <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-grow flex flex-col items-center justify-center text-center h-full min-h-0"
            >
              <div className="w-32 h-32 bg-zinc-100 rounded-full flex items-center justify-center mb-8">
                <Library size={48} className="text-black" />
              </div>
              <h1 className="text-5xl md:text-6xl font-heading font-black tracking-tight uppercase mb-6">Perfect! Your library is ready.</h1>
              <p className="text-zinc-500 text-lg font-medium italic mb-12 max-w-2xl">
                We'll recommend books, blogs, articles, and writers based on your interests and goals. You can update these preferences anytime from your Profile Settings.
              </p>
              
              <button
                onClick={handleSaveAndExplore}
                disabled={saving}
                className="bg-black text-white px-12 py-5 text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-zinc-900 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-50"
              >
                {saving ? "Preparing..." : "Start Exploring"} <ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
