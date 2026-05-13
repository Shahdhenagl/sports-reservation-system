"use client";

import { useEffect, useState } from "react";
import { 
  CalendarDays, MapPin, Trophy, CheckCircle2, ChevronRight, Upload, 
  Clock, Loader2, Medal, Dumbbell, Target, Bike, Waves, Swords, 
  Flag, Crosshair, Activity, Users, Phone, ExternalLink, 
  ShieldCheck, DollarSign, CreditCard, Smartphone, MessageCircle, MessageSquare 
} from "lucide-react";
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
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [playersCount, setPlayersCount] = useState<number>(1);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // Step 3 state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("+20");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappCode, setWhatsappCode] = useState("+20");

  const supabase = createClient();

  // Step 4 state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [specialRequests, setSpecialRequests] = useState("");
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [paymentMethod, setPaymentMethod] = useState<'instapay' | 'wallet'>('instapay');
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [appSettings, setAppSettings] = useState<any>(null);

  // Submission state
  const [bookingRef, setBookingRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const generateBookingRef = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'BK-';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const calculateTotal = () => {
    const basePrice = selectedActivity?.base_price || 0;
    const slotsCount = selectedTimes.length || 1;
    // The price is per slot duration as defined by the admin
    if (selectedActivity?.pricing_type === 'per_person') {
      return basePrice * playersCount * slotsCount;
    }
    return basePrice * slotsCount;
  };

  const handleSubmitBooking = async () => {
    setSubmitting(true);
    try {
      const ref = generateBookingRef();
      setBookingRef(ref);

      // 1. Find or create customer
      const { data: existingCustomers } = await (supabase
        .from('customers') as any)
        .select('*')
        .eq('phone', phoneNumber)
        .eq('phone_code', phoneCode)
        .limit(1);

      let customerId;
      if (existingCustomers && existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
      } else {
        const { data: newCustomer } = await (supabase
          .from('customers') as any)
          .insert([{
            full_name: fullName,
            phone: phoneNumber,
            phone_code: phoneCode,
            whatsapp: whatsappNumber,
            whatsapp_code: whatsappCode,
          }])
          .select()
          .single();
        customerId = newCustomer?.id;
      }

      // 2. Upload screenshot if exists
      let screenshotUrl = null;
      if (uploadedFile) {
        const fileName = `${ref}_${Date.now()}.${uploadedFile.name.split('.').pop()}`;
        const { data: uploadData } = await supabase.storage
          .from('payment-screenshots')
          .upload(fileName, uploadedFile);
        if (uploadData) {
          const { data: publicUrl } = supabase.storage
            .from('payment-screenshots')
            .getPublicUrl(fileName);
          screenshotUrl = publicUrl.publicUrl;
        }
      }

      // 3. Insert booking
      const activityName = language === 'ar' ? selectedActivity?.name_ar : selectedActivity?.name_en;
      await (supabase.from('bookings') as any).insert([{
        booking_ref: ref,
        customer_id: customerId,
        activity_id: selectedActivity?.id,
        activity_name: activityName,
        booking_date: selectedDate,
        booking_time: selectedTimes.join(', '),
        duration: selectedDuration,
        players_count: playersCount,
        total_price: calculateTotal(),
        amount_paid: paymentType === 'full' ? calculateTotal() : partialAmount,
        payment_type: paymentType,
        payment_method: paymentMethod,
        status: 'pending',
        payment_screenshot: screenshotUrl,
        special_requests: specialRequests || null,
      }]);

      setStep(5);
    } catch (err) {
      console.error('Booking submission error:', err);
      alert(language === 'ar' ? 'حدث خطأ أثناء الحجز، حاول مرة أخرى' : 'An error occurred, please try again');
    } finally {
      setSubmitting(false);
    }
  };


  useEffect(() => {
    async function fetchData() {
      const { data } = await (supabase
        .from("activities") as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (data) setActivities(data);

      const { data: settingsData } = await (supabase.from("app_settings") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (settingsData) setAppSettings(settingsData);

      setLoading(false);
    }
    fetchData();
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
      setSelectedTimes([]);
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
    <div className="glass rounded-[2.5rem] p-6 sm:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white/20 relative overflow-hidden bg-white/5 backdrop-blur-2xl" dir={direction}>
      {/* Decorative background glow */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-16 relative z-10 max-w-2xl mx-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center relative flex-1 group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 transform ${
              step >= i 
              ? 'bg-primary text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110' 
              : 'bg-surface/50 text-muted grayscale'
            }`}>
              {step > i ? <CheckCircle2 className="w-6 h-6" /> : i}
            </div>
            
            {/* Step label (optional/floating) */}
            <div className={`absolute -bottom-8 whitespace-nowrap text-[10px] font-bold uppercase tracking-tighter transition-all duration-500 ${
              step === i ? 'text-primary opacity-100 translate-y-0' : 'text-muted opacity-40 translate-y-1'
            }`}>
              {i === 1 && (language === 'ar' ? 'النشاط' : 'Activity')}
              {i === 2 && (language === 'ar' ? 'الوقت' : 'Time')}
              {i === 3 && (language === 'ar' ? 'بياناتك' : 'Details')}
              {i === 4 && (language === 'ar' ? 'الدفع' : 'Payment')}
              {i === 5 && (language === 'ar' ? 'تأكيد' : 'Confirm')}
            </div>

            {/* Connector Line */}
            {i < 5 && (
              <div className={`absolute top-6 ${direction === 'rtl' ? '-left-1/2' : '-right-1/2'} h-[3px] w-full -z-10`}>
                <div className={`h-full transition-all duration-700 ${step > i ? 'bg-primary shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-surface/30'}`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="relative z-10 min-h-[450px]">
        {step === 1 && (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center">
              <h2 className="text-4xl font-black text-foreground mb-3 tracking-tighter">
                {language === 'ar' ? 'ماذا تريد أن تلعب؟' : 'Ready to Play?'}
              </h2>
              <p className="text-muted text-lg max-w-lg mx-auto">{t.selectSport}</p>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted animate-pulse">{language === 'ar' ? 'جاري التحميل...' : 'Loading activities...'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {activities.map((activity) => (
                  <button 
                    key={activity.id}
                    onClick={() => {
                      setSelectedActivity(activity);
                      setSelectedDuration(activity.durations_options?.[0] || 60);
                      setPlayersCount(activity.min_players || 1);
                    }}
                    className={`group relative p-8 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center gap-6 overflow-hidden ${
                      selectedActivity?.id === activity.id 
                      ? 'border-primary bg-primary/10 shadow-2xl shadow-primary/20 scale-[1.02]' 
                      : 'border-border/40 bg-surface/30 hover:border-primary/40 hover:bg-surface/50 hover:scale-[1.01]'
                    }`}
                  >
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 ${
                      selectedActivity?.id === activity.id ? 'bg-primary text-white rotate-[10deg]' : 'bg-primary/10 text-primary group-hover:rotate-12'
                    }`}>
                      {(() => {
                        const iconObj = AVAILABLE_ICONS.find(i => i.name === (activity.icon_name || "Trophy"));
                        const IconComp = iconObj ? iconObj.icon : Trophy;
                        return <IconComp className="w-10 h-10" />;
                      })()}
                    </div>
                    
                    <div className="text-center z-10">
                      <span className="block font-black text-2xl text-foreground mb-2 tracking-tight">
                        {language === 'ar' ? activity.name_ar : activity.name_en}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2 text-primary font-bold">
                          <span>EGP {activity.base_price}</span>
                          <span className="w-1 h-1 rounded-full bg-primary/40" />
                          <span className="text-xs uppercase opacity-80">
                            {activity.pricing_type === 'per_person' ? (language === 'ar' ? 'للفرد' : 'Per Person') : (language === 'ar' ? 'للمباراة' : 'Per Match')}
                          </span>
                        </div>
                        <p className="text-xs text-muted font-medium opacity-60">
                          {activity.durations_options?.[0]} {language === 'ar' ? 'دقيقة / حجز' : 'mins / slot'}
                        </p>
                      </div>
                    </div>

                    {/* Subtle pattern or glow for active state */}
                    {selectedActivity?.id === activity.id && (
                      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className={`space-y-8 animate-in fade-in zoom-in-95 duration-500`}>
            <div className="text-center">
              <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">
                {language === 'ar' ? 'متى تريد اللعب؟' : 'When to Play?'}
              </h2>
              <p className="text-muted text-lg">{t.selectDateTime}</p>
            </div>
            
            <div className="grid gap-8 max-w-4xl mx-auto">
              {/* Date Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider px-1">{t.selectDate}</label>
                <div className="relative group">
                  <div className={`absolute top-1/2 -translate-y-1/2 ${direction === 'rtl' ? 'right-4' : 'left-4'} transition-transform group-focus-within:scale-110 z-10`}>
                    <CalendarDays className="w-6 h-6 text-primary" />
                  </div>
                  <input 
                    type="date" 
                    min={todayStr}
                    value={selectedDate || ''}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`w-full bg-surface/30 backdrop-blur-md border-2 border-border/50 rounded-2xl py-4 ${direction === 'rtl' ? 'pr-14 pl-6' : 'pl-14 pr-6'} text-foreground text-lg focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all hover:border-primary/30 relative z-0`}
                  />
                </div>
              </div>

              {/* Duration Options */}
              {selectedActivity?.durations_options?.length > 1 && (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider px-1">
                    {language === 'ar' ? 'مدة الفترة' : 'Slot Duration'}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {selectedActivity.durations_options.map((duration: number) => (
                      <button
                        key={duration}
                        onClick={() => setSelectedDuration(duration)}
                        className={`px-6 py-3 rounded-2xl border-2 transition-all font-bold ${
                          selectedDuration === duration 
                          ? 'border-primary bg-primary text-white shadow-xl shadow-primary/30 scale-105' 
                          : 'border-border/50 bg-surface/30 text-muted hover:border-primary/50 hover:bg-surface/50'
                        }`}
                      >
                        {duration} {language === 'ar' ? 'دقيقة' : 'mins'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Slots Grid */}
              {selectedDate && availableTimeSlots.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">
                      {t.selectTime}
                    </label>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-lg">
                      {language === 'ar' ? 'يمكنك اختيار أكثر من موعد' : 'Multi-select enabled'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 p-4 rounded-3xl bg-surface/20 border border-border/50 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {availableTimeSlots.map((time) => {
                      const isSelected = selectedTimes.includes(time);
                      return (
                        <button
                          key={time}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTimes(selectedTimes.filter(t => t !== time));
                            } else {
                              setSelectedTimes([...selectedTimes, time].sort());
                            }
                          }}
                          className={`py-3 text-sm font-bold rounded-xl border-2 transition-all ${
                            isSelected 
                            ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                            : 'border-border/50 bg-surface/50 hover:border-primary/50 text-foreground'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Player Count & Pricing Summary */}
              <div className="grid sm:grid-cols-2 gap-6 items-end mt-4">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider px-1">
                    {language === 'ar' ? 'عدد اللاعبين' : 'Players'}
                  </label>
                  <div className="relative group">
                    <Users className={`absolute top-1/2 -translate-y-1/2 ${direction === 'rtl' ? 'right-4' : 'left-4'} w-5 h-5 text-muted group-focus-within:text-primary transition-colors`} />
                    <input
                      type="number"
                      min={selectedActivity?.min_players || 1}
                      max={selectedActivity?.max_players || 10}
                      value={playersCount}
                      onChange={(e) => setPlayersCount(parseInt(e.target.value) || 1)}
                      className={`w-full bg-surface/30 border-2 border-border/50 rounded-2xl py-3 ${direction === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-foreground font-bold focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                    />
                  </div>
                </div>

                {selectedTimes.length > 0 && (
                  <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 animate-in slide-in-from-bottom-4">
                    <div className="relative z-10 flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs font-bold text-primary uppercase tracking-tighter">
                        <span>{language === 'ar' ? 'الإجمالي المبدئي' : 'Estimated Total'}</span>
                        <div className="flex gap-2">
                          <span>{selectedTimes.length} × {selectedDuration} {language === 'ar' ? 'د' : 'm'}</span>
                          {selectedActivity?.pricing_type === 'per_person' && <span>× {playersCount} {language === 'ar' ? 'فرد' : 'p'}</span>}
                        </div>
                      </div>
                      <div className="text-4xl font-black text-primary mt-1">
                        EGP {calculateTotal().toFixed(0)}
                      </div>
                    </div>
                    {/* Decorative background element */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center">
              <h2 className="text-4xl font-black text-foreground mb-3 tracking-tighter">
                {language === 'ar' ? 'بيانات التواصل' : 'Your Contact Details'}
              </h2>
              <p className="text-muted text-lg max-w-lg mx-auto">{t.reachYou}</p>
            </div>
            
            <div className="max-w-2xl mx-auto grid gap-6">
              <div className="relative group">
                <div className={`absolute top-1/2 -translate-y-1/2 ${direction === 'rtl' ? 'right-4' : 'left-4'} transition-transform group-focus-within:scale-110 z-10`}>
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <input 
                  type="text" 
                  placeholder={t.fullName} 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full bg-surface/30 backdrop-blur-md border-2 border-border/50 rounded-2xl py-4 ${direction === 'rtl' ? 'pr-12 pl-6' : 'pl-12 pr-6'} text-foreground text-lg focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all hover:border-primary/30 relative z-0`} 
                  required
                />
              </div>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-widest px-2">{t.phoneNumber}</label>
                  <div className="flex gap-2 relative group">
                    <select 
                      value={phoneCode} 
                      onChange={(e) => setPhoneCode(e.target.value)}
                      className="bg-surface/30 border-2 border-border/50 rounded-2xl py-4 px-3 text-foreground font-bold focus:border-primary outline-none appearance-none cursor-pointer"
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
                      placeholder="123 456 7890" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1 bg-surface/30 border-2 border-border/50 rounded-2xl py-4 px-6 text-foreground text-lg font-bold focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-widest px-2">{t.whatsappNumber}</label>
                  <div className="flex gap-2 relative group">
                    <div className="bg-surface/30 border-2 border-border/50 rounded-2xl py-4 px-3 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <select 
                      value={whatsappCode} 
                      onChange={(e) => setWhatsappCode(e.target.value)}
                      className="bg-surface/30 border-2 border-border/50 rounded-2xl py-4 px-3 text-foreground font-bold focus:border-primary outline-none appearance-none cursor-pointer"
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
                      placeholder="123 456 7890" 
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="flex-1 bg-surface/30 border-2 border-border/50 rounded-2xl py-4 px-6 text-foreground text-lg font-bold focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className={`absolute top-4 ${direction === 'rtl' ? 'right-4' : 'left-4'} z-10`}>
                  <MessageSquare className="w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
                </div>
                <textarea 
                  placeholder={t.specialRequests} 
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className={`w-full bg-surface/30 border-2 border-border/50 rounded-2xl ${direction === 'rtl' ? 'pr-12 pl-6' : 'pl-12 pr-6'} py-4 text-foreground placeholder-muted focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none min-h-[120px] transition-all relative z-0`} 
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center">
              <h2 className="text-4xl font-black text-foreground mb-3 tracking-tighter">
                {language === 'ar' ? 'تأكيد الدفع' : 'Payment Confirmation'}
              </h2>
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full">
                <span className="text-sm font-bold text-primary uppercase tracking-wider">{t.total}</span>
                <span className="text-lg font-black text-primary">EGP {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-8">
              {/* Payment Type Tabs */}
              {(appSettings?.deposit_enabled ?? true) && (
                <div className="flex p-1.5 bg-surface/30 backdrop-blur-md rounded-2xl border border-border/50">
                  <button
                    onClick={() => setPaymentType('full')}
                    className={`flex-1 py-3 px-6 rounded-xl font-black text-sm transition-all duration-300 ${
                      paymentType === 'full' 
                      ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                      : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {language === 'ar' ? 'دفع كامل المبلغ' : 'Pay Full Amount'}
                  </button>
                  <button
                    onClick={() => {
                      setPaymentType('partial');
                      const minPercent = appSettings?.min_deposit_percent ?? 10;
                      const minDeposit = calculateTotal() * (minPercent / 100);
                      setPartialAmount(minDeposit);
                    }}
                    className={`flex-1 py-3 px-6 rounded-xl font-black text-sm transition-all duration-300 ${
                      paymentType === 'partial' 
                      ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                      : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {language === 'ar' ? 'دفع عربون' : 'Pay Deposit'}
                  </button>
                </div>
              )}

              {paymentType === 'partial' && (
                <div className="space-y-3 animate-in slide-in-from-top-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-sm font-bold text-foreground/80 uppercase tracking-widest">
                      {language === 'ar' ? 'قيمة المبلغ الذي ستحوله' : 'Amount you will transfer'}
                    </label>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                      {language === 'ar' ? 'الحد الأدنى' : 'Min'} {appSettings?.min_deposit_percent ?? 10}%
                    </span>
                  </div>
                  <div className="relative group">
                    <input
                      type="number"
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(parseFloat(e.target.value) || 0)}
                      onBlur={() => {
                        const minPercent = appSettings?.min_deposit_percent ?? 10;
                        const minDeposit = calculateTotal() * (minPercent / 100);
                        if (partialAmount < minDeposit) setPartialAmount(minDeposit);
                        if (partialAmount > calculateTotal()) setPartialAmount(calculateTotal());
                      }}
                      className={`w-full bg-surface/30 border-2 border-border/50 rounded-2xl py-4 px-6 text-foreground text-2xl font-black focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                    />
                  </div>
                  <p className="text-[10px] text-muted px-2">
                    {language === 'ar' ? '* الحد الأدنى للعربون هو' : '* Minimum deposit is'} EGP {(calculateTotal() * ((appSettings?.min_deposit_percent ?? 10) / 100)).toFixed(0)}
                  </p>
                </div>
              )}

              {/* Payment Method Switcher */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('instapay')}
                  className={`relative overflow-hidden p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                    paymentMethod === 'instapay' 
                    ? 'border-primary bg-primary/10 shadow-xl' 
                    : 'border-border/50 bg-surface/30 hover:border-primary/30'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${paymentMethod === 'instapay' ? 'bg-primary text-white' : 'bg-surface text-primary'}`}>
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <span className="font-black text-sm tracking-tight">InstaPay</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('wallet')}
                  className={`relative overflow-hidden p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                    paymentMethod === 'wallet' 
                    ? 'border-primary bg-primary/10 shadow-xl' 
                    : 'border-border/50 bg-surface/30 hover:border-primary/30'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${paymentMethod === 'wallet' ? 'bg-primary text-white' : 'bg-surface text-primary'}`}>
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <span className="font-black text-sm tracking-tight">{language === 'ar' ? 'محفظة إلكترونية' : 'E-Wallet'}</span>
                </button>
              </div>

              {/* Dynamic Payment Details Card */}
              <div className="relative overflow-hidden rounded-[2.5rem] p-10 bg-gradient-to-br from-surface/80 to-surface/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <ShieldCheck className="w-32 h-32 text-primary" />
                </div>
                
                <div className="relative z-10 space-y-8">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">
                      {paymentMethod === 'instapay' ? 'InstaPay Transfer' : (language === 'ar' ? 'تحويل محفظة' : 'Wallet Transfer')}
                    </h3>
                    <p className="text-muted text-sm font-medium">
                      {language === 'ar' ? 'يرجى التحويل إلى البيانات التالية:' : 'Please transfer to the following details:'}
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-3xl p-8 border border-white/10 text-center space-y-4 group">
                    {paymentMethod === 'instapay' ? (
                      <div className="space-y-4">
                        <div className="text-4xl font-black text-primary tracking-tight break-all select-all">
                          {appSettings?.instapay_id || 'sportsclub@instapay'}
                        </div>
                        <a 
                          href={appSettings?.instapay_id?.includes('http') ? appSettings.instapay_id : `https://instapay.me/${appSettings?.instapay_id}`} 
                          target="_blank"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                        >
                          {language === 'ar' ? 'فتح في إنستا باي' : 'Open in InstaPay'}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-4xl font-black text-primary tracking-widest select-all">
                          {appSettings?.wallet_number || '01234567890'}
                        </div>
                        <a 
                          href={`tel:${appSettings?.wallet_number || '01234567890'}`}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                        >
                          {language === 'ar' ? 'اتصال بالرقم' : 'Call Number'}
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="bg-primary/5 rounded-2xl p-4 flex justify-between items-center border border-primary/10">
                    <span className="text-sm font-bold text-muted uppercase">{language === 'ar' ? 'المبلغ المطلوب' : 'Required Amount'}</span>
                    <span className="text-2xl font-black text-primary">EGP {(paymentType === 'full' ? calculateTotal() : partialAmount).toFixed(2)}</span>
                  </div>

                  {/* Screenshot Upload */}
                  <label className="relative block group cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/webp" 
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                    <div className={`p-8 rounded-[2rem] border-2 border-dashed transition-all duration-300 flex flex-col items-center gap-4 ${
                      uploadPreview 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'border-border/50 bg-white/5 hover:border-primary/50 hover:bg-primary/5'
                    }`}>
                      {uploadPreview ? (
                        <div className="relative group/preview">
                          <img src={uploadPreview} alt="Screenshot" className="max-h-48 rounded-2xl shadow-2xl transition-transform group-hover/preview:scale-[1.02]" />
                          <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="w-10 h-10 text-white" />
                          </div>
                          <p className="mt-4 text-sm font-black text-primary text-center">
                            {language === 'ar' ? '✅ تم الرفع - اضغط لتغيير الصورة' : '✅ Uploaded - Click to change'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-lg">
                            <Upload className="w-8 h-8" />
                          </div>
                          <div className="text-center">
                            <p className="font-black text-lg text-foreground mb-1">{t.uploadScreenshot}</p>
                            <p className="text-xs text-muted font-medium">{t.fileTypes}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </label>
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
            <div className="bg-surface/50 border border-border rounded-xl p-4 inline-block mb-6">
              <p className="text-sm text-muted mb-1">{t.bookingRef}</p>
              <p className="text-2xl font-mono font-bold text-foreground tracking-widest">{bookingRef}</p>
            </div>
            
            <div className="pt-6 border-t border-border max-w-sm mx-auto">
              <p className="text-sm text-muted mb-2">
                {language === 'ar' ? 'لإلغاء أو تعديل الحجز، يرجى التواصل مع خدمة العملاء' : 'To cancel or modify your booking, please contact customer service'}
              </p>
              <p className="text-lg font-bold text-primary">
                {appSettings?.customer_service_phone || '+20 123 456 7890'}
              </p>
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
            onClick={step === 4 ? handleSubmitBooking : nextStep} 
            disabled={
              submitting ||
              (step === 1 && !selectedActivity) || 
              (step === 2 && (!selectedDate || selectedTimes.length === 0 || !selectedDuration)) ||
              (step === 3 && (!fullName || !phoneNumber || !whatsappNumber)) ||
              (step === 4 && !paymentProof)
            }
            className={`px-8 py-2.5 rounded-xl font-medium text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${direction === 'rtl' ? 'mr-auto ml-0 flex-row-reverse' : 'ml-auto mr-0'}`}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {step === 4 ? t.submit : t.continue}
                <ChevronRight className={`w-4 h-4 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
