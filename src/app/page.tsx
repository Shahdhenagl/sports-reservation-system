"use client";

import { BookingFlow } from "@/components/booking/booking-flow";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { Languages } from "lucide-react";

export default function Home() {
  const { language, toggleLanguage, direction } = useLanguage();
  const t = translations[language];

  return (
    <main className="min-h-screen relative overflow-hidden bg-background" dir={direction}>
      {/* Language Toggle Header */}
      <header className="container mx-auto px-4 py-6 flex justify-end relative z-20">
        <button 
          onClick={toggleLanguage}
          className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-surface transition-all"
        >
          <Languages className="w-4 h-4 text-primary" />
          {t.language}
        </button>
      </header>

      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-6 sm:py-12 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-6">
            {t.heroTitle} <span className="text-gradient">{t.heroHighlight}</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto">
            {t.heroSubtitle}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <BookingFlow />
        </div>
      </div>
    </main>
  );
}
