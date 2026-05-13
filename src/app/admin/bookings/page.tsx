"use client";

import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

export default function BookingsPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];

  return (
    <div className="space-y-6" dir={direction}>
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t.bookings}</h1>
        <p className="text-muted">{t.bookingsSubtitle}</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="text-center py-12 text-muted">
          <p>{t.noBookings}</p>
        </div>
      </div>
    </div>
  );
}
