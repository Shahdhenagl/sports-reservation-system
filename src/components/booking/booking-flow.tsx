"use client";

import { useState } from "react";
import { CalendarDays, MapPin, Trophy, CheckCircle2, ChevronRight, Upload, Clock } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;

export function BookingFlow() {
  const [step, setStep] = useState<Step>(1);

  // Mock data for UI demonstration
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const nextStep = () => setStep((s) => Math.min(s + 1, 5) as Step);
  const prevStep = () => setStep((s) => Math.max(s - 1, 1) as Step);

  return (
    <div className="glass rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
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
              <div className={`absolute top-5 h-[2px] w-[calc(20%-2.5rem)] ml-[10%] -z-10 transition-all duration-300 ${
                step > i ? 'bg-primary' : 'bg-surface'
              }`} style={{ left: `${(i - 1) * 20 + 10}%` }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="relative z-10 min-h-[400px]">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">What do you want to play?</h2>
              <p className="text-muted">Select your preferred sport and location</p>
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
                <span className="font-semibold text-lg text-white">Football</span>
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
                <span className="font-semibold text-lg text-white">Padel</span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">When do you want to play?</h2>
              <p className="text-muted">Select date and time slot</p>
            </div>
            
            {/* Mock Date/Time selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button className="p-4 rounded-xl border border-border bg-surface/50 text-white flex items-center justify-center gap-2 hover:border-primary transition-colors">
                <CalendarDays className="w-5 h-5 text-primary" />
                Select Date
              </button>
              <button className="p-4 rounded-xl border border-border bg-surface/50 text-white flex items-center justify-center gap-2 hover:border-primary transition-colors">
                <Clock className="w-5 h-5 text-primary" />
                Select Time
              </button>
            </div>
            <div className="p-4 rounded-xl bg-surface/30 border border-border text-center text-muted">
              <p>Calendar integration goes here.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Your Details</h2>
              <p className="text-muted">How can we reach you?</p>
            </div>
            <div className="space-y-4 max-w-md mx-auto">
              <input type="text" placeholder="Full Name" className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="tel" placeholder="Phone Number" className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary" />
              <textarea placeholder="Any special requests? (Optional)" className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Payment</h2>
              <p className="text-muted">Total: EGP 600.00</p>
            </div>
            
            <div className="max-w-md mx-auto space-y-6">
              <div className="p-6 rounded-2xl bg-surface/50 border border-primary/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Recommended</div>
                <h3 className="text-lg font-semibold text-white mb-2">InstaPay</h3>
                <p className="text-muted text-sm mb-4">Transfer to: <strong>sportsclub@instapay</strong></p>
                
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-white font-medium">Upload Payment Screenshot</p>
                  <p className="text-xs text-muted mt-1">JPEG, PNG up to 5MB</p>
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
            <h2 className="text-3xl font-bold text-white mb-2">Booking Requested!</h2>
            <p className="text-muted max-w-md mx-auto mb-6">
              Your request has been received and is pending admin review. We'll notify you once confirmed.
            </p>
            <div className="bg-surface/50 border border-border rounded-xl p-4 inline-block">
              <p className="text-sm text-muted mb-1">Booking Reference</p>
              <p className="text-2xl font-mono font-bold text-white tracking-widest">BK-8X9A2</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 pt-6 border-t border-border flex justify-between items-center relative z-10">
        {step > 1 && step < 5 ? (
          <button onClick={prevStep} className="px-6 py-2.5 rounded-xl font-medium text-white hover:bg-surface transition-colors">
            Back
          </button>
        ) : <div />}
        
        {step < 5 && (
          <button onClick={nextStep} className="px-8 py-2.5 rounded-xl font-medium text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center gap-2 ml-auto">
            {step === 4 ? 'Submit Booking' : 'Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
