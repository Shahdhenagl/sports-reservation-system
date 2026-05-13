"use client";

import { useState } from "react";
import { CalendarDays, MapPin, Trophy, CheckCircle2, ChevronRight, Upload, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

type Step = 1 | 2 | 3 | 4 | 5;

export function BookingFlow() {
  const [step, setStep] = useState<Step>(1);
  const { language, direction } = useLanguage();
  const t = translations[language];

  // Mock data for UI demonstration
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const nextStep = () => setStep((s) => Math.min(s + 1, 5) as Step);
  const prevStep = () => setStep((s) => Math.max(s - 1, 1) as Step);

  return (
    <div className="glass rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/10 relative overflow-hidden" dir={direction}>
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              step >= i ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface text-muted'
            }`}>
              {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
            </div>
            {/* Connector Line */}
            {i < 5 && (
              <div className={`absolute top-5 h-[2px] w-[calc(20%-2.5rem)] ${direction === 'rtl' ? 'mr-[10%] left-auto right-0' : 'ml-[10%] left-0 right-auto'} -z-10 transition-all duration-300 ${
                step > i ? 'bg-primary' : 'bg-surface'
              }`} style={{ [direction === 'rtl' ? 'right' : 'left']: `${(i - 1) * 20 + 10}%` }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="relative z-10 min-h-[400px]">
        {step === 1 && (
          <div className={`space-y-6 animate-in fade-in ${direction === 'rtl' ? 'slide-in-from-left-8' : 'slide-in-from-right-8'} duration-500`}>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t.whatToPlay}</h2>
              <p className="text-muted">{t.selectSport}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => setSelectedSport('football')}
                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${
                  selectedSport === 'football' ? 'border-primary bg-primary/10' : 'border-border bg-surface/50 hover:border-muted'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <span className="font-semibold text-lg text-foreground">{t.football}</span>
              </button>
              <button 
                onClick={() => setSelectedSport('padel')}
                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${
                  selectedSport === 'padel' ? 'border-primary bg-primary/10' : 'border-border bg-surface/50 hover:border-muted'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-blue-500" />
                </div>
                <span className="font-semibold text-lg text-foreground">{t.padel}</span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={`space-y-6 animate-in fade-in ${direction === 'rtl' ? 'slide-in-from-left-8' : 'slide-in-from-right-8'} duration-500`}>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t.whenToPlay}</h2>
              <p className="text-muted">{t.selectDateTime}</p>
            </div>
            
            {/* Mock Date/Time selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button className="p-4 rounded-xl border border-border bg-surface/50 text-foreground flex items-center justify-center gap-2 hover:border-primary transition-colors">
                <CalendarDays className="w-5 h-5 text-primary" />
                {t.selectDate}
              </button>
              <button className="p-4 rounded-xl border border-border bg-surface/50 text-foreground flex items-center justify-center gap-2 hover:border-primary transition-colors">
                <Clock className="w-5 h-5 text-primary" />
                {t.selectTime}
              </button>
            </div>
            <div className="p-4 rounded-xl bg-surface/30 border border-border text-center text-muted">
              <p>{t.calendarIntegration}</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={`space-y-6 animate-in fade-in ${direction === 'rtl' ? 'slide-in-from-left-8' : 'slide-in-from-right-8'} duration-500`}>
             <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t.yourDetails}</h2>
              <p className="text-muted">{t.reachYou}</p>
            </div>
            <div className="space-y-4 max-w-md mx-auto">
              <input type="text" placeholder={t.fullName} className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="tel" placeholder={t.phoneNumber} className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary" />
              <textarea placeholder={t.specialRequests} className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className={`space-y-6 animate-in fade-in ${direction === 'rtl' ? 'slide-in-from-left-8' : 'slide-in-from-right-8'} duration-500`}>
             <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t.payment}</h2>
              <p className="text-muted">{t.total}: EGP 600.00</p>
            </div>
            
            <div className="max-w-md mx-auto space-y-6">
              <div className="p-6 rounded-2xl bg-surface/50 border border-primary/50 relative overflow-hidden">
                <div className={`absolute top-0 ${direction === 'rtl' ? 'left-0' : 'right-0'} bg-primary text-white text-xs font-bold px-3 py-1 ${direction === 'rtl' ? 'rounded-br-lg' : 'rounded-bl-lg'}`}>{t.recommended}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">InstaPay</h3>
                <p className="text-muted text-sm mb-4">{t.transferTo}: <strong>sportsclub@instapay</strong></p>
                
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-foreground font-medium">{t.uploadScreenshot}</p>
                  <p className="text-xs text-muted mt-1">{t.fileTypes}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-in zoom-in-95 duration-500 text-center py-12">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">{t.bookingRequested}</h2>
            <p className="text-muted max-w-md mx-auto mb-6">
              {t.bookingSuccess}
            </p>
            <div className="bg-surface/50 border border-border rounded-xl p-4 inline-block">
              <p className="text-sm text-muted mb-1">{t.bookingRef}</p>
              <p className="text-2xl font-mono font-bold text-foreground tracking-widest">BK-8X9A2</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 pt-6 border-t border-border flex justify-between items-center relative z-10">
        {step > 1 && step < 5 ? (
          <button onClick={prevStep} className="px-6 py-2.5 rounded-xl font-medium text-foreground hover:bg-surface transition-colors">
            {t.back}
          </button>
        ) : <div />}
        
        {step < 5 && (
          <button onClick={nextStep} className={`px-8 py-2.5 rounded-xl font-medium text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center gap-2 ${direction === 'rtl' ? 'mr-auto ml-0 flex-row-reverse' : 'ml-auto mr-0'}`}>
            {step === 4 ? t.submit : t.continue}
            <ChevronRight className={`w-4 h-4 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
}
