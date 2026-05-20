const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking Supabase connection...");
  
  const { data: branches, error: bErr } = await supabase.from('branches').select('*');
  if (bErr) {
    console.error("Error fetching branches:", bErr);
  } else {
    console.log("Branches:", branches);
  }

  const { data: activities, error: aErr } = await supabase.from('activities').select('*').limit(1);
  if (aErr) {
    console.error("Error fetching activities:", aErr);
  } else {
    console.log("Activity record sample:", activities);
  }
}

check();
