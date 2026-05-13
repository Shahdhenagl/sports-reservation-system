"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MapPin, 
  CalendarDays, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Languages,
  Trophy,
  Users
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clubInfo, setClubInfo] = useState<{name: string, logo: string} | null>(null);
  const pathname = usePathname();
  const { language, toggleLanguage, direction } = useLanguage();
  const t = translations[language];
  const supabase = createClient();

  useEffect(() => {
    async function loadClub() {
      const { data } = await (supabase.from("app_settings") as any)
        .select("app_name, club_logo_url")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setClubInfo({ name: data.app_name, logo: data.club_logo_url });
      }
    }
    loadClub();
  }, []);

  const navigation = [
    { name: t.dashboard, href: "/admin", icon: LayoutDashboard },
    { name: t.activities, href: "/admin/activities", icon: Trophy },
    { name: t.bookings, href: "/admin/bookings", icon: CalendarDays },
    { name: language === 'ar' ? 'العملاء' : 'Customers', href: "/admin/customers", icon: Users },
    { name: t.resources, href: "/admin/resources", icon: MapPin },
    { name: t.settings, href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background" dir={direction}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 ${direction === 'rtl' ? 'right-0' : 'left-0'} z-50 w-64 bg-surface border-inline-end border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex lg:w-64 lg:flex-col
        ${sidebarOpen ? 'translate-x-0' : (direction === 'rtl' ? 'translate-x-full' : '-translate-x-full')}
      `}>
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 border-b border-border">
          <span className="text-lg font-black text-foreground flex items-center gap-2 truncate">
            {clubInfo?.logo ? (
              <img src={clubInfo.logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-surface-hover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="truncate">{clubInfo?.name || t.adminPanel}</span>
          </span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all
                  ${isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted hover:bg-surface-hover hover:text-foreground'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`${direction === 'rtl' ? 'ml-3' : 'mr-3'} h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted group-hover:text-foreground'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={toggleLanguage}
            className="group flex w-full items-center px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-hover hover:text-foreground rounded-xl transition-all"
          >
            <Languages className={`${direction === 'rtl' ? 'ml-3' : 'mr-3'} h-5 w-5 flex-shrink-0`} />
            {t.language}
          </button>

          <button
            onClick={() => logoutAction()}
            className="group flex w-full items-center px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 rounded-xl transition-all"
          >
            <LogOut className={`${direction === 'rtl' ? 'ml-3' : 'mr-3'} h-5 w-5 flex-shrink-0 text-danger`} />
            {t.signOut}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface/50 backdrop-blur-md px-4 sm:px-6 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-lg font-bold text-foreground">{t.adminPanel}</span>
          <div className="w-6" /> {/* Spacer for centering */}
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
