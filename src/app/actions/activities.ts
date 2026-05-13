"use client"; // Note: This will be changed to server action if needed, but for now I'll use client-side for simplicity in the demo if requested. 
// Actually, let's make it a proper server action.

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addActivityAction(formData: FormData) {
  const supabase = await createClient();
  
  const name_ar = formData.get("name_ar") as string;
  const name_en = formData.get("name_en") as string;
  const icon_name = formData.get("icon_name") as string || "Trophy";

  const { error } = await supabase
    .from("activities")
    .insert([{ name_ar, name_en, icon_name }]);

  if (error) {
    console.error("Error adding activity:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/activities");
  revalidatePath("/"); // Also revalidate public page
  return { success: true };
}

export async function deleteActivityAction(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting activity:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/activities");
  revalidatePath("/");
  return { success: true };
}
