"use client";

import { CalendarDays, CreditCard, Users, TrendingUp } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

export default function AdminDashboard() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="space-y-6" dir={direction}>
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t.welcomeAdmin}</h1>
        <p className="text-muted">{t.overview}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t.totalBookings} value="12" icon={CalendarDays} trend={`+2 ${t.fromYesterday}`} />
        <StatCard title={t.revenue} value="EGP 4,200" icon={CreditCard} trend={`+15% ${t.fromYesterday}`} />
        <StatCard title={t.activeCourts} value="8" icon={Users} trend={t.operational} />
        <StatCard title={t.pendingPayments} value="3" icon={TrendingUp} trend={t.actionRequired} isAlert />
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t.recentBookings}</h2>
        <div className="text-center py-8 text-muted">
          <p>{t.bookingIntegration}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, isAlert = false }: any) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted">{title}</h3>
        <div className={`p-2 rounded-lg ${isAlert ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className={`text-sm ${isAlert ? 'text-danger' : 'text-success'}`}>{trend}</p>
      </div>
    </div>
  );
}
