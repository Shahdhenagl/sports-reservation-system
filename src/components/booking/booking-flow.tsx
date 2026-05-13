"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Trophy, CheckCircle2, ChevronRight, Upload, Clock, Loader2, Medal, Dumbbell, Target, Bike, Waves, Swords, Flag, Crosshair, Activity } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { createClient } from "@/lib/supabase/client";

const AVAILABLE_ICONS = [
  { name: "Trophy", icon: Trophy },
  { name: "Medal", icon: Medal },
  { name: "Dumbbell", icon: Dumbbell },
  { name: "Target", icon: Target },
  { name: "Bike", icon: Bike },
  { name: "Waves", icon: Waves },
  { name: "Swords", icon: Swords },
  { name: "Flag", icon: Flag },
  { name: "Crosshair", icon: Crosshair },
  { name: "Activity", icon: Activity },
];

type Step = 1 | 2 | 3 | 4 | 5;

export function BookingFlow() {
  const [step, setStep] = useState<Step>(1);
  const { language, direction } = useLanguage();
  const t = translations[language];

  // Dynamic data
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [playersCount, setPlayersCount] = useState<number>(1);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // Step 3 state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("+20");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappCode, setWhatsappCode] = useState("+20");

  // Step 4 state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const supabase = createClient();

  useEffect(() => {
    async function fetchActivities() {
      const { data } = await (supabase
        .from("activities") as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      
      if (data) setActivities(data);
      setLoading(false);
    }
    fetchActivities();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedDuration) {
      const slots = [];
      const startMinutes = 8 * 60; // 08:00
      const endMinutes = 22 * 60;  // 22:00
      let currentMinutes = startMinutes;

      const now = new Date();
      const todayDateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const isToday = selectedDate === todayDateString;
      const currentHourMinutes = now.getHours() * 60 + now.getMinutes();

      while (currentMinutes <= endMinutes) {
        if (!isToday || currentMinutes > currentHourMinutes) {
          const h = Math.floor(currentMinutes / 60);
          const m = currentMinutes % 60;
          slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
        currentMinutes += selectedDuration;
      }
      setAvailableTimeSlots(slots);
      setSelectedTime(null); // Reset selected time if date/duration changes
    } else {
      setAvailableTimeSlots([]);
    }
  }, [selectedDate, selectedDuration]);

  // Get today's date string for input min attribute
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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
            
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {activities.map((activity) => (
                  <button 
                    key={activity.id}
                    onClick={() => {
                      setSelectedActivity(activity);
                      setSelectedDuration(activity.durations_options?.[0] || 60);
                      setPlayersCount(activity.min_players || 1);
                    }}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${
                      selectedActivity?.id === activity.id ? 'border-primary bg-primary/10' : 'border-border bg-surface/50 hover:border-muted'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      {(() => {
                        const iconObj = AVAILABLE_ICONS.find(i => i.name === (activity.icon_name || "Trophy"));
                        const IconComp = iconObj ? iconObj.icon : Trophy;
                        return <IconComp className="w-8 h-8" />;
                      })()}
                    </div>
                    <span className="font-semibold text-lg text-foreground">
                      {language === 'ar' ? activity.name_ar : activity.name_en}
                    </span>
                    <div className="text-sm text-muted">
                      {activity.pricing_type === 'per_person' ? t.perPerson : t.perCourt} - EGP {activity.base_price || 0}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className={`space-y-6 animate-in fade-in ${direction === 'rtl' ? 'slide-in-from-left-8' : 'slide-in-from-right-8'} duration-500`}>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t.whenToPlay}</h2>
              <p className="text-muted">{t.selectDateTime}</p>
            </div>
            
            {/* Functional Date/Time selection */}
            <div className="space-y-6 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.selectDate}</label>
                <div className="relative">
                  <div className={`absolute top-1/2 -translate-y-1/2 ${direction === 'rtl' ? 'right-4' : 'left-4'} pointer-events-none`}>
                    <CalendarDays className="w-5 h-5 text-primary" />
                  </div>
                  <input 
                    type="date" 
                    min={todayStr}
                    value={selectedDate || ''}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`w-full bg-surface/50 border border-border rounded-xl py-3 ${direction === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-foreground focus:ring-2 focus:ring-primary outline-none transition-colors hover:border-primary/50`}
                  />
                </div>
              </div>

              {selectedActivity?.durations_options?.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Select Duration</label>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedActivity.durations_options.map((duration: number) => (
                      <button
                        key={duration}
                        onClick={() => setSelectedDuration(duration)}
                        className={`py-2 rounded-xl border ${selectedDuration === duration ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border bg-surface/50 text-muted hover:border-primary/50'}`}
                      >
                        {duration} mins
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDate && availableTimeSlots.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t.selectTime}</label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-1">
                    {availableTimeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 text-sm rounded-lg border ${selectedTime === time ? 'border-primary bg-primary text-white font-medium shadow-md' : 'border-border bg-surface hover:border-primary/50 text-foreground transition-colors'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
              <input 
                type="text" 
                placeholder={t.fullName} 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary" 
                required
              />

              <div className="flex gap-2">
                <select 
                  value={phoneCode} 
                  onChange={(e) => setPhoneCode(e.target.value)}
                  className={`bg-surface/50 border border-border rounded-xl py-3 px-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                >
                  <option value="+20">+20</option>
                  <option value="+966">+966</option>
                  <option value="+971">+971</option>
                  <option value="+965">+965</option>
                  <option value="+974">+974</option>
                  <option value="+973">+973</option>
                </select>
                <input 
                  type="tel" 
                  placeholder={t.phoneNumber} 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 bg-surface/50 border border-border rounded-xl py-3 px-4 text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary" 
                  required
                />
              </div>

              <div className="flex gap-2">
                <select 
                  value={whatsappCode} 
                  onChange={(e) => setWhatsappCode(e.target.value)}
                  className={`bg-surface/50 border border-border rounded-xl py-3 px-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                >
                  <option value="+20">+20</option>
                  <option value="+966">+966</option>
                  <option value="+971">+971</option>
                  <option value="+965">+965</option>
                  <option value="+974">+974</option>
                  <option value="+973">+973</option>
                </select>
                <input 
                  type="tel" 
                  placeholder={t.whatsappNumber} 
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="flex-1 bg-surface/50 border border-border rounded-xl py-3 px-4 text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary" 
                  required
                />
              </div>
              
              {selectedActivity?.pricing_type === 'per_person' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'عدد اللاعبين' : 'Number of Players'}</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="number" 
                      min={selectedActivity.min_players || 1} 
                      max={selectedActivity.max_players || 10}
                      value={playersCount}
                      onChange={(e) => setPlayersCount(parseInt(e.target.value) || 1)}
                      onBlur={() => {
                        const min = selectedActivity.min_players || 1;
                        const max = selectedActivity.max_players || 10;
                        if (playersCount < min) setPlayersCount(min);
                        if (playersCount > max) setPlayersCount(max);
                      }}
                      className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none" 
                    />
                    <span className="text-sm text-muted whitespace-nowrap">
                      {selectedActivity.min_players} - {selectedActivity.max_players} {language === 'ar' ? 'مسموح بهم' : 'allowed'}
                    </span>
                  </div>
                </div>
              )}

              <textarea placeholder={t.specialRequests} className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className={`space-y-6 animate-in fade-in ${direction === 'rtl' ? 'slide-in-from-left-8' : 'slide-in-from-right-8'} duration-500`}>
             <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t.payment}</h2>
              <p className="text-muted">
                {t.total}: EGP {
                  (() => {
                    const basePrice = selectedActivity?.base_price || 0;
                    const durationMultiplier = selectedDuration ? selectedDuration / 60 : 1;
                    if (selectedActivity?.pricing_type === 'per_person') {
                      return (basePrice * playersCount * durationMultiplier).toFixed(2);
                    }
                    return (basePrice * durationMultiplier).toFixed(2);
                  })()
                }
              </p>
            </div>
            
            <div className="max-w-md mx-auto space-y-6">
              <div className="p-6 rounded-2xl bg-surface/50 border border-primary/50 relative overflow-hidden">
                <div className={`absolute top-0 ${direction === 'rtl' ? 'left-0' : 'right-0'} bg-primary text-white text-xs font-bold px-3 py-1 ${direction === 'rtl' ? 'rounded-br-lg' : 'rounded-bl-lg'}`}>{t.recommended}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">InstaPay</h3>
                <p className="text-muted text-sm mb-4">{t.transferTo}: <strong>sportsclub@instapay</strong></p>
                
                <label className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer group block">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleFileUpload}
                    className="hidden" 
                  />
                  {uploadPreview ? (
                    <div className="space-y-3">
                      <img src={uploadPreview} alt="Payment screenshot" className="max-h-48 mx-auto rounded-lg shadow-md" />
                      <p className="text-sm text-primary font-medium">{language === 'ar' ? '✅ تم رفع الصورة - اضغط لتغييرها' : '✅ Uploaded - Click to change'}</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm text-foreground font-medium">{t.uploadScreenshot}</p>
                      <p className="text-xs text-muted mt-1">{t.fileTypes}</p>
                    </>
                  )}
                </label>
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
          <button 
            onClick={nextStep} 
            disabled={
              (step === 1 && !selectedActivity) || 
              (step === 2 && (!selectedDate || !selectedTime || !selectedDuration)) ||
              (step === 3 && (!fullName || !phoneNumber || !whatsappNumber))
            }
            className={`px-8 py-2.5 rounded-xl font-medium text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${direction === 'rtl' ? 'mr-auto ml-0 flex-row-reverse' : 'ml-auto mr-0'}`}
          >
            {step === 4 ? t.submit : t.continue}
            <ChevronRight className={`w-4 h-4 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
}
