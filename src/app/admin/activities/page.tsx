"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { Trophy, Plus, Trash2, Pencil, Loader2, Medal, Dumbbell, Target, Bike, Waves, Swords, Flag, Crosshair, Activity } from "lucide-react";
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

export default function ActivitiesPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const [activities, setActivities] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  const [selectedIcon, setSelectedIcon] = useState("Trophy");
  const supabase = createClient();

  const renderIcon = (name: string, className: string = "h-6 w-6") => {
    const iconObj = AVAILABLE_ICONS.find(i => i.name === name);
    const IconComponent = iconObj ? iconObj.icon : Trophy;
    return <IconComponent className={className} />;
  };

  const fetchBranches = async () => {
    try {
      const { data } = await supabase.from("branches").select("*");
      if (data && data.length > 0) {
        setBranches(data);
      } else {
        const defaultBranch = {
          id: "default-branch-id",
          name: language === 'ar' ? 'الفرع الرئيسي' : 'Main Branch',
          address: language === 'ar' ? '123 شارع الرياضة، القاهرة' : '123 Sports Street, Cairo',
        };
        setBranches([defaultBranch]);
      }
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    await fetchBranches();
    const { data, error } = await (supabase
      .from("activities") as any)
      .select("*")
      .order("created_at", { ascending: true });
    
    if (data) setActivities(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name_ar = formData.get("name_ar") as string;
    const name_en = formData.get("name_en") as string;
    const icon_name = formData.get("icon_name") as string || "Trophy";
    
    // New fields
    const pricing_type = formData.get("pricing_type") as string;
    const base_price = parseFloat(formData.get("base_price") as string) || 0;
    const min_players = parseInt(formData.get("min_players") as string) || 1;
    const max_players = parseInt(formData.get("max_players") as string) || 10;
    const durationsStr = formData.get("durations_options") as string;
    const open_time = (formData.get("open_time") as string) || "08:00";
    const close_time = (formData.get("close_time") as string) || "22:00";
    
    // Parse comma-separated durations into JSON array
    const durations_options = durationsStr 
      ? durationsStr.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
      : [60];

    try {
      const payload = { 
        name_ar, 
        name_en, 
        icon_name,
        pricing_type,
        base_price,
        min_players,
        max_players,
        durations_options,
        open_time,
        close_time,
        branch_ids: selectedBranchIds
      };

      let error;
      if (editingActivity) {
        // Update
        const res = await (supabase.from("activities") as any)
          .update(payload)
          .eq("id", editingActivity.id);
        error = res.error;
      } else {
        // Insert
        const res = await (supabase.from("activities") as any)
          .insert([payload]);
        error = res.error;
      }

      if (error) {
        console.error("Supabase insert error:", error);
        alert(`Error: ${error.message}`);
        return;
      }

      setIsFormOpen(false);
      setEditingActivity(null);
      fetchActivities();
    } catch (err: any) {
      console.error("Unexpected error during add:", err);
      alert(`Unexpected error: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      try {
        const { error } = await (supabase
          .from("activities") as any)
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Supabase delete error:", error);
          alert(`Error: ${error.message}`);
          return;
        }

        fetchActivities();
      } catch (err: any) {
        console.error("Unexpected error during delete:", err);
        alert(`Unexpected error: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.activities}</h1>
          <p className="text-muted">{t.activitiesDesc}</p>
        </div>
        <button 
          onClick={() => { 
            setEditingActivity(null); 
            setSelectedIcon("Trophy"); 
            setSelectedBranchIds(branches.map(b => b.id));
            setIsFormOpen(true); 
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover"
        >
          <Plus className="h-5 w-5" />
          {t.addActivity}
        </button>
      </div>

      {isFormOpen && (
        <div className="glass rounded-2xl p-6 border border-primary/20 animate-in fade-in zoom-in-95 duration-200">
          <form key={editingActivity ? editingActivity.id : 'new'} onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.activityNameAr}</label>
                <input name="name_ar" required defaultValue={editingActivity?.name_ar || ''} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.activityNameEn}</label>
                <input name="name_en" required defaultValue={editingActivity?.name_en || ''} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.pricingType}</label>
                <select name="pricing_type" defaultValue={editingActivity?.pricing_type || 'per_court'} className={`w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                  <option value="per_court">{t.perCourt}</option>
                  <option value="per_person">{t.perPerson}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.basePrice}</label>
                <input name="base_price" type="number" required defaultValue={editingActivity?.base_price ?? 100} className={`w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none ${direction === 'rtl' ? 'text-right' : 'text-left'}`} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.minPlayers}</label>
                <input name="min_players" type="number" required defaultValue={editingActivity?.min_players ?? 1} min={1} className={`w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none ${direction === 'rtl' ? 'text-right' : 'text-left'}`} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.maxPlayers}</label>
                <input name="max_players" type="number" required defaultValue={editingActivity?.max_players ?? 10} min={1} className={`w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none ${direction === 'rtl' ? 'text-right' : 'text-left'}`} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'من الساعة (وقت الفتح)' : 'From Hour (Open Time)'}</label>
                <input name="open_time" type="time" required defaultValue={editingActivity?.open_time || '08:00'} className={`w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none ${direction === 'rtl' ? 'text-right' : 'text-left'}`} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'إلى الساعة (وقت الإغلاق)' : 'To Hour (Close Time)'}</label>
                <input name="close_time" type="time" required defaultValue={editingActivity?.close_time || '22:00'} className={`w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none ${direction === 'rtl' ? 'text-right' : 'text-left'}`} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.allowedDurations}</label>
                <input name="durations_options" placeholder="60, 90, 120" defaultValue={editingActivity?.durations_options?.join(', ') || '60'} className={`w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none ${direction === 'rtl' ? 'text-right' : 'text-left'}`} />
                <p className="text-xs text-muted mt-1">{t.commaSeparated}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.iconName}</label>
                <input type="hidden" name="icon_name" value={selectedIcon} />
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_ICONS.map((iconObj) => {
                    const IconComponent = iconObj.icon;
                    return (
                      <button
                        key={iconObj.name}
                        type="button"
                        onClick={() => setSelectedIcon(iconObj.name)}
                        className={`p-3 flex justify-center items-center rounded-xl border transition-all ${selectedIcon === iconObj.name ? 'border-primary bg-primary/10 text-primary scale-110 shadow-md' : 'border-border bg-surface/50 text-muted hover:border-primary/50'}`}
                        title={iconObj.name}
                      >
                        <IconComponent className="w-6 h-6" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Branch Selector Checkbox Grid */}
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-foreground">
                  {language === 'ar' ? 'الفروع التي يتواجد بها هذا النشاط:' : 'Branches available for this activity:'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedBranchIds.length === branches.length) {
                      setSelectedBranchIds([]);
                    } else {
                      setSelectedBranchIds(branches.map(b => b.id));
                    }
                  }}
                  className="text-xs font-bold text-primary hover:text-primary-hover transition-colors"
                >
                  {selectedBranchIds.length === branches.length 
                    ? (language === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All') 
                    : (language === 'ar' ? 'تحديد الكل' : 'Select All')}
                </button>
              </div>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 pt-1">
                {branches.map((branch) => {
                  const isChecked = selectedBranchIds.includes(branch.id);
                  return (
                    <label
                      key={branch.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-white dark:bg-slate-900 border-primary/40 shadow-sm text-primary' 
                          : 'bg-white/40 dark:bg-slate-900/40 border-border text-muted hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedBranchIds(selectedBranchIds.filter(id => id !== branch.id));
                          } else {
                            setSelectedBranchIds([...selectedBranchIds, branch.id]);
                          }
                        }}
                        className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"
                      />
                      <span className="text-sm font-semibold">{branch.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => { setIsFormOpen(false); setEditingActivity(null); }} className="px-4 py-2 rounded-xl text-muted hover:bg-surface transition-colors">{t.back}</button>
              <button type="submit" className="px-6 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors">
                {editingActivity ? t.update : t.submit}
              </button>
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
                  {renderIcon(activity.icon_name || "Trophy", "h-6 w-6")}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { 
                      setEditingActivity(activity); 
                      setSelectedIcon(activity.icon_name || "Trophy"); 
                      setSelectedBranchIds(activity.branch_ids || []);
                      setIsFormOpen(true); 
                      window.scrollTo({ top: 0, behavior: 'smooth' }); 
                    }}
                    className="p-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 rounded-lg"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(activity.id)}
                    className="p-2 text-danger opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/10 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground mt-4">{language === 'ar' ? activity.name_ar : activity.name_en}</h3>
              <p className="text-sm text-muted">{activity.name_en} / {activity.name_ar}</p>
              
              {/* Render branches badges */}
              <div className="flex flex-wrap gap-1 mt-3">
                {(activity.branch_ids || []).map((bId: string) => {
                  const branch = branches.find(b => b.id === bId);
                  if (!branch) return null;
                  return (
                    <span key={bId} className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                      {branch.name}
                    </span>
                  );
                })}
                {(!activity.branch_ids || activity.branch_ids.length === 0) && (
                  <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
                    {language === 'ar' ? 'لا يوجد فروع' : 'No branches'}
                  </span>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2 text-sm text-muted">
                <div className="flex justify-between items-center">
                  <span className="opacity-80">{t.pricing}:</span>
                  <span className="font-medium text-foreground">{activity.pricing_type === 'per_person' ? t.perPerson : t.perCourt}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-80">{t.price}:</span>
                  <span className="font-medium text-foreground">EGP {activity.base_price || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-80">{t.durations}:</span>
                  <span className="font-medium text-foreground">{(activity.durations_options || []).join(', ')} {t.mins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-80">{t.players}:</span>
                  <span className="font-medium text-foreground">{activity.min_players || 1} - {activity.max_players || 10}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-80">{language === 'ar' ? 'مواعيد العمل:' : 'Operating Hours:'}</span>
                  <span className="font-medium text-foreground">{(activity.open_time || '08:00')} - {(activity.close_time || '22:00')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
