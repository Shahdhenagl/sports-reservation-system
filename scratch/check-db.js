const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gkrnetehaqpdasloqjaw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrcm5ldGVoYXFwZGFzbG9xamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODA5NjksImV4cCI6MjA5NDE1Njk2OX0.S5v6KI611CM_I5CwLlDryQRmZvmEjujHi-lfyS0gJ8k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("--- FETCHING BRANCHES ---");
  const { data: branches, error: bErr } = await supabase.from('branches').select('*');
  console.log("Branches error:", bErr);
  console.log("Branches:", branches);

  console.log("\n--- FETCHING ACTIVITIES ---");
  const { data: activities, error: aErr } = await supabase.from('activities').select('*');
  console.log("Activities error:", aErr);
  console.log("Activities:", activities);

  console.log("\n--- FETCHING BOOKINGS ---");
  const { data: bookings, error: boErr } = await supabase.from('bookings').select('*');
  console.log("Bookings error:", boErr);
  console.log("Bookings:", bookings ? bookings.slice(0, 5) : null);
}

main();
