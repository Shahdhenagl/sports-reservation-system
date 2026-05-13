"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { Trophy, Plus, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addActivityAction, deleteActivityAction } from "@/app/actions/activities";

export default function ActivitiesPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const supabase = createClient();

  const fetchActivities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: true });
    
    if (data) setActivities(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await addActivityAction(formData);
    if (result.success) {
      setIsAdding(false);
      fetchActivities();
    } else {
      alert(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      const result = await deleteActivityAction(id);
      if (result.success) {
        fetchActivities();
      }
    }
  };

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.activities}</h1>
          <p className="text-muted">Manage the sports activities shown in the booking flow</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover"
        >
          <Plus className="h-5 w-5" />
          {t.addActivity}
        </button>
      </div>

      {isAdding && (
        <div className="glass rounded-2xl p-6 border border-primary/20 animate-in fade-in zoom-in-95 duration-200">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.activityNameAr}</label>
                <input name="name_ar" required className="w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.activityNameEn}</label>
                <input name="name_en" required className="w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t.iconName} (Lucide icon name, e.g., Trophy, Activity, Dumbbell)</label>
              <input name="icon_name" defaultValue="Trophy" className="w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-xl text-muted hover:bg-surface transition-colors">{t.back}</button>
              <button type="submit" className="px-6 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors">{t.submit}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted">
            No activities found. Add your first one!
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="glass group relative overflow-hidden rounded-2xl p-6 transition-all hover:shadow-xl border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Trophy className="h-6 w-6" />
                </div>
                <button 
                  onClick={() => handleDelete(activity.id)}
                  className="p-2 text-danger opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/10 rounded-lg"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-foreground mt-4">{language === 'ar' ? activity.name_ar : activity.name_en}</h3>
              <p className="text-sm text-muted">{activity.name_en} / {activity.name_ar}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
