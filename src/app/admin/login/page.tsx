"use client";

import { LoginForm } from "@/components/admin/login-form";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

export default function LoginPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];

  return (
    <div className="flex min-h-screen items-center justify-center p-6 sm:p-12" dir={direction}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">{t.adminPanel}</h1>
          <p className="text-muted">{t.loginSubtitle}</p>
        </div>
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
